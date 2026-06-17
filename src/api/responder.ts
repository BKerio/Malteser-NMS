import client from './client';
import type {
  ApiResponse,
  PaginatedMeta,
  Task,
  TaskHistoryItem,
  User,
  VehicleWithCrew,
} from '@/types/api';

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
