import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import ActivityTimeline from '@/components/ActivityTimeline';
import EmptyState, { ErrorState } from '@/components/shared/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getPatientCareReports, getTaskHistory } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { buildTaskActivities, formatActivityTime } from '@/utils/taskActivities';
import type { PaginatedMeta, PatientCareReport, TaskHistoryItem } from '@/types/api';
import { getPcrFileKind } from '@/utils/pcrFiles';

function fileTypeLabel(mimeType: string) {
  const kind = getPcrFileKind(mimeType);
  if (kind === 'image') return 'Image';
  if (kind === 'pdf') return 'PDF';
  if (kind === 'docx') return 'DOCX';
  return 'File';
}

function AssignmentCard({
  item,
  expanded,
  onToggle,
  colors,
  canUploadPcr,
  onUploadPcr,
  pcrItems,
  isPcrLoading,
  pcrError,
  onViewPcr,
}: {
  item: TaskHistoryItem;
  expanded: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  canUploadPcr: boolean;
  onUploadPcr: () => void;
  pcrItems: PatientCareReport[] | null;
  isPcrLoading: boolean;
  pcrError: string | null;
  onViewPcr: (report: PatientCareReport) => void;
}) {
  const endedAt = item.completedAt ?? item.cancelledAt ?? item.receivedAt;
  const pcrCount = item.pcrCount ?? 0;
  const activities = useMemo(() => buildTaskActivities(item, { live: false }), [item]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.cardHeaderMain}>
          <View style={styles.cardTopRow}>
            <AppText size={16} bold>
              {item.incident.caseNumber}
            </AppText>
            <StatusBadge status={item.status} />
          </View>
          <AppText size={13} secondary style={{ marginTop: 6 }} numberOfLines={2}>
            {item.incident.chiefComplaint}
          </AppText>
          <AppText size={12} muted style={{ marginTop: 6 }}>
            {item.vehicle.registrationNumber} · {item.incident.locationName}
          </AppText>
          <AppText size={12} muted style={{ marginTop: 2 }}>
            {formatActivityTime(endedAt)}
            {pcrCount > 0 ? ` · ${pcrCount} PCR` : ''}
            {activities.length > 0 ? ` · ${activities.filter((a) => a.timestamp).length} stages` : ''}
          </AppText>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expanded, { borderTopColor: colors.border }]}>
          <AppText size={13} bold muted style={styles.sectionLabel}>
            STAGES & ACTIVITY
          </AppText>
          <ActivityTimeline activities={activities} />

          {item.status === 'CANCELLED' && item.cancelReason ? (
            <AppText size={13} color={colors.danger} style={{ marginTop: 8 }}>
              {item.cancelReason}
            </AppText>
          ) : null}

          <AppText size={13} bold muted style={[styles.sectionLabel, { marginTop: 16 }]}>
            PCR REPORTS
          </AppText>

          {isPcrLoading ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 12 }} />
          ) : pcrError ? (
            <AppText size={13} color={colors.danger}>
              {pcrError}
            </AppText>
          ) : !pcrItems || pcrItems.length === 0 ? (
            <View style={styles.pcrEmpty}>
              <AppText size={13} muted>
                No PCR reports uploaded yet.
              </AppText>
              {canUploadPcr && (
                <TouchableOpacity
                  style={[styles.pcrBtn, { backgroundColor: colors.iconButton, borderColor: colors.border }]}
                  onPress={onUploadPcr}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
                  <AppText size={13} bold color={colors.primary}>
                    Upload PCR
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {pcrItems.map((r) => (
                <View
                  key={r.id}
                  style={[styles.pcrRow, { borderColor: colors.border, backgroundColor: colors.noteBg }]}
                >
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <AppText size={13} bold>
                      {formatActivityTime(r.createdAt)}
                    </AppText>
                    {!!r.note && (
                      <AppText size={12} secondary style={{ marginTop: 2 }} numberOfLines={2}>
                        {r.note}
                      </AppText>
                    )}
                    <View style={styles.pcrMetaRow}>
                      <AppText size={11} muted>
                        {fileTypeLabel(r.mimeType)} · {Math.round((r.fileSize / 1024) * 10) / 10} KB
                      </AppText>
                      <TouchableOpacity
                        style={[
                          styles.viewBtn,
                          { backgroundColor: colors.iconButton, borderColor: colors.border },
                        ]}
                        onPress={() => onViewPcr(r)}
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
              {canUploadPcr && (
                <TouchableOpacity
                  style={[styles.pcrBtn, { backgroundColor: colors.iconButton, borderColor: colors.border }]}
                  onPress={onUploadPcr}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
                  <AppText size={13} bold color={colors.primary}>
                    Upload another PCR
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pcrCache, setPcrCache] = useState<Record<string, PatientCareReport[]>>({});
  const [pcrLoadingId, setPcrLoadingId] = useState<string | null>(null);
  const [pcrErrors, setPcrErrors] = useState<Record<string, string>>({});

  const loadHistory = useCallback(async (page: number, append: boolean) => {
    if (page === 1) setError(null);
    try {
      const result = await getTaskHistory(page, 15);
      setMeta(result.meta);
      setHistory((prev) => (append ? [...prev, ...result.data] : result.data));
      setHistoryPage(page);
    } catch (err) {
      setError(getErrorMessage(err));
      if (!append) setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory(1, false).finally(() => setIsLoading(false));
  }, [loadHistory]);

  const refresh = async () => {
    setIsRefreshing(true);
    setPcrCache({});
    setPcrErrors({});
    await loadHistory(1, false);
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (!meta || historyPage >= meta.totalPages || isLoadingMore) return;
    setIsLoadingMore(true);
    await loadHistory(historyPage + 1, true);
    setIsLoadingMore(false);
  };

  const loadPcrs = async (taskId: string) => {
    if (pcrCache[taskId] || pcrLoadingId === taskId) return;
    setPcrLoadingId(taskId);
    setPcrErrors((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    try {
      const data = await getPatientCareReports(taskId);
      setPcrCache((prev) => ({ ...prev, [taskId]: data }));
    } catch (err) {
      setPcrErrors((prev) => ({ ...prev, [taskId]: getErrorMessage(err) }));
    } finally {
      setPcrLoadingId(null);
    }
  };

  const toggleExpand = (item: TaskHistoryItem) => {
    const next = expandedId === item.id ? null : item.id;
    setExpandedId(next);
    if (next) loadPcrs(item.id);
  };

  const hasMore = meta ? historyPage < meta.totalPages : false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="History" subtitle="Ended cases with stages, times & PCR" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : history.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="time-outline" size={40} color={colors.textMuted} />}
            title="No assignment history"
            message="When a case is completed or ended, it moves here with every stage timestamp and PCR reports."
          />
        ) : (
          <>
            <AppText size={12} bold muted style={styles.listLabel}>
              ENDED CASES{meta ? ` · ${meta.total}` : ''}
            </AppText>
            {history.map((item) => (
              <AssignmentCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => toggleExpand(item)}
                colors={colors}
                canUploadPcr={!!user && user.role === 'DRIVER' && item.status === 'COMPLETED'}
                onUploadPcr={() => {
                  const qs = new URLSearchParams({
                    taskId: item.id,
                    caseNumber: item.incident.caseNumber,
                  }).toString();
                  router.push((`/(main)/patient-care-report?${qs}` as unknown) as Href);
                }}
                pcrItems={pcrCache[item.id] ?? null}
                isPcrLoading={pcrLoadingId === item.id}
                pcrError={pcrErrors[item.id] ?? null}
                onViewPcr={(r) => {
                  const qs = new URLSearchParams({
                    taskId: item.id,
                    reportId: r.id,
                    mimeType: r.mimeType,
                    caseNumber: item.incident.caseNumber,
                    fileSize: String(r.fileSize),
                    ...(r.note ? { note: r.note } : {}),
                  }).toString();
                  router.push((`/(main)/pcr-viewer?${qs}` as unknown) as Href);
                }}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 24 },
  listLabel: { letterSpacing: 0.8, marginBottom: 12 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardHeaderMain: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  expanded: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  sectionLabel: { letterSpacing: 0.8, marginBottom: 10 },
  pcrEmpty: { gap: 10 },
  pcrBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pcrRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pcrMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
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
    paddingTop: 8,
    paddingBottom: 4,
  },
});
