import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

type Step = 'phone' | 'code';

export default function LoginScreen() {
  const { requestOtp, verifyOtp } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      Toast.show({ type: 'error', text1: 'Enter your phone number', position: 'bottom' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { expiresInSeconds } = await requestOtp(phone.trim());
      setStep('code');
      setCode('');
      setCooldown(45);
      Toast.show({
        type: 'success',
        text1: 'Code sent',
        text2: `Enter the 6-digit code sent to your phone. It expires in ${Math.round(expiresInSeconds / 60)} minutes.`,
        position: 'bottom',
        bottomOffset: 60,
      });
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not send code',
        text2: getErrorMessage(err),
        position: 'bottom',
        bottomOffset: 60,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit code', position: 'bottom' });
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(phone.trim(), code.trim());
      router.replace(MAIN_HOME);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
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
          {step === 'phone'
            ? 'Enter your registered phone number to receive a sign-in code.'
            : `Enter the 6-digit code sent to ${phone.trim()}.`}
        </Text>
      </View>

      {step === 'phone' ? (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Phone number</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="e.g. 0712 345 678"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                returnKeyType="send"
                onSubmitEditing={handleSendCode}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.brandNavy }, isSubmitting && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Send code</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            For Drivers, EMTs, and Nurses only. Contact your dispatcher if you need an account.
          </Text>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>6-digit code</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="keypad-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={codeInputRef}
                style={[styles.input, styles.codeInput, { color: colors.inputText }]}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                returnKeyType="done"
                onSubmitEditing={handleVerify}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.brandNavy }, isSubmitting && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Verify &amp; sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.rowBetween}>
            <TouchableOpacity onPress={() => { setStep('phone'); setCode(''); }} disabled={isSubmitting}>
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>Change number</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendCode} disabled={isSubmitting || cooldown > 0}>
              <Text
                style={[
                  styles.linkText,
                  { color: cooldown > 0 ? colors.textMuted : colors.brandNavy },
                ]}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10, marginRight: 10 },
  codeInput: { fontSize: 22, letterSpacing: 8, fontWeight: '700' },
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  linkText: { fontSize: 13, fontWeight: '600' },
});
