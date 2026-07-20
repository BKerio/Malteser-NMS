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
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';

function VitalsSummary({
  title,
  rows,
  colors,
}: {
  title: string;
  rows: Array<[string, string | undefined | null]>;
  colors: { card: string; border: string; text: string; textSecondary: string; textMuted: string };
}) {
  const filled = rows.filter(([, value]) => Boolean(value && String(value).trim()));
  if (!filled.length) return null;

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.summaryTitle, { color: colors.text }]}>{title}</Text>
      {filled.map(([label, value]) => (
        <View key={label} style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
          <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PatientDataScreen() {
  const { colors } = useTheme();
  const { task } = useActiveTaskContext();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [preHospitalManagement, setPreHospitalManagement] = useState(
    task?.incident.preHospitalManagement ?? ''
  );
  const [dispatcherChallenges, setDispatcherChallenges] = useState(
    task?.incident.dispatcherChallenges ?? ''
  );
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

  const vitals = task?.incident.vitals;
  const maternity = task?.incident.maternityVitals;

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
            <VitalsSummary
              title="Watcher vitals (read-only)"
              colors={colors}
              rows={[
                ['Temp', vitals?.temperature],
                ['Pulse', vitals?.pulseRate],
                ['RR', vitals?.respirationRate],
                ['BP', vitals?.bp],
                ['SPO₂', vitals?.spo2],
                ['FH', vitals?.fh],
              ]}
            />

            <VitalsSummary
              title="Maternity vitals (read-only)"
              colors={colors}
              rows={[
                ['Parity', maternity?.parity],
                ['Gravid', maternity?.gravid],
                ['FHR', maternity?.fetalHeartRate],
                ['Dilatation', maternity?.cervicalDilatation],
                ['BP', maternity?.bp],
                ['Pulse', maternity?.pulse],
                ['Temp', maternity?.temperature],
                ['SPO₂', maternity?.spo2],
                ['Mode of delivery', maternity?.modeOfDelivery],
                ['Baby condition', maternity?.conditionOfBaby],
              ]}
            />

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
  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 13, flex: 1, textAlign: 'right' },
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
