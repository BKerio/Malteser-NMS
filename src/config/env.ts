import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  apiUrls?: string[];
  socketUrl?: string;
  googleMapsKey?: string;
};

/** Currently selected API base (first reachable). Updated by resolveApiBaseUrl(). */
let activeApiBaseUrl: string | null = null;

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function parseUrlList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,|\s]+/)
    .map(normalizeUrl)
    .filter(Boolean);
}

/**
 * IP/host of the machine running Metro (your PC), from Expo.
 * On a physical phone this is the LAN IP (e.g. 192.168.100.158).
 * On Android emulator it may be unset — we fall back to 10.0.2.2.
 */
function getExpoDevHost(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    (Constants as { debuggerHost?: string }).debuggerHost,
    // Legacy manifest shapes
    (Constants as { manifest?: { debuggerHost?: string; hostUri?: string } }).manifest
      ?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string; hostUri?: string } }).manifest?.hostUri,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    // "192.168.100.158:8081" or "192.168.100.158:8081/path"
    const host = raw.split('/')[0]?.split(':')[0]?.trim();
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }
  return null;
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isLocalCandidate(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return isLoopbackHost(host) || host === '10.0.2.2' || /^192\.168\./.test(host) || /^10\./.test(host);
  } catch {
    return false;
  }
}

/**
 * Map localhost/127.0.0.1 to an address the device/emulator can actually reach.
 * - Android emulator → 10.0.2.2 (special alias to the host machine)
 * - Physical device → Expo LAN IP (same Wi‑Fi as your PC)
 * - iOS simulator → localhost is fine
 */
function rewriteReachableUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!isLoopbackHost(parsed.hostname)) {
      return normalizeUrl(url);
    }

    const expoHost = getExpoDevHost();

    if (Platform.OS === 'android') {
      // Prefer Expo host when present (physical device on LAN); else emulator loopback.
      parsed.hostname = expoHost ?? '10.0.2.2';
      return normalizeUrl(parsed.toString());
    }

    // iOS: simulator can use localhost; device needs LAN IP from Expo
    if (expoHost) {
      parsed.hostname = expoHost;
      return normalizeUrl(parsed.toString());
    }

    return normalizeUrl(url);
  } catch {
    return normalizeUrl(url);
  }
}

/**
 * Candidate API base URLs, in preference order.
 * Supports comma-separated EXPO_PUBLIC_API_URL, e.g.:
 *   EXPO_PUBLIC_API_URL=http://127.0.0.1:3000,http://156.67.25.84:8080
 *
 * Loopback hosts are rewritten for Android / physical devices.
 * In __DEV__, local candidates are tried before remote ones.
 */
export function getApiBaseUrls(): string[] {
  const fromEnv = parseUrlList(process.env.EXPO_PUBLIC_API_URL);
  const fromExtraList = Array.isArray(extra.apiUrls)
    ? extra.apiUrls.map(normalizeUrl).filter(Boolean)
    : [];
  const fromExtraSingle = parseUrlList(extra.apiUrl);

  const defaults =
    fromEnv.length || fromExtraList.length || fromExtraSingle.length
      ? []
      : __DEV__
        ? [Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000']
        : ['http://156.67.25.84:8080'];

  const seen = new Set<string>();
  const raw: string[] = [];
  for (const u of [...fromEnv, ...fromExtraList, ...fromExtraSingle, ...defaults]) {
    const rewritten = rewriteReachableUrl(u);
    if (!seen.has(rewritten)) {
      seen.add(rewritten);
      raw.push(rewritten);
    }
  }

  if (!__DEV__ || raw.length <= 1) return raw;

  // Dev: try LAN/local backends first so a live remote doesn't "win" the probe
  const local = raw.filter(isLocalCandidate);
  const remote = raw.filter((u) => !isLocalCandidate(u));
  return [...local, ...remote];
}

/**
 * Preferred / last-resolved API base URL.
 * Call resolveApiBaseUrl() at startup so this picks a reachable host.
 */
export function getApiBaseUrl(): string {
  return activeApiBaseUrl ?? getApiBaseUrls()[0] ?? 'http://156.67.25.84:8080';
}

export function setActiveApiBaseUrl(url: string) {
  activeApiBaseUrl = normalizeUrl(url);
}

/** True when the host answered over HTTP (any status means the server is up). */
async function probeUrl(baseUrl: string, timeoutMs = 2500): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/`, {
      method: 'GET',
      signal: controller.signal,
    });
    // Any HTTP response = server is up (404/401/etc. are fine)
    return res != null;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return false;
    const message = err instanceof Error ? err.message : String(err);
    if (/network|failed|refused|unreachable|timed?\s*out/i.test(message)) return false;
    // Some RN stacks throw on non-2xx; still means the host answered
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe candidates in order and lock onto the first reachable API.
 * Safe to call multiple times; returns the cached winner when already resolved.
 */
export async function resolveApiBaseUrl(force = false): Promise<string> {
  if (activeApiBaseUrl && !force) return activeApiBaseUrl;

  const candidates = getApiBaseUrls();
  if (__DEV__) {
    console.log('[api] candidates:', candidates.join(' → '));
  }

  if (candidates.length === 1) {
    setActiveApiBaseUrl(candidates[0]);
    return candidates[0];
  }

  for (const url of candidates) {
    const ok = await probeUrl(url);
    if (__DEV__) {
      console.log(`[api] probe ${url} → ${ok ? 'ok' : 'fail'}`);
    }
    if (ok) {
      setActiveApiBaseUrl(url);
      return url;
    }
  }

  setActiveApiBaseUrl(candidates[0]);
  if (__DEV__) {
    console.warn(`[api] no candidate reachable; falling back to ${candidates[0]}`);
  }
  return candidates[0];
}

/**
 * After a network failure against the active host, try the remaining URLs.
 * Returns the new base URL if one works, otherwise null.
 */
export async function failoverApiBaseUrl(failedUrl?: string): Promise<string | null> {
  const failed = normalizeUrl(failedUrl ?? getApiBaseUrl());
  const candidates = getApiBaseUrls().filter((u) => u !== failed);

  for (const url of candidates) {
    if (await probeUrl(url)) {
      setActiveApiBaseUrl(url);
      if (__DEV__) {
        console.log(`[api] failover → ${url}`);
      }
      return url;
    }
  }
  return null;
}

export function getSocketUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SOCKET_URL || extra.socketUrl;
  if (fromEnv?.trim()) return rewriteReachableUrl(fromEnv);
  return getApiBaseUrl();
}

/** Same key as web `VITE_GOOGLE_MAPS_KEY` — enable Directions + Maps SDK. */
export function getGoogleMapsKey(): string | null {
  const key = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || extra.googleMapsKey || '').trim();
  return key || null;
}uu
