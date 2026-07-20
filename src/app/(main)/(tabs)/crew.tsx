import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState from '@/components/shared/EmptyState';
import ShiftCheckInCard from '@/components/crew/ShiftCheckInCard';
import StatusBadge from '@/components/StatusBadge';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/context/ThemeContext';
import type { VehicleWithCrew } from '@/types/api';

function CrewMember({
  icon,
  role,
  name,
  phone,
  colors,
}: {
  icon: string;
  role: string;
  name: string;
  phone?: string | null;
  colors: ThemeColors;
}) {
  const call = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={[styles.member, { borderBottomColor: colors.border }]}>
      <View style={[styles.memberIcon, { backgroundColor: colors.noteBg }]}>
        <Ionicons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.memberInfo}>
        <AppText size={11} bold muted style={{ textTransform: 'uppercase' }}>
          {role}
        </AppText>
        <AppText size={16} bold style={{ marginTop: 2 }}>
          {name}
        </AppText>
        {phone && (
          <AppText size={13} secondary style={{ marginTop: 2 }}>
            {phone}
          </AppText>
        )}
      </View>
      {phone && (
        <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.accent }]} onPress={call}>
          <Ionicons name="call" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ShiftCrewCard({ vehicle, colors }: { vehicle: VehicleWithCrew; colors: ThemeColors }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.vehicleRow}>
        <View style={[styles.vehicleIcon, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="ambulance" size={28} color={colors.onPrimary} />
        </View>
        <View style={styles.vehicleInfo}>
          <AppText size={12} bold muted style={{ textTransform: 'uppercase' }}>
            Your shift vehicle
          </AppText>
          <AppText size={20} bold style={{ marginTop: 2 }}>
            {vehicle.registrationNumber}
          </AppText>
        </View>
      </View>

      <AppText size={16} bold style={styles.sectionTitle}>
        Crew on shift
      </AppText>
      {vehicle.currentDriver ? (
        <CrewMember
          icon="car-outline"
          role="Driver"
          name={vehicle.currentDriver.name}
          phone={vehicle.currentDriver.phone}
          colors={colors}
        />
      ) : (
        <AppText size={14} muted style={{ marginBottom: 12 }}>
          No driver checked in yet.
        </AppText>
      )}
      {vehicle.currentEmt ? (
        <CrewMember
          icon="medkit-outline"
          role="EMT"
          name={vehicle.currentEmt.name}
          phone={vehicle.currentEmt.phone}
          colors={colors}
        />
      ) : (
        <AppText size={14} muted style={{ marginBottom: 12 }}>
          No EMT checked in yet.
        </AppText>
      )}
      {vehicle.currentNurse && (
        <CrewMember
          icon="heart-outline"
          role="Nurse"
          name={vehicle.currentNurse.name}
          phone={vehicle.currentNurse.phone}
          colors={colors}
        />
      )}
    </View>
  );
}

export default function CrewScreen() {
  const { task } = useActiveTaskContext();
  const { myVehicle } = useCrewCheckIn();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Crew" subtitle="Shift check-in & team" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <ShiftCheckInCard />

        {!task ? (
          myVehicle ? (
            <ShiftCrewCard vehicle={myVehicle} colors={colors} />
          ) : (
            <EmptyState
              icon={<Ionicons name="people-outline" size={48} color={colors.textMuted} />}
              title="No crew assignment"
              message="Check in to a vehicle above. Crew and vehicle details for active cases appear here once dispatch assigns your team."
            />
          )
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <View style={styles.cardHeader}>
                <AppText size={14} bold muted style={{ textTransform: 'uppercase' }}>
                  Active case
                </AppText>
                <StatusBadge status={task.status} />
              </View>
              <AppText size={22} bold style={{ marginTop: 8 }}>
                {task.incident.caseNumber}
              </AppText>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <View style={styles.vehicleRow}>
                <View style={[styles.vehicleIcon, { backgroundColor: colors.accent }]}>
                  <MaterialCommunityIcons name="ambulance" size={28} color={colors.onPrimary} />
                </View>
                <View style={styles.vehicleInfo}>
                  <AppText size={12} bold muted style={{ textTransform: 'uppercase' }}>
                    Ambulance
                  </AppText>
                  <AppText size={20} bold style={{ marginTop: 2 }}>
                    {task.vehicle.registrationNumber}
                  </AppText>
                  <AppText size={12} secondary style={{ marginTop: 4 }}>
                    IMEI {task.vehicle.imei}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <AppText size={16} bold style={styles.sectionTitle}>
                Crew members
              </AppText>
              <CrewMember icon="car-outline" role="Driver" name={task.driver.name} phone={task.driver.phone} colors={colors} />
              {task.emt ? (
                <CrewMember icon="medkit-outline" role="EMT" name={task.emt.name} phone={task.emt.phone} colors={colors} />
              ) : (
                <AppText size={14} muted style={{ marginBottom: 12 }}>
                  No EMT assigned to this case.
                </AppText>
              )}
              {task.nurse && (
                <CrewMember icon="heart-outline" role="Nurse" name={task.nurse.name} phone={task.nurse.phone} colors={colors} />
              )}
            </View>

            {task.incident.lat && task.incident.lng && (
              <TouchableOpacity
                style={[styles.mapBtn, { backgroundColor: colors.brandNavy }]}
                onPress={() => {
                  const { lat, lng, locationName } = task.incident;
                  const qs = new URLSearchParams({
                    lat: String(lat),
                    lng: String(lng),
                    label: locationName || 'Incident scene',
                  }).toString();
                  router.push((`/(main)/navigate?${qs}` as unknown) as Href);
                }}
              >
                <Ionicons name="navigate" size={20} color={colors.onPrimary} />
                <AppText size={16} bold color={colors.onPrimary}>
                  Navigate to scene
                </AppText>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 24 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, marginTop: 16 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  memberIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: { flex: 1 },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    height: 54,
  },
});
