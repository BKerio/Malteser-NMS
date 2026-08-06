import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nms_pending_checkin';

/** Survives Android camera remounts so check-in can finish after the app reloads. */
export type PendingCheckIn = {
  vehicleId: string;
  registrationNumber?: string;
  lat?: number;
  lng?: number;
  locationName?: string | null;
  selfieUri?: string;
  selfieName?: string;
  selfieType?: string;
  updatedAt: number;
};

const MAX_AGE_MS = 20 * 60 * 1000;

export async function getPendingCheckIn(): Promise<PendingCheckIn | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingCheckIn;
    if (!parsed?.vehicleId || !parsed.updatedAt) {
      await clearPendingCheckIn();
      return null;
    }
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      await clearPendingCheckIn();
      return null;
    }
    return parsed;
  } catch {
    await clearPendingCheckIn();
    return null;
  }
}

export async function savePendingCheckIn(
  patch: Partial<PendingCheckIn> & { vehicleId: string }
): Promise<PendingCheckIn> {
  const prev = await getPendingCheckIn();
  const next: PendingCheckIn = {
    ...(prev?.vehicleId === patch.vehicleId ? prev : {}),
    ...patch,
    vehicleId: patch.vehicleId,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearPendingCheckIn(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
