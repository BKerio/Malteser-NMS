import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/shared/AppText';
import { CLOSURE_REASON_PRESETS, buildClosureReason } from '@/constants/closureReasons';
import { useTheme } from '@/context/ThemeContext';

interface EndCaseModalProps {
  visible: boolean;
  caseNumber: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function EndCaseModal({
  visible,
  caseNumber,
  isSubmitting = false,
  onClose,
  onConfirm,
}: EndCaseModalProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState('');
  const [extraNote, setExtraNote] = useState('');

  const reset = () => {
    setSelected('');
    setExtraNote('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!selected || isSubmitting) return;
    onConfirm(buildClosureReason(selected, extraNote));
  };

  const reasonText = buildClosureReason(selected, extraNote);
  const canSubmit = selected.length > 0 && reasonText.length >= 10 && !isSubmitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { backgroundColor: colors.danger }]}>
            <View style={{ flex: 1 }}>
              <AppText size={12} bold color={colors.onPrimary} style={{ opacity: 0.85 }}>
                END CASE
              </AppText>
              <AppText size={18} bold color={colors.onPrimary} style={{ marginTop: 2 }}>
                {caseNumber}
              </AppText>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={[styles.warning, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
              <Ionicons name="warning-outline" size={18} color={colors.danger} />
              <AppText size={13} color={colors.danger} style={styles.warningText}>
                This closes the case at the current stage. A reason is required and will be saved to the record.
              </AppText>
            </View>

            <AppText size={12} bold muted style={styles.sectionLabel}>
              QUICK SELECT
            </AppText>
            <View style={styles.presetList}>
              {CLOSURE_REASON_PRESETS.map((preset) => {
                const active = selected === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetBtn,
                      {
                        borderColor: active ? colors.danger : colors.border,
                        backgroundColor: active ? colors.dangerBg : colors.background,
                      },
                    ]}
                    onPress={() => setSelected(preset)}
                    disabled={isSubmitting}
                  >
                    <AppText size={14} bold={active} color={active ? colors.danger : colors.text}>
                      {preset}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppText size={14} bold style={{ marginTop: 16, marginBottom: 8 }}>
              Additional notes (optional)
            </AppText>
            <TextInput
              style={[
                styles.noteInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              placeholder="Any extra detail for dispatch…"
              placeholderTextColor={colors.textMuted}
              value={extraNote}
              onChangeText={setExtraNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.footerBtn, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <AppText size={15} bold>
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerBtn,
                styles.confirmBtn,
                { backgroundColor: colors.danger, opacity: canSubmit ? 1 : 0.5 },
              ]}
              onPress={handleConfirm}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color={colors.onPrimary} />
                  <AppText size={15} bold color={colors.onPrimary}>
                    End case
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeBtn: { padding: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  warning: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  warningText: { flex: 1, lineHeight: 20 },
  sectionLabel: { marginBottom: 10, letterSpacing: 0.5 },
  presetList: { gap: 8 },
  presetBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 88,
    padding: 12,
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  footerBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 0,
  },
});
