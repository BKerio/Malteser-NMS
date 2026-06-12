import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TaskStatus } from '@/types/api';
import { STATUS_LABELS } from '@/utils/taskStatus';

const COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#b45309' },
  ACCEPTED: { bg: '#dbeafe', text: '#1d4ed8' },
  EN_ROUTE: { bg: '#e0e7ff', text: '#4338ca' },
  AT_SCENE: { bg: '#fce7f3', text: '#be185d' },
  PATIENT_PICKED: { bg: '#ffedd5', text: '#c2410c' },
  AT_HOSPITAL: { bg: '#ccfbf1', text: '#0f766e' },
  COMPLETED: { bg: '#dcfce7', text: '#15803d' },
  CANCELLED: { bg: '#fee2e2', text: '#b91c1c' },
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  const colors = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
