import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import { getGoogleMapsKey } from '@/config/env';
import { useTheme } from '@/context/ThemeContext';
import { fetchDrivingRoute, type DrivingRoute } from '@/services/googleDirections';
import { openGoogleMapsNavigation } from '@/utils/openGoogleMapsNavigation';

export default function NavigateScreen() {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    label?: string;
  }>();

  const destination = useMemo(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, label: params.label || 'Incident scene' };
  }, [params.lat, params.lng, params.label]);

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoute = useCallback(async () => {
    if (!destination) {
      setError('Missing scene coordinates');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Location permission is required for routing');
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const from = {
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      };
      setOrigin(from);

      if (!getGoogleMapsKey()) {
        setRoute(null);
        setError('Add EXPO_PUBLIC_GOOGLE_MAPS_KEY to enable in-app routing.');
        return;
      }

      const next = await fetchDrivingRoute(from, destination);
      setRoute(next);

      const coords = [
        { latitude: from.lat, longitude: from.lng },
        ...next.coordinates,
        { latitude: destination.lat, longitude: destination.lng },
      ];
      requestAnimationFrame(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 60, right: 40, bottom: 80, left: 40 },
          animated: true,
        });
      });
    } catch (err: any) {
      setRoute(null);
      setError(err?.message || 'Could not load route');
    } finally {
      setLoading(false);
    }
  }, [destination]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  const startGoogleNav = async () => {
    if (!destination) return;
    try {
      await openGoogleMapsNavigation(destination.lat, destination.lng);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not open Google Maps',
        text2: err?.message,
        position: 'bottom',
      });
    }
  };

  const initialRegion = {
    latitude: destination?.lat ?? 0,
    longitude: destination?.lng ?? 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Navigate to scene" subtitle={destination?.label} showBack />

      <View style={styles.mapWrap}>
        {destination ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
            toolbarEnabled={false}
          >
            {origin && (
              <Marker
                coordinate={{ latitude: origin.lat, longitude: origin.lng }}
                title="You"
                pinColor={colors.accent}
              />
            )}
            <Marker
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              title={destination.label}
              description="Incident scene"
            />
            {route?.coordinates?.length ? (
              <Polyline
                coordinates={route.coordinates}
                strokeColor={colors.primary}
                strokeWidth={5}
              />
            ) : null}
          </MapView>
        ) : (
          <View style={[styles.centered, { backgroundColor: colors.card }]}>
            <AppText secondary>No destination provided</AppText>
          </View>
        )}

        {loading && (
          <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
            <ActivityIndicator size="large" color={colors.onPrimary} />
            <AppText color={colors.onPrimary} style={{ marginTop: 12 }}>
              Calculating route…
            </AppText>
          </View>
        )}
      </View>

      <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {route ? (
          <>
            <View style={styles.etaRow}>
              <View>
                <AppText size={12} muted bold>
                  ETA WITH TRAFFIC
                </AppText>
                <AppText size={22} bold style={{ marginTop: 2 }}>
                  {route.durationText}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText size={12} muted bold>
                  DISTANCE
                </AppText>
                <AppText size={18} bold style={{ marginTop: 2 }}>
                  {route.distanceText}
                </AppText>
              </View>
            </View>

            <ScrollView style={styles.steps} showsVerticalScrollIndicator={false}>
              {route.steps.slice(0, 8).map((step, i) => (
                <View key={`${i}-${step.instruction}`} style={[styles.stepRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.stepIndex, { backgroundColor: colors.noteBg }]}>
                    <AppText size={12} bold muted>
                      {i + 1}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText size={14}>{step.instruction}</AppText>
                    <AppText size={12} secondary style={{ marginTop: 2 }}>
                      {step.distanceText}
                      {step.durationText ? ` · ${step.durationText}` : ''}
                    </AppText>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        ) : (
          <AppText secondary style={{ marginBottom: 12 }}>
            {error || 'Route unavailable'}
          </AppText>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={loadRoute}
            disabled={loading}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
            <AppText size={14} bold>
              Refresh
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={startGoogleNav}
            disabled={!destination}
          >
            <Ionicons name="navigate" size={18} color={colors.onPrimary} />
            <AppText size={14} bold color={colors.onPrimary}>
              Start Google Maps
            </AppText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <AppText size={13} muted>
            Back to assignment
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { flex: 1, minHeight: 260 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    maxHeight: '46%',
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  steps: { maxHeight: 160, marginBottom: 12 },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backLink: { alignItems: 'center', marginTop: 10 },
});
