import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { postVehicleLocation } from '@/api/responder';
import { reverseGeocodePlace } from '@/utils/location';
import type { Task, User, VehicleWithCrew } from '@/types/api';

const SYNC_INTERVAL_MS = 30_000;
/** Reverse-geocode about every 5 minutes while streaming GPS */
const GEOCODE_EVERY_N_TICKS = 10;

/**
 * Streams GPS to the backend for drivers who are checked in.
 * Periodically resolves a real place name (e.g. Kilimani) so the fleet board
 * shows names instead of raw coordinates.
 */
export function useLocationSync(
  task: Task | null,
  user: User | null,
  myVehicle?: VehicleWithCrew | null
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const lastPlaceRef = useRef<string | null>(myVehicle?.lastLocationName ?? null);

  const imei = task?.vehicle?.imei ?? (user?.role === 'DRIVER' ? myVehicle?.imei : undefined);

  useEffect(() => {
    lastPlaceRef.current = myVehicle?.lastLocationName ?? lastPlaceRef.current;
  }, [myVehicle?.lastLocationName]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!user || user.role !== 'DRIVER' || !imei) return;

    let cancelled = false;
    tickRef.current = 0;

    const syncLocation = async () => {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const shouldGeocode =
          !lastPlaceRef.current || tickRef.current % GEOCODE_EVERY_N_TICKS === 0;

        let placeName = lastPlaceRef.current;
        if (shouldGeocode) {
          const resolved = await reverseGeocodePlace(lat, lng);
          if (resolved) {
            placeName = resolved;
            lastPlaceRef.current = resolved;
          }
        }

        tickRef.current += 1;
        await postVehicleLocation(imei, lat, lng, placeName);
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
  }, [imei, user?.id, user?.role]);
}
