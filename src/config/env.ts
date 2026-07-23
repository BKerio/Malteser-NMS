import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  socketUrl?: string;
  googleMapsKey?: string;
};

/**
 * API base URL for the NMS-EOC backend.
 * Prefer EXPO_PUBLIC_* (Metro/.env), then app.config.js `extra`, then platform defaults.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL || extra.apiUrl;
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  }
  return 'http://156.67.25.84:8080';
}

export function getSocketUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SOCKET_URL || extra.socketUrl;
  return fromEnv?.replace(/\/$/, '') ?? getApiBaseUrl();
}

/** Same key as web `VITE_GOOGLE_MAPS_KEY` — enable Directions + Maps SDK. */
export function getGoogleMapsKey(): string | null {
  const key = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || extra.googleMapsKey || '').trim();
  return key || null;
}
