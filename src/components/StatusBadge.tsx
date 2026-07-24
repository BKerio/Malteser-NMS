import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TaskStatus } from '@/types/api';
import { STATUS_LABELS } from '@/utils/taskStatus';

const COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#FBF1DD', text: '#B7791F' },
  ACCEPTED: { bg: '#E8EFFD', text: '#2563EB' },
  EN_ROUTE: { bg: '#E8F3ED', text: '#005A32' },
  AT_SCENE: { bg: '#EDF2EF', text: '#15211B' },
  PATIENT_PICKED: { bg: '#FBF3DD', text: '#B7791F' },
  AT_HOSPITAL: { bg: '#E8EFFD', text: '#2563EB' },
  COMPLETED: { bg: '#E8F3ED', text: '#005A32' },
  CANCELLED: { bg: '#FBEAEA', text: '#D62828' },
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
