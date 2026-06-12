import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface LogoutConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({ visible, onCancel, onConfirm }: LogoutConfirmModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.noteBg }]}>
            <MaterialCommunityIcons name="logout" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Sign out?</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            You will need to sign in again to view assignments and update response status.
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: colors.noteBg }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Stay signed in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: colors.brandNavy }]}
              onPress={onConfirm}
            >
              <Text style={[styles.confirmText, { color: colors.onPrimary }]}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {},
  confirmBtn: {},
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmText: { fontSize: 15, fontWeight: '600' },
});
