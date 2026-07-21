import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState, { ErrorState } from '@/components/shared/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import EndCaseModal from '@/components/assignment/EndCaseModal';
import { useAuth } from '@/context/AuthContext';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import { useTheme } from '@/context/ThemeContext';
import { updateTaskStatus, closeIncident } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { ACTION_LABELS, getNextStatus } from '@/utils/taskStatus';
import type { MaternityVitals, PatientVitals, TaskStatus } from '@/types/api';

function hasAnyVitals(v?: PatientVitals | null): boolean {
  if (!v) return false;
  return Boolean(v.temperature || v.pulseRate || v.respirationRate || v.bp || v.spo2 || v.fh);
}

function hasMaternityVitals(v?: MaternityVitals | null): boolean {
  if (!v) return false;
  return Object.values(v).some((val) => Boolean(val && String(val).trim()));
}

function VitalChip({ label, value, colors }: { label: string; value?: string; colors: { border: string; textSecondary: string; text: string } }) {
  if (!value) return null;
  return (
    <View style={[styles.vitalChip, { borderColor: colors.border }]}>
      <AppText size={11} muted>
        {label}
      </AppText>
      <AppText size={14} bold style={{ marginTop: 2 }}>
        {value}
      </AppText>
    </View>
  );
}

export default function AssignmentScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { myVehicle } = useCrewCheckIn();
  const { task, isLoading, isRefreshing, error, refresh } = useActiveTaskContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEndCase, setShowEndCase] = useState(false);
  const [isEndingCase, setIsEndingCase] = useState(false);

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
      if (next === 'COMPLETED') {
        const qs = new URLSearchParams({
          taskId: task.id,
          caseNumber: task.incident.caseNumber,
        }).toString();
        router.push((`/(main)/patient-care-report?${qs}` as unknown) as Href);
      }
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
    const { lat, lng, locationName } = task.incident;
    const qs = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      label: locationName || 'Incident scene',
    }).toString();
    router.push((`/(main)/navigate?${qs}` as unknown) as Href);
  };

  const handleEndCase = async (reason: string) => {
    if (!task) return;
    setIsEndingCase(true);
    try {
      await closeIncident(task.incidentId, reason);
      setShowEndCase(false);
      Toast.show({
        type: 'success',
        text1: 'Case ended',
        text2: 'The case has been closed and saved to the record.',
        position: 'bottom',
        bottomOffset: 90,
      });
      if (user?.role === 'DRIVER') {
        const qs = new URLSearchParams({
          taskId: task.id,
          caseNumber: task.incident.caseNumber,
        }).toString();
        router.push((`/(main)/patient-care-report?${qs}` as unknown) as Href);
      }
      refresh();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not end case',
        text2: getErrorMessage(err),
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      setIsEndingCase(false);
    }
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

              {(task.incident.alertNature || task.incident.isGbvCase || task.incident.massCasualty) && (
                <View style={styles.tagRow}>
                  {task.incident.isGbvCase && (
                    <View style={[styles.tag, { backgroundColor: colors.dangerBg }]}>
                      <AppText size={12} bold color={colors.danger}>
                        GBV case
                      </AppText>
                    </View>
                  )}
                  {task.incident.massCasualty && (
                    <View style={[styles.tag, { backgroundColor: colors.noteBg }]}>
                      <AppText size={12} bold muted>
                        Mass casualty{task.incident.massCasualtyCount ? ` · ${task.incident.massCasualtyCount}` : ''}
                      </AppText>
                    </View>
                  )}
                  {task.incident.alertNature && (
                    <View style={[styles.tag, { backgroundColor: colors.noteBg }]}>
                      <AppText size={12} bold muted>
                        {task.incident.alertNature}
                        {task.incident.alertNatureDetail ? ` · ${task.incident.alertNatureDetail}` : ''}
                      </AppText>
                    </View>
                  )}
                </View>
              )}

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
                    {task.incident.placeOfReferral ? ` · Referral: ${task.incident.placeOfReferral}` : ''}
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

              {task.incident.patientContact ? (
                <TouchableOpacity
                  style={styles.patientRow}
                  onPress={() => Linking.openURL(`tel:${task.incident.patientContact}`)}
                >
                  <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                  <AppText size={14} secondary style={styles.patientText}>
                    Patient · {task.incident.patientContact}
                  </AppText>
                </TouchableOpacity>
              ) : null}

              {(task.incident.nextOfKin || task.incident.nextOfKinPhone) && (
                <TouchableOpacity
                  style={styles.patientRow}
                  onPress={() =>
                    task.incident.nextOfKinPhone
                      ? Linking.openURL(`tel:${task.incident.nextOfKinPhone}`)
                      : undefined
                  }
                  disabled={!task.incident.nextOfKinPhone}
                >
                  <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                  <AppText size={14} secondary style={styles.patientText}>
                    Next of kin
                    {task.incident.nextOfKin ? ` · ${task.incident.nextOfKin}` : ''}
                    {task.incident.nextOfKinPhone ? ` · ${task.incident.nextOfKinPhone}` : ''}
                  </AppText>
                </TouchableOpacity>
              )}

              {hasAnyVitals(task.incident.vitals) && (
                <View style={[styles.noteBox, { backgroundColor: colors.noteBg, marginTop: 8 }]}>
                  <AppText size={12} bold muted style={{ marginBottom: 8 }}>
                    Patient vitals
                  </AppText>
                  <View style={styles.vitalRow}>
                    <VitalChip label="Temp" value={task.incident.vitals?.temperature} colors={colors} />
                    <VitalChip label="Pulse" value={task.incident.vitals?.pulseRate} colors={colors} />
                    <VitalChip label="RR" value={task.incident.vitals?.respirationRate} colors={colors} />
                    <VitalChip label="BP" value={task.incident.vitals?.bp} colors={colors} />
                    <VitalChip label="SPO₂" value={task.incident.vitals?.spo2} colors={colors} />
                    <VitalChip label="FH" value={task.incident.vitals?.fh} colors={colors} />
                  </View>
                </View>
              )}

              {hasMaternityVitals(task.incident.maternityVitals) && (
                <View style={[styles.noteBox, { backgroundColor: colors.noteBg, marginTop: 8 }]}>
                  <AppText size={12} bold muted style={{ marginBottom: 8 }}>
                    Maternity vitals
                  </AppText>
                  <View style={styles.vitalRow}>
                    <VitalChip label="Parity" value={task.incident.maternityVitals?.parity} colors={colors} />
                    <VitalChip label="Gravid" value={task.incident.maternityVitals?.gravid} colors={colors} />
                    <VitalChip label="FHR" value={task.incident.maternityVitals?.fetalHeartRate} colors={colors} />
                    <VitalChip label="Dilatation" value={task.incident.maternityVitals?.cervicalDilatation} colors={colors} />
                    <VitalChip label="BP" value={task.incident.maternityVitals?.bp} colors={colors} />
                    <VitalChip label="Pulse" value={task.incident.maternityVitals?.pulse} colors={colors} />
                    <VitalChip label="Temp" value={task.incident.maternityVitals?.temperature} colors={colors} />
                    <VitalChip label="SPO₂" value={task.incident.maternityVitals?.spo2} colors={colors} />
                  </View>
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
              <TouchableOpacity
                style={[styles.endCaseBtn, { borderColor: colors.danger, backgroundColor: colors.dangerBg }]}
                onPress={() => setShowEndCase(true)}
                disabled={isEndingCase}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                <AppText size={15} bold color={colors.danger}>
                  End case (any stage)
                </AppText>
              </TouchableOpacity>
            )}

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

      {task && (
        <EndCaseModal
          visible={showEndCase}
          caseNumber={task.incident.caseNumber}
          isSubmitting={isEndingCase}
          onClose={() => setShowEndCase(false)}
          onConfirm={handleEndCase}
        />
      )}
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
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
  vitalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vitalChip: {
    minWidth: '30%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
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
  endCaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    height: 52,
    borderWidth: 1.5,
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
