import * as Location from 'expo-location';
import { getGoogleMapsKey } from '@/config/env';

function pickGooglePlaceLabel(components: Array<{ long_name: string; types: string[] }>): string | null {
  const byType = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name?.trim() || null;

  const primary =
    byType('neighborhood') ||
    byType('sublocality_level_1') ||
    byType('sublocality') ||
    byType('sublocality_level_2') ||
    byType('administrative_area_level_3') ||
    byType('colloquial_area') ||
    byType('locality') ||
    byType('administrative_area_level_2');

  if (!primary) return null;

  const city = byType('locality') || byType('administrative_area_level_2');
  if (city && city.toLowerCase() !== primary.toLowerCase()) {
    return `${primary}, ${city}`;
  }
  return primary;
}

function pickExpoPlaceLabel(r: Location.LocationGeocodedAddress): string | null {
  // Expo fields vary by platform; district/subregion often hold estate names in KE
  const primary =
    r.district ||
    r.subregion ||
    r.city ||
    r.name ||
    r.street ||
    r.region ||
    null;
  if (!primary?.trim()) return null;

  const city = r.city || r.subregion || r.region;
  if (city && city.toLowerCase() !== primary.toLowerCase()) {
    return `${primary.trim()}, ${city.trim()}`;
  }
  return primary.trim();
}

async function geocodeGoogle(lat: number, lng: number, apiKey: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lng}`)}` +
      `&key=${encodeURIComponent(apiKey)}&language=en`;

    const res = await fetch(url, { signal: controller.signal });
    const body = await res.json();
    if (body?.status !== 'OK' || !body?.results?.length) return null;

    const result = body.results[0];
    const fromComponents = pickGooglePlaceLabel(result.address_components ?? []);
    if (fromComponents) return fromComponents;

    const parts = String(result.formatted_address || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
    return parts[0] || null;
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeNominatim(lat: number, lng: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}` +
      `&lon=${encodeURIComponent(String(lng))}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NCCG-Responder/1.0',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    const a = body?.address ?? {};
    const primary =
      a.suburb ||
      a.neighbourhood ||
      a.neighborhood ||
      a.quarter ||
      a.city_district ||
      a.district ||
      a.village ||
      a.town ||
      a.city ||
      null;
    if (!primary) {
      return body?.display_name?.split(',')[0]?.trim() || null;
    }
    const city = a.city || a.town || a.state;
    if (city && city.toLowerCase() !== String(primary).toLowerCase()) {
      return `${primary}, ${city}`;
    }
    return String(primary);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve GPS to a real place name (e.g. "Kilimani, Nairobi").
 * Tries Google → device geocoder → OpenStreetMap.
 */
export async function reverseGeocodePlace(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const key = getGoogleMapsKey();
  if (key) {
    try {
      const google = await geocodeGoogle(lat, lng, key);
      if (google) return google;
    } catch {
      // continue
    }
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const label = results[0] ? pickExpoPlaceLabel(results[0]) : null;
    if (label) return label;
  } catch {
    // continue
  }

  try {
    return await geocodeNominatim(lat, lng);
  } catch {
    return null;
  }
}

/** Ensure foreground location permission; throws a user-facing message if denied. */
export async function requireLocationPermission(): Promise<void> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return;

  const asked = await Location.requestForegroundPermissionsAsync();
  if (!asked.granted) {
    throw new Error('Location permission is required. Enable location for NCCG in your phone settings.');
  }
}

export async function getCurrentCoords(accuracy: Location.Accuracy = Location.Accuracy.High) {
  await requireLocationPermission();
  const pos = await Location.getCurrentPositionAsync({ accuracy });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  };
}

/** True if a string looks like raw coordinates rather than a place name. */
export function looksLikeCoordinates(value?: string | null): boolean {
  if (!value) return true;
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(value.trim());
}
