import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AppText from '@/components/shared/AppText';
import { getAssignableCrew, type AssignableCrewMember } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import { useTheme } from '@/context/ThemeContext';

export default function CrewAssignmentCard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { myVehicle, isMutating, assignCrew, refresh } = useCrewCheckIn();
  const [members, setMembers] = useState<AssignableCrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState<'EMT' | 'NURSE' | null>(null);

  const isDriver = user?.role === 'DRIVER';

  useEffect(() => {
    if (!isDriver || !myVehicle) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getAssignableCrew();
        if (!cancelled) setMembers(list);
      } catch (err) {
        if (!cancelled) {
          Toast.show({
            type: 'error',
            text1: 'Could not load crew list',
            text2: getErrorMessage(err),
            position: 'bottom',
            bottomOffset: 90,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDriver, myVehicle?.id]);

  const emts = useMemo(() => members.filter((m) => m.role === 'EMT'), [members]);
  const nurses = useMemo(() => members.filter((m) => m.role === 'NURSE'), [members]);

  if (!isDriver || !myVehicle) return null;

  const setSlot = async (role: 'EMT' | 'NURSE', userId: string | null) => {
    setSavingRole(role);
    try {
      await assignCrew(role === 'EMT' ? { emtId: userId } : { nurseId: userId });
      await refresh();
      Toast.show({
        type: 'success',
        text1: 'Crew updated',
        text2: userId
          ? `${role} assigned to ${myVehicle.registrationNumber}`
          : `${role} cleared from this vehicle`,
        position: 'bottom',
        bottomOffset: 90,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Assignment failed',
        text2: err instanceof Error ? err.message : getErrorMessage(err),
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      setSavingRole(null);
    }
  };

  const renderPicker = (
    role: 'EMT' | 'NURSE',
    options: AssignableCrewMember[],
    currentId?: string | null
  ) => (
    <View style={styles.slot}>
      <AppText size={12} bold muted style={{ textTransform: 'uppercase', marginBottom: 8 }}>
        {role}
      </AppText>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : options.length === 0 ? (
        <AppText size={13} muted>
          No {role === 'EMT' ? 'EMTs' : 'nurses'} available in your agency.
        </AppText>
      ) : (
        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              {
                borderColor: !currentId ? colors.primary : colors.border,
                backgroundColor: !currentId ? colors.noteBg : colors.background,
              },
            ]}
            onPress={() => setSlot(role, null)}
            disabled={isMutating || savingRole !== null}
          >
            <AppText size={13} bold={!currentId} color={!currentId ? colors.primary : colors.textMuted}>
              Unassigned
            </AppText>
          </TouchableOpacity>
          {options.map((person) => {
            const active = currentId === person.id;
            return (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.option,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.noteBg : colors.background,
                  },
                ]}
                onPress={() => setSlot(role, person.id)}
                disabled={isMutating || savingRole !== null}
              >
                <View style={{ flex: 1 }}>
                  <AppText size={14} bold={active}>
                    {person.name}
                  </AppText>
                  {person.phone ? (
                    <AppText size={12} muted style={{ marginTop: 2 }}>
                      {person.phone}
                    </AppText>
                  ) : null}
                </View>
                {savingRole === role && active ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : active ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="account-multiple-plus" size={22} color={colors.onPrimary} />
        </View>
        <View style={styles.headerText}>
          <AppText size={16} bold>
            Assign crew
          </AppText>
          <AppText size={13} secondary style={{ marginTop: 2 }}>
            Choose EMT and nurse for {myVehicle.registrationNumber}. Assignments appear in the admin
            console immediately.
          </AppText>
        </View>
      </View>

      {renderPicker('EMT', emts, myVehicle.currentEmt?.id)}
      {renderPicker('NURSE', nurses, myVehicle.currentNurse?.id)}
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
  header: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1 },
  slot: { marginBottom: 16 },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
});
