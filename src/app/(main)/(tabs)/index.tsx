import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState, { ErrorState } from '@/components/shared/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import { useTheme } from '@/context/ThemeContext';
import { updateTaskStatus } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { ACTION_LABELS, getNextStatus } from '@/utils/taskStatus';
import type { TaskStatus } from '@/types/api';

export default function AssignmentScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { myVehicle } = useCrewCheckIn();
  const { task, isLoading, isRefreshing, error, refresh } = useActiveTaskContext();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (!task) return;
    const next = getNextStatus(task.status);
    if (!next) return;

    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, next);
      Toast.show({
        type: 'success',
        text1: 'Status updated',
        text2: ACTION_LABELS[task.status],
        position: 'bottom',
        bottomOffset: 90,
      });
      refresh();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: getErrorMessage(err),
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openMaps = () => {
    if (!task?.incident?.lat || !task?.incident?.lng) return;
    const { lat, lng } = task.incident;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const nextStatus = task ? getNextStatus(task.status as TaskStatus) : null;
  const actionLabel = task ? ACTION_LABELS[task.status as TaskStatus] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Assignment"
        rightAction={
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: colors.iconButton, shadowColor: colors.shadow }]}
            onPress={refresh}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : !task ? (
          <>
            {!myVehicle && (
              <View style={[styles.banner, { backgroundColor: colors.noteBg, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                <AppText size={14} secondary style={styles.bannerText}>
                  Check in to your vehicle on the Crew tab before dispatch can assign cases to you.
                </AppText>
              </View>
            )}
            <EmptyState
              icon={<MaterialCommunityIcons name="ambulance" size={52} color={colors.textMuted} />}
              title="No active assignment"
              message={
                myVehicle
                  ? 'You are on shift. You will be notified when dispatch assigns a case to your crew. Pull down to refresh.'
                  : 'You will be notified when dispatch assigns a case to your crew. Pull down to refresh.'
              }
              actionLabel="Refresh now"
              onAction={refresh}
            />
          </>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <View style={styles.cardTop}>
                <AppText size={18} bold>{task.incident.caseNumber}</AppText>
                <StatusBadge status={task.status} />
              </View>
              <AppText size={16} secondary style={styles.complaint}>
                {task.incident.chiefComplaint}
              </AppText>

              <TouchableOpacity
                style={[styles.locationRow, { backgroundColor: colors.locationBg }]}
                onPress={openMaps}
              >
                <Ionicons name="location" size={18} color={colors.accent} />
                <View style={styles.locationText}>
                  <AppText size={15} bold>{task.incident.locationName}</AppText>
                  <AppText size={13} secondary style={{ marginTop: 2 }}>
                    {task.incident.subCounty}
                  </AppText>
                </View>
                {task.incident.lat && task.incident.lng && (
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {task.incident.patientName && (
                <View style={styles.patientRow}>
                  <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                  <AppText size={14} secondary style={styles.patientText}>
                    {task.incident.patientName}
                    {task.incident.patientAge ? `, ${task.incident.patientAge}` : ''}
                    {task.incident.patientGender ? ` · ${task.incident.patientGender}` : ''}
                  </AppText>
                </View>
              )}

              {task.incident.dispatcherComments && (
                <View style={[styles.noteBox, { backgroundColor: colors.noteBg }]}>
                  <AppText size={12} bold muted>
                    Dispatcher notes
                  </AppText>
                  <AppText size={14} secondary style={styles.noteText}>
                    {task.incident.dispatcherComments}
                  </AppText>
                </View>
              )}
            </View>

            {nextStatus && actionLabel && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent }, isUpdating && styles.actionBtnDisabled]}
                onPress={handleStatusUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="arrow-right-circle" size={22} color={colors.onPrimary} />
                    <AppText size={16} bold color={colors.onPrimary}>
                      {actionLabel}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                router.push({
                  pathname: '/(main)/patient-data',
                  params: { taskId: task.id },
                })
              }
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <AppText size={15} bold>Patient / Clinical Notes</AppText>
            </TouchableOpacity>

            {user?.role === 'DRIVER' && (
              <View style={[styles.gpsBanner, { backgroundColor: colors.successBg }]}>
                <Ionicons name="navigate-circle" size={18} color={colors.success} />
                <AppText size={13} color={colors.success}>
                  GPS is being shared with dispatch
                </AppText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  bannerText: { flex: 1, lineHeight: 20 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  caseNumber: { fontSize: 18, fontWeight: '800' },
  complaint: { fontSize: 16, lineHeight: 24, marginBottom: 16 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  locationText: { flex: 1, marginLeft: 10 },
  locationName: { fontSize: 15, fontWeight: '600' },
  subCounty: { fontSize: 13, marginTop: 2 },
  patientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  patientText: { marginLeft: 8, fontSize: 14 },
  noteBox: { padding: 14, borderRadius: 12, marginTop: 4 },
  noteLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  noteText: { fontSize: 14, lineHeight: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    height: 56,
    marginBottom: 12,
  },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
    marginBottom: 12,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  gpsHint: { fontSize: 13, fontWeight: '500' },
});
