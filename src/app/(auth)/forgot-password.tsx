import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();

  return (
    <AuthWrapper>
      <View style={styles.header}>
        <Ionicons name="key-outline" size={40} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Password reset</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Contact your agency administrator or dispatcher to reset your responder account password.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.brandNavy }]}
        onPress={() => router.back()}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Back to sign in</Text>
      </TouchableOpacity>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  button: {
    borderRadius: 15,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
