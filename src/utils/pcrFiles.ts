import * as FileSystem from 'expo-file-system/legacy';
import client from '@/api/client';
import { getStoredToken } from '@/stores/authStorage';

export type PcrFileKind = 'image' | 'pdf' | 'docx' | 'unknown';

export function getPcrFileKind(mimeType: string): PcrFileKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  return 'unknown';
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return '.heic';
  return '.jpg';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function downloadPcrFile(taskId: string, reportId: string, mimeType: string): Promise<string> {
  const token = await getStoredToken();
  if (!token) throw new Error('Not signed in');

  const dest = `${FileSystem.cacheDirectory}pcr-${reportId}${extensionForMime(mimeType)}`;

  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) await FileSystem.deleteAsync(dest, { idempotent: true });

  // Axios client attaches JWT via interceptor (more reliable than downloadAsync headers).
  const response = await client.get(`/tasks/${taskId}/patient-care-reports/${reportId}/file`, {
    responseType: 'arraybuffer',
  });

  const base64 = arrayBufferToBase64(response.data as ArrayBuffer);
  await FileSystem.writeAsStringAsync(dest, base64, { encoding: FileSystem.EncodingType.Base64 });

  return dest;
}

export async function readPcrFileBase64(localUri: string): Promise<string> {
  return FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
