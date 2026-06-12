import client from './client';
import type { ApiResponse, Task, User } from '@/types/api';

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

export async function postVehicleLocation(imei: string, lat: number, lng: number) {
  const res = await client.post<ApiResponse<unknown>>('/fleet/location', { imei, lat, lng });
  return res.data.data;
}
