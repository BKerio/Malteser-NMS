import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AppText from '@/components/shared/AppText';
import ConfirmActionModal from '@/components/shared/ConfirmActionModal';
import { useAuth } from '@/context/AuthContext';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import { useTheme } from '@/context/ThemeContext';
import type { Role, VehicleWithCrew } from '@/types/api';

const ROLE_SLOT: Record<'DRIVER' | 'EMT' | 'NURSE', keyof VehicleWithCrew> = {
  DRIVER: 'currentDriver',
  EMT: 'currentEmt',
  NURSE: 'currentNurse',
};

function slotLabel(role: Role) {
  if (role === 'DRIVER') return 'Driver';
  if (role === 'EMT') return 'EMT';
  return 'Nurse';
}

function VehicleRow({
  vehicle,
  userRole,
  userId,
  isCheckedIn,
  isMutating,
  onCheckIn,
}: {
  vehicle: VehicleWithCrew;
  userRole: Role;
  userId: string;
  isCheckedIn: boolean;
  isMutating: boolean;
  onCheckIn: () => void;
}) {
  const { colors } = useTheme();
  const slot = ROLE_SLOT[userRole as keyof typeof ROLE_SLOT];
  const occupant = slot ? (vehicle[slot] as { id: string; name: string } | null | undefined) : null;
  const isMine = occupant?.id === userId;
  const isTaken = !!occupant && !isMine;

  return (
    <View style={[styles.vehicleRow, { borderColor: colors.border, backgroundColor: colors.noteBg }]}>
      <View style={styles.vehicleRowInfo}>
        <AppText size={16} bold>
          {vehicle.registrationNumber}
        </AppText>
        <AppText size={12} muted style={{ marginTop: 2 }}>
          {isMine
            ? `You are checked in as ${slotLabel(userRole)}`
            : isTaken
              ? `${slotLabel(userRole)}: ${occupant.name}`
              : `${slotLabel(userRole)} slot open`}
        </AppText>
      </View>
      {isCheckedIn ? (
        isMine ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
          </View>
        ) : null
      ) : (
        <TouchableOpacity
          style={[
            styles.checkInBtn,
            { backgroundColor: isTaken ? colors.border : colors.primary },
          ]}
          onPress={onCheckIn}
          disabled={isTaken || isMutating}
        >
          {isMutating ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <AppText size={13} bold color={isTaken ? colors.textMuted : colors.onPrimary}>
              {isTaken ? 'Taken' : 'Check in'}
            </AppText>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ShiftCheckInCard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { myVehicle, vehicles, isLoading, isRefreshing, error, refresh, checkIn, checkOut } = useCrewCheckIn();
  const [showPicker, setShowPicker] = useState(false);
  const [confirmCheckInFor, setConfirmCheckInFor] = useState<VehicleWithCrew | null>(null);
  const [confirmEndShift, setConfirmEndShift] = useState(false);
  const [pendingVehicleId, setPendingVehicleId] = useState<string | null>(null);
  const [isEndingShift, setIsEndingShift] = useState(false);

  const roleLabel = useMemo(
    () => (user ? slotLabel(user.role) : ''),
    [user]
  );

  if (!user) return null;

  const handleCheckIn = async (vehicleId: string) => {
    setPendingVehicleId(vehicleId);
    try {
      await checkIn(vehicleId);
      setShowPicker(false);
      Toast.show({
        type: 'success',
        text1: 'Checked in',
        text2: 'You are on shift for this vehicle.',
        position: 'bottom',
        bottomOffset: 90,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Check-in failed',
        text2: err instanceof Error ? err.message : 'Please try again.',
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      setPendingVehicleId(null);
    }
  };

  const handleCheckOut = async () => {
    setIsEndingShift(true);
    try {
      await checkOut();
      Toast.show({
        type: 'success',
        text1: 'Checked out',
        text2: 'Your shift on this vehicle has ended.',
        position: 'bottom',
        bottomOffset: 90,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Check-out failed',
        text2: err instanceof Error ? err.message : 'Please try again.',
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      setIsEndingShift(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={colors.onPrimary} />
        </View>
        <View style={styles.headerText}>
          <AppText size={16} bold>
            Shift check-in
          </AppText>
          <AppText size={13} secondary style={{ marginTop: 2 }}>
            Check in to your ambulance before dispatch can assign cases.
          </AppText>
        </View>
      </View>

      <ConfirmActionModal
        visible={!!confirmCheckInFor}
        iconName="clipboard-check-outline"
        title="Check in to vehicle?"
        message={
          confirmCheckInFor
            ? `You will be checked in as ${roleLabel} on ${confirmCheckInFor.registrationNumber}.`
            : 'Continue?'
        }
        cancelLabel="Not yet"
        confirmLabel="Check in"
        onCancel={() => setConfirmCheckInFor(null)}
        onConfirm={() => {
          const v = confirmCheckInFor;
          setConfirmCheckInFor(null);
          if (v) handleCheckIn(v.id);
        }}
      />

      <ConfirmActionModal
        visible={confirmEndShift}
        iconName="logout"
        title="End shift?"
        message="This will check you out of the vehicle so dispatch will stop assigning cases to this crew slot."
        cancelLabel="Keep shift"
        confirmLabel="End shift"
        tone="danger"
        onCancel={() => setConfirmEndShift(false)}
        onConfirm={() => {
          setConfirmEndShift(false);
          handleCheckOut();
        }}
      />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <AppText size={14} color={colors.danger}>
            {error}
          </AppText>
          <TouchableOpacity onPress={refresh}>
            <AppText size={14} bold color={colors.primary}>
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      ) : myVehicle ? (
        <View style={[styles.activeShift, { backgroundColor: colors.noteBg }]}>
          <View style={styles.activeShiftInfo}>
            <AppText size={12} bold muted style={{ textTransform: 'uppercase' }}>
              On shift
            </AppText>
            <AppText size={20} bold style={{ marginTop: 4 }}>
              {myVehicle.registrationNumber}
            </AppText>
            <AppText size={13} secondary style={{ marginTop: 4 }}>
              {roleLabel} · IMEI {myVehicle.imei}
            </AppText>
          </View>
          <TouchableOpacity
            style={[styles.checkOutBtn, { borderColor: colors.danger }]}
            onPress={() => setConfirmEndShift(true)}
            disabled={isEndingShift}
          >
            {isEndingShift ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <AppText size={14} bold color={colors.danger}>
                End shift
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowPicker((v) => !v)}
          >
            <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.onPrimary} />
            <AppText size={15} bold color={colors.onPrimary}>
              {showPicker ? 'Hide vehicles' : 'Select vehicle to check in'}
            </AppText>
          </TouchableOpacity>

          {showPicker && (
            <ScrollView
              style={styles.picker}
              nestedScrollEnabled
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
              }
            >
              {vehicles.length === 0 ? (
                <AppText size={14} muted style={{ paddingVertical: 12 }}>
                  No active vehicles found for your agency.
                </AppText>
              ) : (
                vehicles.map((vehicle) => (
                  <VehicleRow
                    key={vehicle.id}
                    vehicle={vehicle}
                    userRole={user.role}
                    userId={user.id}
                    isCheckedIn={false}
                    isMutating={pendingVehicleId === vehicle.id}
                    onCheckIn={() => setConfirmCheckInFor(vehicle)}
                  />
                ))
              )}
            </ScrollView>
          )}
        </>
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
  header: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1 },
  errorBox: { gap: 8, paddingVertical: 8 },
  activeShift: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeShiftInfo: { flex: 1 },
  checkOutBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 96,
    alignItems: 'center',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    height: 48,
  },
  picker: { maxHeight: 260, marginTop: 12 },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  vehicleRowInfo: { flex: 1 },
  checkInBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 84,
    alignItems: 'center',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
