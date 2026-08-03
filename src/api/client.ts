import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  failoverApiBaseUrl,
  getApiBaseUrl,
  getApiBaseUrls,
  resolveApiBaseUrl,
} from '@/config/env';
import { getStoredToken, clearAuth } from '@/stores/authStorage';

const client = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let resolvePromise: Promise<string> | null = null;

/** Ensure we have probed candidates before the first real request. */
export async function ensureApiReady(): Promise<string> {
  if (!resolvePromise) {
    resolvePromise = resolveApiBaseUrl().then((url) => {
      client.defaults.baseURL = url;
      return url;
    });
  }
  return resolvePromise;
}

function isNetworkError(err: AxiosError): boolean {
  if (err.response) return false;
  return (
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNABORTED' ||
    err.code === 'ECONNREFUSED' ||
    err.message === 'Network Error' ||
    /network|refused|unreachable/i.test(err.message ?? '')
  );
}

client.interceptors.request.use(async (config) => {
  await ensureApiReady();
  config.baseURL = getApiBaseUrl();

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
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      await clearAuth();
      return Promise.reject(err);
    }

    const config = err.config as (InternalAxiosRequestConfig & { _retriedFailover?: boolean }) | undefined;
    if (config && !config._retriedFailover && isNetworkError(err) && getApiBaseUrls().length > 1) {
      const next = await failoverApiBaseUrl(config.baseURL ?? getApiBaseUrl());
      if (next) {
        client.defaults.baseURL = next;
        resolvePromise = Promise.resolve(next);
        config._retriedFailover = true;
        config.baseURL = next;
        return client.request(config);
      }
    }

    return Promise.reject(err);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      if (err.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';
      const tried = getApiBaseUrls().join(' | ');
      return `Cannot reach server (${getApiBaseUrl()}). Tried: ${tried}. Check network / API URL.`;
    }
    if (err.response.status === 413) {
      return 'File is too large. Use a smaller photo/PDF (under ~20MB) or take a new compressed photo.';
    }
    return err.response?.data?.message ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export default client;
