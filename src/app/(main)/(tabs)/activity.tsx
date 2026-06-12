import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState from '@/components/shared/EmptyState';
import TaskTimeline from '@/components/TaskTimeline';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';
import { STATUS_LABELS } from '@/utils/taskStatus';

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

export default function ActivityScreen() {
  const { task } = useActiveTaskContext();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Activity" subtitle="Response timeline" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {!task ? (
          <EmptyState
            icon={<Ionicons name="pulse-outline" size={48} color={colors.textMuted} />}
            title="No activity yet"
            message="Timestamps and status updates for your current assignment will show here."
          />
        ) : (
          <>
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
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 24 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  caseRef: { fontSize: 16, fontWeight: '800' },
  complaint: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  timestampRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  timestampDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 12,
  },
  timestampContent: { flex: 1 },
  timestampLabel: { fontSize: 14, fontWeight: '600' },
  timestampTime: { fontSize: 13, marginTop: 2 },
  noTimestamps: { fontSize: 14 },
  notes: { fontSize: 14, lineHeight: 22 },
});
