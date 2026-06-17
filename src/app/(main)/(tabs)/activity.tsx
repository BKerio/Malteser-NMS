import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState, { ErrorState } from '@/components/shared/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import TaskTimeline from '@/components/TaskTimeline';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getPatientCareReports, getTaskHistory } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { STATUS_LABELS } from '@/utils/taskStatus';
import type { PaginatedMeta, PatientCareReport, TaskHistoryItem } from '@/types/api';
import { getPcrFileKind } from '@/utils/pcrFiles';

function fileTypeLabel(mimeType: string) {
  const kind = getPcrFileKind(mimeType);
  if (kind === 'image') return 'Image';
  if (kind === 'pdf') return 'PDF';
  if (kind === 'docx') return 'DOCX';
  return 'File';
}

function formatTime(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

const MILESTONES = [
  { key: 'receivedAt', label: 'Dispatched' },
  { key: 'acceptedAt', label: STATUS_LABELS.ACCEPTED },
  { key: 'sceneArrivalAt', label: 'Arrived at scene' },
  { key: 'patientPickAt', label: STATUS_LABELS.PATIENT_PICKED },
  { key: 'facilityArrivalAt', label: 'Arrived at hospital' },
  { key: 'completedAt', label: STATUS_LABELS.COMPLETED },
] as const;

function HistoryRow({
  item,
  colors,
  canUploadPcr,
  onUploadPcr,
  onViewPcr,
}: {
  item: TaskHistoryItem;
  colors: ReturnType<typeof useTheme>['colors'];
  canUploadPcr: boolean;
  onUploadPcr: () => void;
  onViewPcr: () => void;
}) {
  const endedAt = item.completedAt ?? item.cancelledAt ?? item.receivedAt;
  const pcrCount = item.pcrCount ?? 0;
  return (
    <View style={[styles.historyRow, { borderBottomColor: colors.border }]}>
      <View style={styles.historyMain}>
        <AppText size={15} bold>
          {item.incident.caseNumber}
        </AppText>
        <AppText size={13} secondary style={{ marginTop: 4 }} numberOfLines={2}>
          {item.incident.chiefComplaint}
        </AppText>
        <AppText size={12} muted style={{ marginTop: 6 }}>
          {item.vehicle.registrationNumber} · {item.incident.locationName}
        </AppText>
        <AppText size={12} muted style={{ marginTop: 2 }}>
          {formatTime(endedAt)}
        </AppText>
        {item.status === 'CANCELLED' && item.cancelReason && (
          <AppText size={12} color={colors.danger} style={{ marginTop: 4 }}>
            {item.cancelReason}
          </AppText>
        )}

        {item.status === 'COMPLETED' && pcrCount > 0 ? (
          <TouchableOpacity
            style={[styles.pcrBtn, { backgroundColor: colors.iconButton, borderColor: colors.border }]}
            onPress={onViewPcr}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <AppText size={13} bold color={colors.primary}>
              PCR history ({pcrCount})
            </AppText>
          </TouchableOpacity>
        ) : canUploadPcr ? (
          <TouchableOpacity
            style={[styles.pcrBtn, { backgroundColor: colors.iconButton, borderColor: colors.border }]}
            onPress={onUploadPcr}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
            <AppText size={13} bold color={colors.primary}>
              Upload PCR
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
      <StatusBadge status={item.status} />
    </View>
  );
}

export default function ActivityScreen() {
  const { task } = useActiveTaskContext();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryRefreshing, setIsHistoryRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [pcrTask, setPcrTask] = useState<{ taskId: string; caseNumber: string } | null>(null);
  const [pcrItems, setPcrItems] = useState<PatientCareReport[]>([]);
  const [isPcrLoading, setIsPcrLoading] = useState(false);
  const [pcrError, setPcrError] = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number, append: boolean) => {
    if (page === 1) setHistoryError(null);
    try {
      const result = await getTaskHistory(page, 15);
      setMeta(result.meta);
      setHistory((prev) => (append ? [...prev, ...result.data] : result.data));
      setHistoryPage(page);
    } catch (err) {
      setHistoryError(getErrorMessage(err));
      if (!append) setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory(1, false).finally(() => setIsHistoryLoading(false));
  }, [loadHistory]);

  const refreshHistory = async () => {
    setIsHistoryRefreshing(true);
    await loadHistory(1, false);
    setIsHistoryRefreshing(false);
  };

  const loadMore = async () => {
    if (!meta || historyPage >= meta.totalPages || isLoadingMore) return;
    setIsLoadingMore(true);
    await loadHistory(historyPage + 1, true);
    setIsLoadingMore(false);
  };

  const hasMore = meta ? historyPage < meta.totalPages : false;

  const openPcrHistory = async (item: TaskHistoryItem) => {
    setPcrTask({ taskId: item.id, caseNumber: item.incident.caseNumber });
    setIsPcrLoading(true);
    setPcrError(null);
    try {
      const data = await getPatientCareReports(item.id);
      setPcrItems(data);
    } catch (err) {
      setPcrError(getErrorMessage(err));
      setPcrItems([]);
    } finally {
      setIsPcrLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Activity" subtitle="Timeline & history" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isHistoryRefreshing} onRefresh={refreshHistory} tintColor={colors.primary} />
        }
      >
        {pcrTask && (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <AppText size={12} bold muted style={{ letterSpacing: 0.8 }}>
                  PCR HISTORY
                </AppText>
                <AppText size={16} bold style={{ marginTop: 6 }}>
                  {pcrTask.caseNumber}
                </AppText>
              </View>
              <TouchableOpacity
                style={[styles.closePcrBtn, { backgroundColor: colors.iconButton }]}
                onPress={() => setPcrTask(null)}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isPcrLoading ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} />
            ) : pcrError ? (
              <AppText size={13} color={colors.danger} style={{ marginTop: 12 }}>
                {pcrError}
              </AppText>
            ) : pcrItems.length === 0 ? (
              <AppText size={13} muted style={{ marginTop: 12 }}>
                No reports uploaded yet.
              </AppText>
            ) : (
              <View style={{ marginTop: 12, gap: 10 }}>
                {pcrItems.map((r) => (
                  <View key={r.id} style={[styles.pcrRow, { borderColor: colors.border, backgroundColor: colors.noteBg }]}>
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <AppText size={13} bold>
                        {new Date(r.createdAt).toLocaleString()}
                      </AppText>
                      {!!r.note && (
                        <AppText size={12} secondary style={{ marginTop: 2 }} numberOfLines={2}>
                          {r.note}
                        </AppText>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
                        <AppText size={11} muted>
                          {fileTypeLabel(r.mimeType)} · {Math.round((r.fileSize / 1024) * 10) / 10} KB
                        </AppText>
                        <TouchableOpacity
                          style={[styles.viewBtn, { backgroundColor: colors.iconButton, borderColor: colors.border }]}
                          onPress={() => {
                            if (!pcrTask) return;
                            const qs = new URLSearchParams({
                              taskId: pcrTask.taskId,
                              reportId: r.id,
                              mimeType: r.mimeType,
                              caseNumber: pcrTask.caseNumber,
                              fileSize: String(r.fileSize),
                              ...(r.note ? { note: r.note } : {}),
                            }).toString();
                            router.push((`/(main)/pcr-viewer?${qs}` as unknown) as Href);
                          }}
                        >
                          <Ionicons name="eye-outline" size={16} color={colors.primary} />
                          <AppText size={12} bold color={colors.primary}>
                            View
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {task ? (
          <>
            <AppText size={12} bold muted style={styles.sectionLabel}>
              CURRENT ASSIGNMENT
            </AppText>
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <AppText size={16} bold>{task.incident.caseNumber}</AppText>
              <AppText size={14} secondary style={styles.complaint}>
                {task.incident.chiefComplaint}
              </AppText>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <AppText size={16} bold style={styles.sectionTitle}>
                Progress
              </AppText>
              <TaskTimeline task={task} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <AppText size={16} bold style={styles.sectionTitle}>
                Timestamps
              </AppText>
              {MILESTONES.map(({ key, label }) => {
                const time = formatTime(task[key]);
                if (!time) return null;
                return (
                  <View key={key} style={styles.timestampRow}>
                    <View style={[styles.timestampDot, { backgroundColor: colors.accent }]} />
                    <View style={styles.timestampContent}>
                      <AppText size={14} bold>{label}</AppText>
                      <AppText size={13} muted style={{ marginTop: 2 }}>
                        {time}
                      </AppText>
                    </View>
                  </View>
                );
              })}
              {!MILESTONES.some(({ key }) => task[key]) && (
                <AppText size={14} muted>
                  No timestamps recorded yet.
                </AppText>
              )}
            </View>

            {task.incident.preHospitalManagement && (
              <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                <AppText size={16} bold style={styles.sectionTitle}>
                  Clinical notes
                </AppText>
                <AppText size={14} secondary style={styles.notes}>
                  {task.incident.preHospitalManagement}
                </AppText>
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Ionicons name="pulse-outline" size={40} color={colors.textMuted} />}
            title="No active assignment"
            message="Your current case timeline will appear here when dispatch assigns you."
          />
        )}

        <AppText size={12} bold muted style={[styles.sectionLabel, { marginTop: task ? 8 : 0 }]}>
          TASK HISTORY
        </AppText>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          {isHistoryLoading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 24 }} />
          ) : historyError ? (
            <ErrorState message={historyError} onRetry={refreshHistory} />
          ) : history.length === 0 ? (
            <AppText size={14} muted style={{ paddingVertical: 8 }}>
              No completed or cancelled tasks yet.
            </AppText>
          ) : (
            <>
              {history.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  colors={colors}
                  canUploadPcr={!!user && user.role === 'DRIVER' && item.status === 'COMPLETED'}
                  onUploadPcr={() => {
                    const qs = new URLSearchParams({
                      taskId: item.id,
                      caseNumber: item.incident.caseNumber,
                    }).toString();
                    router.push((`/(main)/patient-care-report?${qs}` as unknown) as Href);
                  }}
                  onViewPcr={() => openPcrHistory(item)}
                />
              ))}
              {hasMore && (
                <TouchableOpacity style={styles.loadMore} onPress={loadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <AppText size={14} bold color={colors.primary}>
                      Load more
                    </AppText>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 24 },
  sectionLabel: { letterSpacing: 0.8, marginBottom: 10 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  complaint: { marginTop: 6, lineHeight: 20 },
  sectionTitle: { marginBottom: 14 },
  timestampRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  timestampDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 12,
  },
  timestampContent: { flex: 1 },
  notes: { lineHeight: 22 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  historyMain: { flex: 1 },
  pcrBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closePcrBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcrRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  viewBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadMore: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
  },
});
