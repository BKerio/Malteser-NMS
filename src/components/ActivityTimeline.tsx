import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/shared/AppText';
import { useTheme } from '@/context/ThemeContext';
import {
  formatActivityTimeFull,
  type TaskActivity,
} from '@/utils/taskActivities';

type Props = {
  activities: TaskActivity[];
  emptyMessage?: string;
};

export default function ActivityTimeline({
  activities,
  emptyMessage = 'No stage activity recorded yet.',
}: Props) {
  const { colors } = useTheme();

  if (activities.length === 0) {
    return (
      <AppText size={13} muted>
        {emptyMessage}
      </AppText>
    );
  }

  return (
    <View style={styles.container}>
      {activities.map((item, index) => {
        const isLast = index === activities.length - 1;
        const done = item.state === 'done';
        const active = item.state === 'active';
        const upcoming = item.state === 'upcoming';
        const skipped = item.state === 'skipped';

        const dotColor = active
          ? colors.brandNavy
          : done
            ? colors.accent
            : skipped
              ? colors.border
              : colors.border;
        const lineColor = done || active ? colors.accent : colors.border;

        return (
          <View key={item.key} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: dotColor }]}>
                {done ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : active ? (
                  <View style={[styles.pulse, { backgroundColor: colors.onPrimary }]} />
                ) : null}
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
            </View>
            <View style={styles.content}>
              <AppText
                size={15}
                bold={active || done}
                muted={upcoming || skipped}
                color={item.status === 'CANCELLED' ? colors.danger : undefined}
              >
                {item.label}
              </AppText>
              <AppText size={12} muted style={{ marginTop: 2 }}>
                {item.timestamp
                  ? formatActivityTimeFull(item.timestamp)
                  : active
                    ? 'In progress'
                    : upcoming
                      ? 'Upcoming'
                      : skipped
                        ? '—'
                        : 'Pending'}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 52 },
  rail: { width: 24, alignItems: 'center', marginRight: 12 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  line: { width: 2, flex: 1, minHeight: 24, marginTop: 2 },
  content: { flex: 1, paddingBottom: 14, paddingTop: 1 },
});
