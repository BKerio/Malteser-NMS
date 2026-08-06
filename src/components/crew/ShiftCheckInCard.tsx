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

function formatCheckInTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `today ${time}`;
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
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
        {(vehicle.lastLocationName || (vehicle.lastLat != null && vehicle.lastLng != null)) && (
          <AppText size={11} secondary style={{ marginTop: 2 }}>
            {vehicle.lastLocationName &&
            !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(vehicle.lastLocationName.trim())
              ? vehicle.lastLocationName
              : 'Place name pending…'}
          </AppText>
        )}
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
  const { myVehicle, vehicles, isLoading, isRefreshing, error, refresh, checkIn, checkOut, pendingCheckIn, dismissPendingCheckIn, isMutating } = useCrewCheckIn();
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

  const handleCheckIn = async (vehicleId: string, registrationNumber?: string) => {
    setPendingVehicleId(vehicleId);
    try {
      await checkIn(vehicleId, { registrationNumber });
      setShowPicker(false);
      Toast.show({
        type: 'success',
        text1: 'Checked in',
        text2: 'Location and time captured. You are on shift.',
        position: 'bottom',
        bottomOffset: 90,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Check-in paused',
        text2: err instanceof Error ? err.message : 'Please try again.',
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      setPendingVehicleId(null);
    }
  };

  const handleFinishPending = async () => {
    if (!pendingCheckIn) return;
    await handleCheckIn(pendingCheckIn.vehicleId, pendingCheckIn.registrationNumber);
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
            Check in with a selfie and GPS location before dispatch can assign cases. Location
            permission is required.
          </AppText>
        </View>
      </View>

      <ConfirmActionModal
        visible={!!confirmCheckInFor}
        iconName="clipboard-check-outline"
        title="Check in to vehicle?"
        message={
          confirmCheckInFor
            ? `Location is captured first, then you take a selfie to check in as ${roleLabel} on ${confirmCheckInFor.registrationNumber}. If the camera reloads the app, just tap finish — your progress is saved.`
            : 'Continue?'
        }
        cancelLabel="Not yet"
        confirmLabel="Continue check-in"
        onCancel={() => setConfirmCheckInFor(null)}
        onConfirm={() => {
          const v = confirmCheckInFor;
          setConfirmCheckInFor(null);
          if (v) handleCheckIn(v.id, v.registrationNumber);
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

      {!myVehicle && pendingCheckIn ? (
        <View style={[styles.pendingBox, { backgroundColor: colors.noteBg, borderColor: colors.border }]}>
          <AppText size={14} bold>
            Finish check-in
          </AppText>
          <AppText size={13} secondary style={{ marginTop: 4 }}>
            {pendingCheckIn.selfieUri
              ? `Uploading your selfie for ${pendingCheckIn.registrationNumber ?? 'your ambulance'}…`
              : `Your location is saved. Tap below to take the selfie again for ${pendingCheckIn.registrationNumber ?? 'your ambulance'} — the camera may briefly reopen the app.`}
          </AppText>
          <View style={styles.pendingActions}>
            <TouchableOpacity
              style={[styles.pendingBtn, { backgroundColor: colors.primary }]}
              onPress={handleFinishPending}
              disabled={isMutating || pendingVehicleId != null}
            >
              {isMutating || pendingVehicleId === pendingCheckIn.vehicleId ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <AppText size={13} bold color={colors.onPrimary}>
                  {pendingCheckIn.selfieUri ? 'Complete check-in' : 'Take selfie & finish'}
                </AppText>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => dismissPendingCheckIn()} disabled={isMutating}>
              <AppText size={13} muted>
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

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
        <View style={[styles.activeShiftCol, { backgroundColor: colors.noteBg }]}>
          <View style={styles.activeShift}>
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
          <View style={[styles.placeRow, { borderTopColor: colors.border }]}>
            <Ionicons name="location" size={16} color={colors.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText size={14}>
                {(() => {
                  const name = myVehicle.checkInLocationName || myVehicle.lastLocationName;
                  if (name && !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(name.trim())) {
                    return `Logged in at ${name}`;
                  }
                  return 'Logged in — resolving place name…';
                })()}
              </AppText>
              {myVehicle.checkedInAt ? (
                <AppText size={12} muted>
                  Since {formatCheckInTime(myVehicle.checkedInAt)}
                </AppText>
              ) : null}
            </View>
          </View>
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
              <AppText size={12} bold muted style={{ marginBottom: 8, textTransform: 'uppercase' }}>
                With Tracker — check-in
              </AppText>
              {vehicles.length === 0 ? (
                <AppText size={14} muted style={{ paddingVertical: 12 }}>
                  No active GPS vehicles found for your agency.
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
  activeShiftCol: {
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  activeShift: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeShiftInfo: { flex: 1 },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
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
  pendingBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  pendingBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 140,
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
