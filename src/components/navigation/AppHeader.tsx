import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/shared/AppText';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const ROLE_LABELS = { DRIVER: 'Driver', EMT: 'EMT', NURSE: 'Nurse' } as const;

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  /** Use back chevron instead of drawer menu (detail screens). */
  showBack?: boolean;
  onBack?: () => void;
}

export default function AppHeader({ title, subtitle, rightAction, showBack, onBack }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();

  const roleLabel = user ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : '';

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.headerBorder },
      ]}
    >
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.menuBtn, { backgroundColor: colors.iconButton, shadowColor: colors.shadow }]}
          onPress={showBack ? handleBack : () => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityLabel={showBack ? 'Go back' : 'Open menu'}
        >
          <Ionicons
            name={showBack ? 'chevron-back' : 'menu'}
            size={showBack ? 26 : 24}
            color={colors.primary}
          />
        </TouchableOpacity>

        <View style={styles.titles}>
          <AppText size={18} bold numberOfLines={1}>
            {title}
          </AppText>
          <AppText size={13} secondary numberOfLines={1} style={{ marginTop: 2 }}>
            {subtitle ?? `${user?.name ?? ''}${roleLabel ? ` · ${roleLabel}` : ''}`}
          </AppText>
        </View>

        <View style={styles.right}>{rightAction ?? <View style={styles.menuBtn} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
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
  titles: { flex: 1 },
  right: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
});
