import React, { useMemo } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '@/components/shared/AppText';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import { useTheme } from '@/context/ThemeContext';
import type { PartnerAmbulance, VehicleWithCrew } from '@/types/api';

function statusLabel(v: VehicleWithCrew) {
  if (v.isActive === false) return 'Offline';
  if (v.status === 'BUSY') return 'On case';
  if (v.status === 'MAINTENANCE') return 'Maintenance';
  if (v.currentDriver) return 'Available';
  return 'No driver';
}

function statusColor(
  v: VehicleWithCrew,
  colors: { success: string; danger: string; textMuted: string; accent: string }
) {
  if (v.status === 'BUSY') return colors.accent;
  if (v.status === 'MAINTENANCE') return colors.textMuted;
  if (v.currentDriver) return colors.success;
  return colors.danger;
}

function placeLabel(v: VehicleWithCrew) {
  const name = v.lastLocationName || v.checkInLocationName;
  if (name && !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(name.trim())) {
    return name;
  }
  if (v.lastLat != null && v.lastLng != null) {
    return 'Resolving place name…';
  }
  return 'No GPS yet';
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHead}>
      <AppText size={12} bold muted style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </AppText>
      <AppText size={12} muted>
        {count}
      </AppText>
    </View>
  );
}

function PartnerRow({ p }: { p: PartnerAmbulance }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
      <View style={{ flex: 1 }}>
        <AppText size={15} bold>
          {p.registrationNumber}
        </AppText>
        <AppText size={12} muted style={{ marginTop: 2 }}>
          No GPS · {p.agency?.name ?? 'County / EOC'}
          {p.vehicleType ? ` · ${p.vehicleType}` : ''}
        </AppText>
        {(p.baseLocation || p.notes) && (
          <View style={styles.placeLine}>
            <Ionicons name="location-outline" size={13} color={colors.accent} />
            <AppText size={12} secondary style={{ flex: 1 }}>
              {p.baseLocation || p.notes}
            </AppText>
          </View>
        )}
        {p.contactPhone ? (
          <TouchableOpacity
            style={styles.placeLine}
            onPress={() => Linking.openURL(`tel:${p.contactPhone}`)}
          >
            <Ionicons name="call-outline" size={13} color={colors.primary} />
            <AppText size={12} color={colors.primary}>
              {p.contactName ? `${p.contactName} · ` : ''}
              {p.contactPhone}
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function AvailableAmbulancesCard() {
  const { colors } = useTheme();
  const { vehicles, partnerAmbulances, myVehicle, isLoading } = useCrewCheckIn();

  const withCoords = useMemo(
    () => vehicles.filter((v) => v.lastLat != null && v.lastLng != null),
    [vehicles]
  );

  const available = useMemo(
    () =>
      vehicles.filter(
        (v) => v.status === 'READY' && !!v.currentDriver && v.isActive !== false
      ),
    [vehicles]
  );

  const region = useMemo(() => {
    const focus =
      myVehicle?.lastLat != null && myVehicle?.lastLng != null
        ? myVehicle
        : withCoords[0];
    if (!focus?.lastLat || !focus?.lastLng) {
      return { latitude: -1.2921, longitude: 36.8219, latitudeDelta: 0.12, longitudeDelta: 0.12 };
    }
    return {
      latitude: focus.lastLat,
      longitude: focus.lastLng,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [myVehicle, withCoords]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.brandNavy }]}>
          <MaterialCommunityIcons name="ambulance" size={22} color={colors.onPrimary} />
        </View>
        <View style={styles.headerText}>
          <AppText size={16} bold>
            Ambulances & locations
          </AppText>
          <AppText size={13} secondary style={{ marginTop: 2 }}>
            {available.length} tracked ready · {partnerAmbulances.length} no tracker
          </AppText>
        </View>
      </View>

      {withCoords.length > 0 && (
        <View style={[styles.mapWrap, { borderColor: colors.border }]}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {withCoords.map((v) => (
              <Marker
                key={v.id}
                coordinate={{ latitude: v.lastLat!, longitude: v.lastLng! }}
                title={v.registrationNumber}
                description={`${statusLabel(v)} · ${placeLabel(v)}`}
                pinColor={
                  v.status === 'BUSY' ? '#E67E22' : v.currentDriver ? '#27AE60' : '#95A5A6'
                }
              />
            ))}
          </MapView>
        </View>
      )}

      {isLoading ? (
        <AppText size={13} muted>
          Loading fleet…
        </AppText>
      ) : (
        <View style={styles.list}>
          <SectionHeading title="With Tracker" count={vehicles.length} />
          {vehicles.length === 0 ? (
            <AppText size={13} muted style={{ marginBottom: 8 }}>
              No GPS-tracked ambulances found for your agency.
            </AppText>
          ) : (
            vehicles.map((v) => {
              const color = statusColor(v, colors);
              const isMine = myVehicle?.id === v.id;
              return (
                <View
                  key={v.id}
                  style={[
                    styles.row,
                    {
                      borderColor: isMine ? colors.primary : colors.border,
                      backgroundColor: isMine ? colors.noteBg : colors.background,
                    },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <AppText size={15} bold>
                      {v.registrationNumber}
                      {isMine ? ' · You' : ''}
                    </AppText>
                    <AppText size={12} muted style={{ marginTop: 2 }}>
                      {statusLabel(v)}
                      {v.currentDriver ? ` · ${v.currentDriver.name}` : ''}
                    </AppText>
                    <View style={styles.placeLine}>
                      <Ionicons name="location-outline" size={13} color={colors.accent} />
                      <AppText size={12} secondary style={{ flex: 1 }}>
                        {placeLabel(v)}
                        {v.checkedInAt && v.currentDriver
                          ? ` · since ${formatShortTime(v.checkedInAt)}`
                          : ''}
                      </AppText>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <SectionHeading title="No Tracker · Reference only" count={partnerAmbulances.length} />
          {partnerAmbulances.length === 0 ? (
            <AppText size={13} muted>
              No no-tracker ambulances on the roster.
            </AppText>
          ) : (
            partnerAmbulances.map((p) => <PartnerRow key={p.id} p={p} />)
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  header: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1 },
  mapWrap: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 14,
  },
  map: { flex: 1 },
  list: { gap: 8 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  placeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
});
