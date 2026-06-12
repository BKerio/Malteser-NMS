import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { postVehicleLocation } from '@/api/responder';
import type { Task, User } from '@/types/api';

const SYNC_INTERVAL_MS = 30_000;

/**
 * Streams GPS to the backend for drivers on an active task.
 */
export function useLocationSync(task: Task | null, user: User | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!task || !user || user.role !== 'DRIVER') return;

    const imei = task.vehicle?.imei;
    if (!imei) return;

    let cancelled = false;

    const syncLocation = async () => {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        await postVehicleLocation(imei, position.coords.latitude, position.coords.longitude);
      } catch {
        // Best-effort — network or GPS may be unavailable
      }
    };

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        await syncLocation();
        intervalRef.current = setInterval(syncLocation, SYNC_INTERVAL_MS);
      } catch {
        // Permission API unavailable or denied
      }
    })();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [task?.id, task?.vehicle?.imei, user?.id, user?.role]);
}
