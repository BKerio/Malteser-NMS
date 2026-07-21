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
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import { getGoogleMapsKey } from '@/config/env';
import { useTheme } from '@/context/ThemeContext';
import { fetchDrivingRoute, type DrivingRoute } from '@/services/googleDirections';

export default function NavigateScreen() {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
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
  const [navigating, setNavigating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const stopWatching = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  const fitRoute = useCallback(
    (from: { lat: number; lng: number }, coords: Array<{ latitude: number; longitude: number }>) => {
      if (!destination) return;
      const all = [
        { latitude: from.lat, longitude: from.lng },
        ...coords,
        { latitude: destination.lat, longitude: destination.lng },
      ];
      requestAnimationFrame(() => {
        mapRef.current?.fitToCoordinates(all, {
          edgePadding: { top: 60, right: 40, bottom: 80, left: 40 },
          animated: true,
        });
      });
    },
    [destination]
  );

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
      setStepIndex(0);
      fitRoute(from, next.coordinates);
    } catch (err: any) {
      setRoute(null);
      setError(err?.message || 'Could not load route');
    } finally {
      setLoading(false);
    }
  }, [destination, fitRoute]);

  useEffect(() => {
    loadRoute();
    return () => stopWatching();
  }, [loadRoute, stopWatching]);

  const followCamera = useCallback((lat: number, lng: number, heading?: number | null) => {
    mapRef.current?.animateCamera(
      {
        center: { latitude: lat, longitude: lng },
        heading: heading ?? 0,
        pitch: 45,
        zoom: 17,
      },
      { duration: 600 }
    );
  }, []);

  const startInAppNavigation = async () => {
    if (!destination || !route) return;

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setError('Location permission is required for navigation');
      return;
    }

    setNavigating(true);
    setStepIndex(0);
    stopWatching();

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 8,
      },
      (pos) => {
        const nextOrigin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setOrigin(nextOrigin);
        followCamera(nextOrigin.lat, nextOrigin.lng, pos.coords.heading);
      }
    );

    if (origin) {
      followCamera(origin.lat, origin.lng);
    }
  };

  const stopInAppNavigation = () => {
    setNavigating(false);
    stopWatching();
    if (origin && route) {
      fitRoute(origin, route.coordinates);
      mapRef.current?.animateCamera(
        { pitch: 0, heading: 0 },
        { duration: 400 }
      );
    }
  };

  const currentStep = route?.steps[stepIndex];
  const nextStep = route?.steps[stepIndex + 1];

  const initialRegion = {
    latitude: destination?.lat ?? 0,
    longitude: destination?.lng ?? 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const useGoogleProvider = Boolean(getGoogleMapsKey());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Navigate to scene" subtitle={destination?.label} showBack />

      <View style={styles.mapWrap}>
        {destination ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={useGoogleProvider ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={!navigating}
            showsCompass
            showsTraffic
            toolbarEnabled={false}
            rotateEnabled
            pitchEnabled
          >
            {!navigating && origin && (
              <Marker
                coordinate={{ latitude: origin.lat, longitude: origin.lng }}
                title="You"
                pinColor={colors.accent}
                tracksViewChanges={false}
              />
            )}
            <Marker
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              title={destination.label}
              description="Incident scene"
              tracksViewChanges={false}
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

        {!loading && (
          <View style={[styles.trafficLegend, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.trafficDot, { backgroundColor: '#22c55e' }]} />
            <View style={[styles.trafficDot, { backgroundColor: '#f59e0b' }]} />
            <View style={[styles.trafficDot, { backgroundColor: '#ef4444' }]} />
            <AppText size={11} muted>
              Live traffic
            </AppText>
          </View>
        )}

        {navigating && currentStep && (
          <View style={[styles.navBanner, { backgroundColor: colors.brandNavy }]}>
            <AppText size={12} bold color={colors.onPrimary} style={{ opacity: 0.8 }}>
              NEXT TURN
            </AppText>
            <AppText size={18} bold color={colors.onPrimary} style={{ marginTop: 4 }}>
              {currentStep.instruction}
            </AppText>
            <AppText size={13} color={colors.onPrimary} style={{ marginTop: 4, opacity: 0.85 }}>
              {currentStep.distanceText}
              {nextStep ? ` · Then: ${nextStep.instruction}` : ''}
            </AppText>
            {route && stepIndex < route.steps.length - 1 && (
              <TouchableOpacity
                style={styles.skipStep}
                onPress={() => setStepIndex((i) => Math.min(i + 1, (route?.steps.length ?? 1) - 1))}
              >
                <AppText size={13} bold color={colors.onPrimary}>
                  Next instruction →
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            maxHeight: navigating ? '34%' : '46%',
          },
        ]}
      >
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

            {!navigating && (
              <ScrollView style={styles.steps} showsVerticalScrollIndicator={false}>
                {route.steps.slice(0, 8).map((step, i) => (
                  <View
                    key={`${i}-${step.instruction}`}
                    style={[styles.stepRow, { borderBottomColor: colors.border }]}
                  >
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
            )}
          </>
        ) : (
          <AppText secondary style={{ marginBottom: 12 }}>
            {error || 'Route unavailable'}
          </AppText>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={navigating ? stopInAppNavigation : loadRoute}
            disabled={loading}
          >
            <Ionicons
              name={navigating ? 'stop-circle-outline' : 'refresh'}
              size={18}
              color={navigating ? colors.danger : colors.primary}
            />
            <AppText size={14} bold color={navigating ? colors.danger : undefined}>
              {navigating ? 'Stop' : 'Refresh'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: navigating ? colors.brandNavy : colors.accent },
            ]}
            onPress={navigating ? stopInAppNavigation : startInAppNavigation}
            disabled={!destination || !route || loading}
          >
            <Ionicons
              name={navigating ? 'checkmark-circle' : 'navigate'}
              size={18}
              color={colors.onPrimary}
            />
            <AppText size={14} bold color={colors.onPrimary}>
              {navigating ? 'Navigating…' : 'Start navigation'}
            </AppText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            stopInAppNavigation();
            router.back();
          }}
          style={styles.backLink}
        >
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
  trafficLegend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    borderRadius: 16,
    padding: 14,
  },
  skipStep: { marginTop: 10, alignSelf: 'flex-start' },
  panel: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
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
