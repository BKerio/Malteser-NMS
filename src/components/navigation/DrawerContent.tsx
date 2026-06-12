import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AppText from '@/components/shared/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';
import StatusBadge from '@/components/StatusBadge';
import LogoutConfirmModal from '@/components/shared/LogoutConfirmModal';

const ROLE_LABELS = { DRIVER: 'Driver', EMT: 'EMT', NURSE: 'Nurse' } as const;

const NAV_ITEMS = [
  { label: 'Assignment', icon: 'medical-outline', route: '/(main)/(tabs)/' as const },
  { label: 'Crew', icon: 'people-outline', route: '/(main)/(tabs)/crew' as const },
  { label: 'Activity', icon: 'pulse-outline', route: '/(main)/(tabs)/activity' as const },
  { label: 'Profile', icon: 'person-outline', route: '/(main)/(tabs)/profile' as const },
  { label: 'Settings', icon: 'settings-outline', route: '/(main)/(tabs)/settings' as const },
];

export default function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { task } = useActiveTaskContext();
  const { colors } = useTheme();
  const [showLogout, setShowLogout] = useState(false);

  const roleLabel = user ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : '';
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?';

  const navigate = (route: string) => {
    props.navigation.closeDrawer();
    router.push(route as any);
  };

  const handleLogoutConfirm = async () => {
    setShowLogout(false);
    props.navigation.closeDrawer();
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <>
      <LogoutConfirmModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogoutConfirm}
      />

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flex: 1, backgroundColor: colors.drawerBg }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: colors.brandNavy }]}>
          <View style={styles.avatar}>
            <AppText size={22} bold color="#fff">
              {initial}
            </AppText>
          </View>
          <AppText size={20} bold color="#fff">
            {user?.name}
          </AppText>
          <AppText size={13} color="#94a3b8" style={styles.meta}>
            {roleLabel}
          </AppText>
          <AppText size={13} color="#cbd5e1" style={{ marginTop: 4 }}>
            {user?.email}
          </AppText>

          {task && (
            <View style={styles.activeCase}>
              <MaterialCommunityIcons name="ambulance" size={16} color="#5eead4" />
              <AppText size={13} bold color="#e2e8f0" style={{ flex: 1 }}>
                {task.incident.caseNumber}
              </AppText>
              <StatusBadge status={task.status} />
            </View>
          )}
        </View>

        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity key={item.route} style={styles.navItem} onPress={() => navigate(item.route)}>
              <Ionicons name={item.icon as any} size={22} color={colors.text} />
              <AppText size={16} bold style={styles.navLabel}>
                {item.label}
              </AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.footerItem} onPress={() => navigate('/(main)/(tabs)/profile')}>
            <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
            <AppText size={15} bold secondary>
              Help & Support
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem} onPress={() => setShowLogout(true)}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <AppText size={15} bold color={colors.danger}>
              Sign out
            </AppText>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  meta: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  email: { color: '#cbd5e1', fontSize: 13, marginTop: 4 },
  activeCase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 12,
  },
  activeCaseText: { color: '#e2e8f0', fontWeight: '700', flex: 1, fontSize: 13 },
  nav: { paddingHorizontal: 12, paddingTop: 8, flex: 1 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 14,
    marginBottom: 4,
  },
  navLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  footer: {
    borderTopWidth: 1,
    padding: 12,
    marginTop: 'auto',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  footerLabel: { fontSize: 15, fontWeight: '600' },
});
