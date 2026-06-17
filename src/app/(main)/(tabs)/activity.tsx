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
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState, { ErrorState } from '@/components/shared/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import TaskTimeline from '@/components/TaskTimeline';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';
import { getTaskHistory } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { STATUS_LABELS } from '@/utils/taskStatus';
import type { PaginatedMeta, TaskHistoryItem } from '@/types/api';

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

function HistoryRow({ item, colors }: { item: TaskHistoryItem; colors: ReturnType<typeof useTheme>['colors'] }) {
  const endedAt = item.completedAt ?? item.cancelledAt ?? item.receivedAt;
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
      </View>
      <StatusBadge status={item.status} />
    </View>
  );
}

export default function ActivityScreen() {
  const { task } = useActiveTaskContext();
  const { colors } = useTheme();
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryRefreshing, setIsHistoryRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Activity" subtitle="Timeline & history" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isHistoryRefreshing} onRefresh={refreshHistory} tintColor={colors.primary} />
        }
      >
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
                <HistoryRow key={item.id} item={item} colors={colors} />
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
  loadMore: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
  },
});
