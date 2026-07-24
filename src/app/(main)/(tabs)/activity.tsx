import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import ActivityTimeline from '@/components/ActivityTimeline';
import EmptyState, { ErrorState } from '@/components/shared/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';
import { buildTaskActivities, formatActivityTime } from '@/utils/taskActivities';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { task, isLoading, isRefreshing, error, refresh } = useActiveTaskContext();

  const activities = useMemo(
    () => (task ? buildTaskActivities(task, { live: true }) : []),
    [task]
  );

  const openMap = () => {
    if (!task?.incident?.lat || !task?.incident?.lng) return;
    const qs = new URLSearchParams({
      lat: String(task.incident.lat),
      lng: String(task.incident.lng),
      label: task.incident.locationName || 'Incident scene',
    }).toString();
    router.push((`/(main)/navigate?${qs}` as unknown) as Href);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Activity"
        subtitle="Live stages for your assigned case"
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
        {error && !task ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : !task && !isLoading ? (
          <EmptyState
            icon={<MaterialCommunityIcons name="timeline-clock-outline" size={48} color={colors.textMuted} />}
            title="No active case"
            message="When you are assigned a case, real-time stages and timestamps will appear here. Ended cases move to History."
            actionLabel="View history"
            onAction={() => router.push('/(main)/(tabs)/history')}
          />
        ) : task ? (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <AppText size={18} bold>
                    {task.incident.caseNumber}
                  </AppText>
                  <AppText size={13} secondary style={{ marginTop: 4 }} numberOfLines={2}>
                    {task.incident.chiefComplaint}
                  </AppText>
                </View>
                <StatusBadge status={task.status} />
              </View>

              <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <AppText size={13} secondary style={{ flex: 1 }}>
                  {task.incident.locationName}
                  {task.incident.subCounty ? ` · ${task.incident.subCounty}` : ''}
                </AppText>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <AppText size={13} secondary>
                  Assigned {formatActivityTime(task.receivedAt) ?? '—'}
                </AppText>
              </View>

              {task.incident.placeOfReferral ? (
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="hospital-building" size={16} color={colors.textSecondary} />
                  <AppText size={13} secondary style={{ flex: 1 }}>
                    Referral · {task.incident.placeOfReferral}
                  </AppText>
                </View>
              ) : null}

              {task.incident.lat != null && task.incident.lng != null ? (
                <TouchableOpacity
                  style={[styles.mapBtn, { backgroundColor: colors.locationBg, borderColor: colors.border }]}
                  onPress={openMap}
                >
                  <Ionicons name="map-outline" size={18} color={colors.primary} />
                  <AppText size={14} bold color={colors.primary}>
                    Open live map
                  </AppText>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <AppText size={12} bold muted style={styles.sectionLabel}>
                LIVE STAGES
              </AppText>
              <ActivityTimeline activities={activities} />
            </View>

            <AppText size={12} muted style={styles.footerHint}>
              Stages update in real time as the crew advances the case. When the case is ended or completed, it moves to History.
            </AppText>
          </>
        ) : null}
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
  scroll: { padding: 20, paddingBottom: 28 },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
    marginTop: 2,
  },
  mapBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sectionLabel: { letterSpacing: 0.8, marginBottom: 12 },
  footerHint: { lineHeight: 18, paddingHorizontal: 4 },
});
