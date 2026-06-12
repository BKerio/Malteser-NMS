import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/shared/AppText';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      {icon}
      <AppText size={18} bold style={styles.title}>
        {title}
      </AppText>
      <AppText size={14} secondary style={styles.message}>
        {message}
      </AppText>
      {actionLabel && onAction && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.brandNavy }]} onPress={onAction}>
          <AppText size={14} bold color={colors.onPrimary}>
            {actionLabel}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <EmptyState
      icon={<Ionicons name="warning-outline" size={40} color={colors.danger} />}
      title="Something went wrong"
      message={message}
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  btn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
