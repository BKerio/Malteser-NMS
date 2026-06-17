import client from './client';
import type {
  ApiResponse,
  PaginatedMeta,
  PatientCareReport,
  Task,
  TaskHistoryItem,
  User,
  VehicleWithCrew,
} from '@/types/api';
import { getApiBaseUrl } from '@/config/env';
import { getStoredToken } from '@/stores/authStorage';

export async function login(email: string, passwordRaw: string) {
  const res = await client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
    email,
    passwordRaw,
  });
  return res.data.data;
}

export async function getActiveTask(): Promise<Task | null> {
  const res = await client.get<ApiResponse<Task | null>>('/tasks/active');
  return res.data.data;
}

export async function getTaskHistory(page = 1, limit = 20) {
  const res = await client.get<ApiResponse<TaskHistoryItem[]> & { meta: PaginatedMeta }>(
    '/tasks/history',
    { params: { page, limit } }
  );
  return { data: res.data.data, meta: res.data.meta };
}

export async function updateTaskStatus(taskId: string, status: Task['status'], reason?: string) {
  const res = await client.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, { status, reason });
  return res.data.data;
}

export async function submitPatientData(
  taskId: string,
  data: { preHospitalManagement: string; dispatcherChallenges?: string }
) {
  const res = await client.post<ApiResponse<unknown>>(`/tasks/${taskId}/patient-data`, data);
  return res.data.data;
}

export async function uploadPatientCareReport(
  taskId: string,
  input: {
    note?: string;
    image: { uri: string; name?: string; mimeType?: string };
  }
): Promise<PatientCareReport> {
  const form = new FormData();
  if (input.note) form.append('note', input.note);

  const uri = input.image.uri;
  const name = input.image.name ?? `pcr-${taskId}.jpg`;
  const type = input.image.mimeType ?? 'image/jpeg';

  form.append('file', { uri, name, type } as any);

  const res = await client.post<ApiResponse<PatientCareReport>>(`/tasks/${taskId}/patient-care-report`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function getPatientCareReports(taskId: string): Promise<PatientCareReport[]> {
  const res = await client.get<ApiResponse<PatientCareReport[]>>(`/tasks/${taskId}/patient-care-reports`);
  return res.data.data;
}

export async function getPatientCareReportViewUrl(taskId: string, reportId: string): Promise<string> {
  const token = await getStoredToken();
  const base = getApiBaseUrl();
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${base}/tasks/${taskId}/patient-care-reports/${reportId}/file${qs}`;
}

export async function postVehicleLocation(imei: string, lat: number, lng: number) {
  const res = await client.post<ApiResponse<unknown>>('/fleet/location', { imei, lat, lng });
  return res.data.data;
}

export async function getAgencyVehicles(): Promise<VehicleWithCrew[]> {
  const res = await client.get<ApiResponse<VehicleWithCrew[]>>('/fleet/vehicles');
  return res.data.data;
}

export async function getMyCheckIn(): Promise<VehicleWithCrew | null> {
  const res = await client.get<ApiResponse<VehicleWithCrew | null>>('/fleet/my-checkin');
  return res.data.data;
}

export async function checkInToVehicle(vehicleId: string): Promise<VehicleWithCrew> {
  const res = await client.post<ApiResponse<VehicleWithCrew>>(`/fleet/${vehicleId}/checkin`);
  return res.data.data;
}

export async function checkOutFromVehicle(vehicleId: string): Promise<VehicleWithCrew> {
  const res = await client.delete<ApiResponse<VehicleWithCrew>>(`/fleet/${vehicleId}/checkin`);
  return res.data.data;
}
