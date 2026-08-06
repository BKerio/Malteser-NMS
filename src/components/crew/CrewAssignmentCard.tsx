import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getSocket } from '@/lib/socket';

function roleLabel(role: 'EMT' | 'NURSE') {
  return role === 'EMT' ? 'EMT' : 'nurse';
}

export default function CrewAssignmentCard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { myVehicle, isMutating, assignCrew, refresh } = useCrewCheckIn();
  const [members, setMembers] = useState<AssignableCrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState<'EMT' | 'NURSE' | null>(null);

  const isDriver = user?.role === 'DRIVER';

  const loadMembers = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const list = await getAssignableCrew();
      setMembers(list);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Couldn’t load your crew list',
        text2: 'Please check your connection and try again.',
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDriver || !myVehicle) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getAssignableCrew();
        if (!cancelled) setMembers(list);
      } catch {
        if (!cancelled) {
          Toast.show({
            type: 'error',
            text1: 'Couldn’t load your crew list',
            text2: 'Please check your connection and try again.',
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

  // Live refresh when another driver assigns/clears crew
  useEffect(() => {
    if (!isDriver || !myVehicle) return;
    const socket = getSocket();
    const onCrewUpdate = () => {
      void loadMembers(false);
      void refresh();
    };
    socket.on('vehicle:crew', onCrewUpdate);
    return () => {
      socket.off('vehicle:crew', onCrewUpdate);
    };
  }, [isDriver, myVehicle?.id, loadMembers, refresh]);

  const emts = useMemo(() => members.filter((m) => m.role === 'EMT'), [members]);
  const nurses = useMemo(() => members.filter((m) => m.role === 'NURSE'), [members]);

  if (!isDriver || !myVehicle) return null;

  const setSlot = async (role: 'EMT' | 'NURSE', userId: string | null) => {
    setSavingRole(role);
    try {
      await assignCrew(role === 'EMT' ? { emtId: userId } : { nurseId: userId });
      await Promise.all([refresh(), loadMembers(false)]);
      Toast.show({
        type: 'success',
        text1: userId ? 'You’re all set' : 'Crew cleared',
        text2: userId
          ? `${roleLabel(role)} added to ${myVehicle.registrationNumber}.`
          : `${roleLabel(role)} removed from this ambulance. They’re free for another driver to assign.`,
        position: 'bottom',
        bottomOffset: 90,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : getErrorMessage(err);
      const alreadyTaken = /already on ambulance|taken/i.test(message);
      Toast.show({
        type: 'error',
        text1: alreadyTaken ? 'Someone else got there first' : 'Couldn’t update crew',
        text2: alreadyTaken
          ? message
          : 'Something went wrong. Please try again in a moment.',
        position: 'bottom',
        bottomOffset: 90,
      });
      await loadMembers(false);
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
          No {role === 'EMT' ? 'EMTs' : 'nurses'} in your agency yet. Ask an admin to add them.
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
            disabled={isMutating || savingRole !== null || !currentId}
          >
            <View style={{ flex: 1 }}>
              <AppText
                size={13}
                bold={!currentId}
                color={!currentId ? colors.primary : colors.textMuted}
              >
                {currentId ? 'Remove from this ambulance' : 'Nobody assigned'}
              </AppText>
              {currentId ? (
                <AppText size={11} muted style={{ marginTop: 2 }}>
                  They stay on shift — no check-out needed
                </AppText>
              ) : null}
            </View>
          </TouchableOpacity>
          {options.map((person) => {
            const active = currentId === person.id;
            const takenElsewhere =
              !active &&
              person.status === 'TAKEN' &&
              person.assignedVehicleId != null &&
              person.assignedVehicleId !== myVehicle.id;
            const busy = isMutating || savingRole !== null;
            const otherAmbulance = person.assignedVehicleRegistration ?? 'another ambulance';

            return (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.option,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.noteBg : colors.background,
                    opacity: takenElsewhere ? 0.75 : 1,
                  },
                ]}
                onPress={() => {
                  if (takenElsewhere) {
                    Toast.show({
                      type: 'info',
                      text1: `${person.name} is already assigned`,
                      text2: `They’re with ${otherAmbulance} right now. Ask that driver to free them up, or choose someone else.`,
                      position: 'bottom',
                      bottomOffset: 90,
                    });
                    return;
                  }
                  if (busy) return;
                  setSlot(role, person.id);
                }}
                disabled={busy && !takenElsewhere}
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
                  {takenElsewhere ? (
                    <AppText size={12} muted style={{ marginTop: 4 }}>
                      With {otherAmbulance}
                    </AppText>
                  ) : null}
                </View>
                {savingRole === role && active ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : active ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : takenElsewhere ? (
                  <View style={[styles.takenBadge, { backgroundColor: colors.danger }]}>
                    <AppText size={11} bold color="#fff">
                      Taken
                    </AppText>
                  </View>
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
            Pick an EMT and nurse for {myVehicle.registrationNumber}. If someone shows Taken,
            they’re already helping another ambulance — you can remove your own crew anytime
            without checking out.
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
  takenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
