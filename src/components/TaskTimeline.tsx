import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '@/components/shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import type { Task, TaskStatus } from '@/types/api';
import { STATUS_LABELS, STATUS_ORDER } from '@/utils/taskStatus';
import { useTheme } from '@/context/ThemeContext';

function stepDone(task: Task, status: TaskStatus): boolean {
  const idx = STATUS_ORDER.indexOf(status);
  const currentIdx = STATUS_ORDER.indexOf(task.status);
  if (task.status === 'CANCELLED') return false;
  return currentIdx > idx || (currentIdx === idx && status !== 'PENDING');
}

export default function TaskTimeline({ task }: { task: Task }) {
  const { colors } = useTheme();
  const steps = STATUS_ORDER;

  return (
    <View style={styles.container}>
      {steps.map((status, i) => {
        const done = stepDone(task, status);
        const active = task.status === status;
        return (
          <View key={status} style={styles.row}>
            <View style={styles.iconCol}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: colors.border },
                  done && { backgroundColor: colors.accent },
                  active && { backgroundColor: colors.brandNavy },
                ]}
              >
                {done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.line, { backgroundColor: colors.border }, done && { backgroundColor: colors.accent }]} />
              )}
            </View>
            <AppText size={14} muted={!active} bold={active} style={styles.label}>
              {STATUS_LABELS[status]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 36 },
  iconCol: { alignItems: 'center', width: 28, marginRight: 12 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: { width: 2, flex: 1, minHeight: 16, marginVertical: 2 },
  label: { fontSize: 14, paddingTop: 2 },
});
