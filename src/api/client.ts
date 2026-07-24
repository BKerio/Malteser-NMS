import axios from 'axios';
import { getApiBaseUrl } from '@/config/env';
import { getStoredToken, clearAuth } from '@/stores/authStorage';

const client = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Default JSON Content-Type breaks FormData (missing boundary → "request is not multipart")
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', undefined as unknown as string);
    }
    delete (config.headers as Record<string, unknown>)['Content-Type'];
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await clearAuth();
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      if (err.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';
      return `Cannot reach server (${getApiBaseUrl()}). Check network / API URL.`;
    }
    return err.response?.data?.message ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export default client;
