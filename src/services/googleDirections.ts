import { getGoogleMapsKey } from '@/config/env';
import { decodePolyline } from '@/utils/decodePolyline';

export interface RouteStep {
  instruction: string;
  distanceText: string;
  durationText: string;
}

export interface DrivingRoute {
  durationText: string;
  durationSecs: number;
  distanceText: string;
  distanceMetres: number;
  steps: RouteStep[];
  polyline: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * Fetch a driving route via Google Directions API (REST).
 * Origin = device GPS, destination = incident scene.
 */
export async function fetchDrivingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DrivingRoute> {
  const key = getGoogleMapsKey();
  if (!key) {
    throw new Error('Google Maps API key is not configured (EXPO_PUBLIC_GOOGLE_MAPS_KEY).');
  }

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: 'driving',
    departure_time: 'now',
    traffic_model: 'best_guess',
    key,
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`);
  const data = await res.json();

  if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
    throw new Error(data.error_message || data.status || 'No route found');
  }

  const route = data.routes[0];
  const leg = route.legs[0];
  const polyline: string = route.overview_polyline?.points ?? '';

  return {
    durationText: leg.duration_in_traffic?.text ?? leg.duration?.text ?? '',
    durationSecs: leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0,
    distanceText: leg.distance?.text ?? '',
    distanceMetres: leg.distance?.value ?? 0,
    steps: (leg.steps ?? []).map((s: any) => ({
      instruction: stripHtml(s.html_instructions ?? ''),
      distanceText: s.distance?.text ?? '',
      durationText: s.duration?.text ?? '',
    })),
    polyline,
    coordinates: decodePolyline(polyline),
  };
}
