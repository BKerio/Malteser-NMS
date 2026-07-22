import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import AuthWrapper from '@/components/AuthWrapper';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getErrorMessage } from '@/api/client';

const MAIN_HOME = '/(main)/(tabs)' as Href;

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Enter email and password', position: 'bottom' });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(MAIN_HOME);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: getErrorMessage(err),
        position: 'bottom',
        bottomOffset: 60,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthWrapper>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/images/nccg.png')}
            style={styles.logoNccg}
            resizeMode="contain"
            accessibilityLabel="Nairobi City County"
          />
          <View style={[styles.logoDivider, { backgroundColor: colors.border }]} />
          <Image
            source={require('../../../assets/images/malteser.png')}
            style={styles.logoMalteser}
            resizeMode="contain"
            accessibilityLabel="Malteser International"
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Emergency Operations Platform</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in with your crew credentials to view assignments and update response status.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="you@agency.org"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.brandNavy }, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Sign in</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          For Drivers, EMTs, and Nurses only. Contact your dispatcher if you need an account.
        </Text>
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 40, alignItems: 'center' },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 20,
  },
  logoNccg: { height: 46, width: 140 },
  logoMalteser: { height: 38, width: 120 },
  logoDivider: { width: 1, height: 40 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10, marginLeft: 2 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 20,
    height: 58,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10, marginRight: 10 },
  button: {
    borderRadius: 15,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
