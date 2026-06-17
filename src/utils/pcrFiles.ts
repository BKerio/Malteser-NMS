import * as FileSystem from 'expo-file-system/legacy';
import { getApiBaseUrl } from '@/config/env';
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

export async function downloadPcrFile(taskId: string, reportId: string, mimeType: string): Promise<string> {
  const token = await getStoredToken();
  if (!token) throw new Error('Not signed in');

  const url = `${getApiBaseUrl()}/tasks/${taskId}/patient-care-reports/${reportId}/file`;
  const dest = `${FileSystem.cacheDirectory}pcr-${reportId}${extensionForMime(mimeType)}`;

  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) await FileSystem.deleteAsync(dest, { idempotent: true });

  const result = await FileSystem.downloadAsync(url, dest, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status !== 200) {
    throw new Error(`Failed to download report (${result.status})`);
  }

  return result.uri;
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
