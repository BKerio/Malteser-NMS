import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/context/ThemeContext';

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

export default function CrewScreen() {
  const { task } = useActiveTaskContext();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Crew" subtitle="Your team & vehicle" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {!task ? (
          <EmptyState
            icon={<Ionicons name="people-outline" size={48} color={colors.textMuted} />}
            title="No crew assignment"
            message="Crew and vehicle details appear here once dispatch assigns your team to a case."
          />
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
              <CrewMember icon="medkit-outline" role="EMT" name={task.emt.name} phone={task.emt.phone} colors={colors} />
              {task.nurse && (
                <CrewMember icon="heart-outline" role="Nurse" name={task.nurse.name} phone={task.nurse.phone} colors={colors} />
              )}
            </View>

            {task.incident.lat && task.incident.lng && (
              <TouchableOpacity
                style={[styles.mapBtn, { backgroundColor: colors.brandNavy }]}
                onPress={() => {
                  const { lat, lng } = task.incident;
                  const url = Platform.select({
                    ios: `maps:0,0?q=${lat},${lng}`,
                    android: `geo:${lat},${lng}?q=${lat},${lng}`,
                    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                  });
                  if (url) Linking.openURL(url);
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
  cardTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  caseRef: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: { flex: 1 },
  vehicleLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  vehicleReg: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  vehicleImei: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
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
  memberRole: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  memberName: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  memberPhone: { fontSize: 13, marginTop: 2 },
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
  mapBtnText: { fontSize: 16, fontWeight: '700' },
});
