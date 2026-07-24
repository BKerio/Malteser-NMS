import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppText from '@/components/shared/AppText';
import { getErrorMessage } from '@/api/client';
import { updateTaskStatus } from '@/api/responder';
import { getGoogleMapsKey } from '@/config/env';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchDrivingRoute, type DrivingRoute } from '@/services/googleDirections';
import { ACTION_LABELS, getNextStatus } from '@/utils/taskStatus';
import type { TaskStatus } from '@/types/api';

export default function NavigateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const { task, refresh } = useActiveTaskContext();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    label?: string;
  }>();

  const destination = useMemo(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      if (task?.incident?.lat != null && task?.incident?.lng != null) {
        return {
          lat: task.incident.lat,
          lng: task.incident.lng,
          label: task.incident.locationName || 'Incident scene',
        };
      }
      return null;
    }
    return { lat, lng, label: params.label || 'Incident scene' };
  }, [params.lat, params.lng, params.label, task]);

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const nextStatus = task ? getNextStatus(task.status as TaskStatus) : null;
  const actionLabel = task ? ACTION_LABELS[task.status as TaskStatus] : null;
  const showHospitalArrival =
    task?.status === 'PATIENT_PICKED' || nextStatus === 'AT_HOSPITAL';
  const floatingLabel = showHospitalArrival
    ? 'Arrived at the hospital'
    : actionLabel;

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
          edgePadding: { top: 100, right: 40, bottom: 160, left: 40 },
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
    if (!destination) return;

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setError('Location permission is required for navigation');
      return;
    }

    setNavigating(true);
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
      mapRef.current?.animateCamera({ pitch: 0, heading: 0 }, { duration: 400 });
    }
  };

  const handleFloatingAction = async () => {
    if (!task || !nextStatus) return;

    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, nextStatus);
      Toast.show({
        type: 'success',
        text1: 'Status updated',
        text2: floatingLabel || ACTION_LABELS[task.status],
        position: 'bottom',
        bottomOffset: 120,
      });

      if (nextStatus === 'COMPLETED') {
        stopInAppNavigation();
        const qs = new URLSearchParams({
          taskId: task.id,
          caseNumber: task.incident.caseNumber,
        }).toString();
        router.replace((`/(main)/patient-care-report?${qs}` as unknown) as Href);
        return;
      }

      if (nextStatus === 'AT_HOSPITAL') {
        stopInAppNavigation();
        router.replace('/(main)/(tabs)/activity');
      }

      refresh();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: getErrorMessage(err),
        position: 'bottom',
        bottomOffset: 120,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const initialRegion = {
    latitude: destination?.lat ?? 0,
    longitude: destination?.lng ?? 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const useGoogleProvider = Boolean(getGoogleMapsKey());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mapWrap}>
        {destination ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={useGoogleProvider ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
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
              description="Destination"
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

        {/* Top overlays */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={[styles.roundBtn, { backgroundColor: colors.card }]}
            onPress={() => {
              stopInAppNavigation();
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.metaChip, { backgroundColor: colors.card }]}>
            <AppText size={13} bold numberOfLines={1}>
              {task?.incident.caseNumber || destination?.label || 'Navigation'}
            </AppText>
            {route ? (
              <AppText size={12} secondary>
                {route.durationText} · {route.distanceText}
              </AppText>
            ) : error ? (
              <AppText size={12} color={colors.danger} numberOfLines={1}>
                {error}
              </AppText>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.roundBtn, { backgroundColor: colors.card }]}
            onPress={navigating ? stopInAppNavigation : startInAppNavigation}
            disabled={!destination || loading}
          >
            <Ionicons
              name={navigating ? 'pause' : 'navigate'}
              size={20}
              color={navigating ? colors.danger : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Floating status CTA */}
        {task && nextStatus && floatingLabel ? (
          <View style={[styles.fabWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[
                styles.fab,
                {
                  backgroundColor: showHospitalArrival ? colors.primary : colors.accent,
                },
                isUpdating && styles.fabDisabled,
              ]}
              onPress={handleFloatingAction}
              disabled={isUpdating}
              activeOpacity={0.9}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={showHospitalArrival ? 'hospital-building' : 'map-marker-check'}
                    size={22}
                    color={colors.onPrimary}
                  />
                  <AppText size={16} bold color={colors.onPrimary}>
                    {floatingLabel}
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  metaChip: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  fabWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  fab: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabDisabled: { opacity: 0.75 },
});
