import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import client from './client';
import type {
  ApiResponse,
  PaginatedMeta,
  PartnerAmbulance,
  PatientCareReport,
  Task,
  TaskHistoryItem,
  User,
  VehicleWithCrew,
} from '@/types/api';
import {
  clearPendingCheckIn,
  getPendingCheckIn,
  savePendingCheckIn,
  type PendingCheckIn,
} from '@/stores/pendingCheckIn';

/** Sends a 6-digit SMS code to an existing responder account's phone. */
export async function requestLoginOtp(phone: string): Promise<{ phone: string; expiresInSeconds: number }> {
  const res = await client.post<ApiResponse<{ phone: string; expiresInSeconds: number }>>(
    '/auth/otp/request',
    { phone }
  );
  return res.data.data;
}

/** Verifies the code and returns a signed session, same shape as the old password login. */
export async function verifyLoginOtp(phone: string, code: string) {
  const res = await client.post<ApiResponse<{ token: string; user: User }>>('/auth/otp/verify', {
    phone,
    code,
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

export async function postVehicleLocation(
  imei: string,
  lat: number,
  lng: number,
  locationName?: string | null
) {
  const res = await client.post<ApiResponse<unknown>>('/fleet/location', {
    imei,
    lat,
    lng,
    ...(locationName ? { locationName } : {}),
  });
  return res.data.data;
}

export async function getAgencyVehicles(): Promise<VehicleWithCrew[]> {
  const res = await client.get<ApiResponse<VehicleWithCrew[]>>('/fleet/vehicles');
  return res.data.data;
}

export async function getPartnerAmbulances(): Promise<PartnerAmbulance[]> {
  const res = await client.get<ApiResponse<PartnerAmbulance[]>>('/fleet/partner-ambulances');
  const payload = res.data?.data ?? (res.data as unknown);
  return Array.isArray(payload) ? payload : [];
}

export async function getMyCheckIn(): Promise<VehicleWithCrew | null> {
  const res = await client.get<ApiResponse<VehicleWithCrew | null>>('/fleet/my-checkin');
  return res.data.data;
}

async function persistSelfieLocally(photo: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<{ uri: string; name: string; type: string }> {
  const name =
    photo.fileName?.endsWith('.jpg') || photo.fileName?.endsWith('.jpeg')
      ? photo.fileName
      : `checkin-${Date.now()}.jpg`;
  const type = photo.mimeType ?? 'image/jpeg';
  const dest = `${FileSystem.documentDirectory}${name}`;

  try {
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: photo.uri, to: dest });
    return { uri: dest, name, type };
  } catch {
    // Fall back to the picker URI if copy fails (still works when JS didn't remount)
    return { uri: photo.uri, name, type };
  }
}

async function submitCheckInMultipart(pending: PendingCheckIn): Promise<VehicleWithCrew> {
  if (pending.lat == null || pending.lng == null || !pending.selfieUri) {
    throw new Error('Check-in is incomplete. Please take your selfie again.');
  }

  const form = new FormData();
  form.append('lat', String(pending.lat));
  form.append('lng', String(pending.lng));
  if (pending.locationName) form.append('locationName', pending.locationName);
  form.append('file', {
    uri: pending.selfieUri,
    name: pending.selfieName ?? `checkin-${Date.now()}.jpg`,
    type: pending.selfieType ?? 'image/jpeg',
  } as any);

  const res = await client.post<ApiResponse<VehicleWithCrew>>(
    `/fleet/${pending.vehicleId}/checkin`,
    form,
    { timeout: 60000, transformRequest: (data) => data }
  );

  if (pending.selfieUri.startsWith(FileSystem.documentDirectory ?? 'file://')) {
    FileSystem.deleteAsync(pending.selfieUri, { idempotent: true }).catch(() => {});
  }
  await clearPendingCheckIn();
  return res.data.data;
}

/**
 * If a previous attempt already captured GPS + selfie (e.g. before an Android remount),
 * finish the upload without opening the camera again.
 */
export async function resumePendingCheckInUpload(): Promise<VehicleWithCrew | null> {
  const pending = await getPendingCheckIn();
  if (!pending?.selfieUri || pending.lat == null || pending.lng == null) return null;
  return submitCheckInMultipart(pending);
}

/**
 * Capture GPS first (while the app is still in foreground), then selfie, then upload.
 * Progress is persisted so Android camera remounts don't lose the check-in.
 */
export async function checkInToVehicle(
  vehicleId: string,
  opts?: { registrationNumber?: string }
): Promise<VehicleWithCrew> {
  let pending = await savePendingCheckIn({
    vehicleId,
    registrationNumber: opts?.registrationNumber,
  });

  // 1) Location before camera — survives remount and shortens post-selfie wait
  if (pending.lat == null || pending.lng == null) {
    const { getCurrentCoords, reverseGeocodePlace } = await import('@/utils/location');
    const coords = await getCurrentCoords();
    let placeName: string | null = null;
    try {
      placeName = await reverseGeocodePlace(coords.lat, coords.lng);
    } catch {
      placeName = null;
    }
    pending = await savePendingCheckIn({
      vehicleId,
      registrationNumber: opts?.registrationNumber ?? pending.registrationNumber,
      lat: coords.lat,
      lng: coords.lng,
      locationName: placeName,
    });
  }

  // 2) Selfie — may remount the app on Android; URI is copied to documentDirectory
  if (!pending.selfieUri) {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      throw new Error('Camera permission is required to check in.');
    }

    const shot = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.55,
      allowsEditing: false,
      exif: false,
    });

    if (shot.canceled || !shot.assets?.[0]) {
      // Keep GPS pending so the user can finish with one more selfie tap
      throw new Error(
        'Selfie was not saved — the camera may have closed the app. Tap check-in again to finish.'
      );
    }

    const saved = await persistSelfieLocally(shot.assets[0]);
    pending = await savePendingCheckIn({
      vehicleId,
      registrationNumber: opts?.registrationNumber ?? pending.registrationNumber,
      lat: pending.lat,
      lng: pending.lng,
      locationName: pending.locationName,
      selfieUri: saved.uri,
      selfieName: saved.name,
      selfieType: saved.type,
    });
  }

  // 3) Upload
  return submitCheckInMultipart(pending);
}

