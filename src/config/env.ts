import { Platform } from 'react-native';

/**
 * API base URL for the NMS-EOC backend.
 * Set EXPO_PUBLIC_API_URL in .env for physical devices (use your machine's LAN IP).
 * Android emulator: 10.0.2.2 maps to host localhost.
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  }
  return 'https://api.nms-eoc.com';
}

export function getSocketUrl(): string {
  return process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/$/, '') ?? getApiBaseUrl();
}

/** Same key as web `VITE_GOOGLE_MAPS_KEY` — enable Directions + Maps SDK. */
export function getGoogleMapsKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY?.trim();
  return key || null;
}

