import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import LogoutConfirmModal from '@/components/shared/LogoutConfirmModal';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCrewCheckIn } from '@/context/CrewCheckInContext';
import { getApiBaseUrl } from '@/config/env';

const ROLE_LABELS = { DRIVER: 'Driver', EMT: 'EMT', NURSE: 'Nurse' } as const;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { checkOut, myVehicle } = useCrewCheckIn();
  const [showLogout, setShowLogout] = useState(false);

  const roleLabel = user ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : '';

  const handleLogout = async () => {
    setShowLogout(false);
    if (myVehicle) {
      try {
        await checkOut();
      } catch {
        // Continue logout even if check-out fails
      }
    }
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LogoutConfirmModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />

      <AppHeader title="Profile" subtitle="Account & preferences" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: colors.brandNavy }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <AppText size={28} bold color={colors.onPrimary}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </AppText>
          </View>
          <AppText size={22} bold color="#fff">
            {user?.name}
          </AppText>
          <AppText size={13} color="#94a3b8" style={styles.role}>
            {roleLabel}
          </AppText>
          <AppText size={14} color="#cbd5e1" style={{ marginTop: 6 }}>
            {user?.email}
          </AppText>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <AppText size={12} muted style={styles.apiLabel}>
            API endpoint
          </AppText>
          <AppText size={13} secondary style={styles.apiUrl}>
            {getApiBaseUrl()}
          </AppText>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <TouchableOpacity style={styles.helpRow}>
            <Ionicons name="help-circle-outline" size={22} color={colors.text} />
            <View style={styles.helpText}>
              <AppText size={15} bold>
                Need help?
              </AppText>
              <AppText size={13} secondary style={{ marginTop: 2 }}>
                Contact your dispatcher or agency admin.
              </AppText>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.dangerBg }]}
          onPress={() => setShowLogout(true)}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          <AppText size={16} bold color={colors.danger}>
            Sign out
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: { fontSize: 28, fontWeight: '800' },
  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  role: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  email: { color: '#cbd5e1', fontSize: 14, marginTop: 6 },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  apiLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  apiUrl: { fontSize: 13, fontFamily: 'monospace' },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  helpText: { flex: 1 },
  helpTitle: { fontSize: 15, fontWeight: '600' },
  helpSub: { fontSize: 13, marginTop: 2 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
  },
  signOutText: { fontSize: 16, fontWeight: '600' },
});