export async function checkOutFromVehicle(vehicleId: string): Promise<VehicleWithCrew> {
  const res = await client.delete<ApiResponse<VehicleWithCrew>>(`/fleet/${vehicleId}/checkin`, {
    data: {},
  });
  return res.data.data;
}

export interface AssignableCrewMember {
  id: string;
  name: string;
  phone?: string | null;
  role: 'EMT' | 'NURSE';
  /** AVAILABLE = free to assign; TAKEN = already on another (or this) vehicle */
  status?: 'AVAILABLE' | 'TAKEN';
  assignedVehicleId?: string | null;
  assignedVehicleRegistration?: string | null;
}

export async function getAssignableCrew(): Promise<AssignableCrewMember[]> {
  const res = await client.get<ApiResponse<AssignableCrewMember[]>>('/fleet/crew-members');
  return res.data.data;
}

export async function assignVehicleCrew(
  vehicleId: string,
  crew: { emtId?: string | null; nurseId?: string | null }
): Promise<VehicleWithCrew> {
  const res = await client.post<ApiResponse<VehicleWithCrew>>(`/fleet/${vehicleId}/crew`, crew);
  return res.data.data;
}

export async function getAvailableHandoverVehicles(opts?: {
  excludeVehicleId?: string;
  lat?: number | null;
  lng?: number | null;
}): Promise<VehicleWithCrew[]> {
  const params: Record<string, string> = {};
  if (opts?.excludeVehicleId) params.excludeVehicleId = opts.excludeVehicleId;
  if (opts?.lat != null && Number.isFinite(opts.lat)) params.lat = String(opts.lat);
  if (opts?.lng != null && Number.isFinite(opts.lng)) params.lng = String(opts.lng);
  const res = await client.get<ApiResponse<VehicleWithCrew[]>>('/fleet/available-for-handover', {
    params: Object.keys(params).length ? params : undefined,
  });
  return res.data.data;
}

export async function handoverTask(
  taskId: string,
  data: { reason: string; newVehicleId?: string; autoAssign?: boolean }
) {
  const res = await client.post<
    ApiResponse<{
      handedOver?: Task;
      cancelled: Task;
      newTask: Task | null;
      checkedOutVehicleId: string;
    }>
  >(`/tasks/${taskId}/reassign`, data);
  return res.data.data;
}
