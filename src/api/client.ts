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
    return err.response?.data?.message ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export default client;
