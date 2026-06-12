import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { submitPatientData } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { useTheme } from '@/context/ThemeContext';

export default function PatientDataScreen() {
  const { colors } = useTheme();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [preHospitalManagement, setPreHospitalManagement] = useState('');
  const [dispatcherChallenges, setDispatcherChallenges] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!taskId) return;
    if (!preHospitalManagement.trim()) {
      Toast.show({ type: 'error', text1: 'Clinical notes are required', position: 'bottom' });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPatientData(taskId, {
        preHospitalManagement: preHospitalManagement.trim(),
        dispatcherChallenges: dispatcherChallenges.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'Notes saved', position: 'bottom' });
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: getErrorMessage(err), position: 'bottom' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: colors.brandNavy }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.onPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onPrimary }]}>Clinical Notes</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.text }]}>Pre-hospital management *</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Vitals, interventions, patient condition, and treatment given.
            </Text>
            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholder="e.g. Patient conscious, BP 120/80, O2 administered..."
              placeholderTextColor={colors.textMuted}
              value={preHospitalManagement}
              onChangeText={setPreHospitalManagement}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Challenges (optional)</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Access issues, delays, or complications encountered.
            </Text>
            <TextInput
              style={[
                styles.textarea,
                { minHeight: 100, backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="e.g. Heavy traffic, narrow access road..."
              placeholderTextColor={colors.textMuted}
              value={dispatcherChallenges}
              onChangeText={setDispatcherChallenges}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.accent }, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.submitText, { color: colors.onPrimary }]}>Save Notes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  form: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 13, marginTop: 4, marginBottom: 10 },
  textarea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    minHeight: 160,
  },
  submitBtn: {
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 16, fontWeight: '700' },
});
