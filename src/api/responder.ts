import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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

export async function closeIncident(incidentId: string, reason: string) {
  const res = await client.post<ApiResponse<unknown>>(`/incidents/${incidentId}/close`, { reason });
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
    file: { uri: string; name?: string; mimeType?: string };
  }
): Promise<PatientCareReport> {
  const form = new FormData();
  if (input.note) form.append('note', input.note);

  const uri = input.file.uri;
  const name = input.file.name ?? `pcr-${taskId}`;
  const type = input.file.mimeType ?? 'application/octet-stream';

  form.append('file', { uri, name, type } as any);

  // Do not set Content-Type manually — RN/axios must add the multipart boundary
  const res = await client.post<ApiResponse<PatientCareReport>>(
    `/tasks/${taskId}/patient-care-report`,
    form,
    { timeout: 60000 }
  );
  return res.data.data;
}

export async function getPatientCareReports(taskId: string): Promise<PatientCareReport[]> {
  const res = await client.get<ApiResponse<PatientCareReport[]>>(`/tasks/${taskId}/patient-care-reports`);
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

/**
 * Capture a selfie + GPS, then check in to a vehicle.
 * Backend requires multipart: lat, lng (before file), then file.
 */
export async function checkInToVehicle(vehicleId: string): Promise<VehicleWithCrew> {
  const cam = await ImagePicker.requestCameraPermissionsAsync();
  if (!cam.granted) throw new Error('Camera permission is required to check in.');

  const shot = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    quality: 0.6,
    allowsEditing: false,
  });
  if (shot.canceled) throw new Error('Check-in selfie is required.');
  const photo = shot.assets[0];

  const loc = await Location.requestForegroundPermissionsAsync();
  if (!loc.granted) throw new Error('Location permission is required to check in.');
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  // Text fields must come before the file (server reads them from the same stream)
  const form = new FormData();
  form.append('lat', String(pos.coords.latitude));
  form.append('lng', String(pos.coords.longitude));
  form.append('file', {
    uri: photo.uri,
    name: photo.fileName ?? `checkin-${Date.now()}.jpg`,
    type: photo.mimeType ?? 'image/jpeg',
  } as any);

  const res = await client.post<ApiResponse<VehicleWithCrew>>(
    `/fleet/${vehicleId}/checkin`,
    form,
    { timeout: 60000, transformRequest: (data) => data }
  );
  return res.data.data;
}

export async function checkOutFromVehicle(vehicleId: string): Promise<VehicleWithCrew> {
  const res = await client.delete<ApiResponse<VehicleWithCrew>>(`/fleet/${vehicleId}/checkin`, {
    data: {},
  });
  return res.data.data;
}
