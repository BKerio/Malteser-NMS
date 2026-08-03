import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/components/shared/AppText';
import { getAvailableHandoverVehicles } from '@/api/responder';
import { getErrorMessage } from '@/api/client';
import { useTheme } from '@/context/ThemeContext';
import type { VehicleWithCrew } from '@/types/api';

export const HANDOVER_REASON_PRESETS = [
  'Driver unable to continue — medical / personal',
  'Vehicle mechanical issue',
  'Crew fatigue / end of shift mid-case',
  'Escalation — higher-capability unit needed',
  'Conflict of interest / safety concern',
  'Other — see notes',
] as const;

interface HandoverModalProps {
  visible: boolean;
  caseNumber: string;
  currentVehicleId: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    reason: string;
    autoAssign: boolean;
    newVehicleId?: string;
  }) => void;
}

export default function HandoverModal({
  visible,
  caseNumber,
  currentVehicleId,
  isSubmitting = false,
  onClose,
  onConfirm,
}: HandoverModalProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [autoAssign, setAutoAssign] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleWithCrew[]>([]);
  const [pickedVehicleId, setPickedVehicleId] = useState<string | undefined>();
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoadingVehicles(true);
      setLoadError(null);
      try {
        const list = await getAvailableHandoverVehicles(currentVehicleId);
        if (!cancelled) setVehicles(list);
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingVehicles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, currentVehicleId]);

  const reset = () => {
    setSelected('');
    setExtraNote('');
    setAutoAssign(true);
    setPickedVehicleId(undefined);
    setLoadError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const reasonText = selected
    ? extraNote.trim()
      ? `${selected} — ${extraNote.trim()}`
      : selected
    : '';
  const canSubmit = selected.length > 0 && reasonText.length >= 5 && !isSubmitting;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm({
      reason: reasonText,
      autoAssign: autoAssign,
      newVehicleId: !autoAssign ? pickedVehicleId : undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { backgroundColor: colors.brandNavy }]}>
            <View style={{ flex: 1 }}>
              <AppText size={12} bold color={colors.onPrimary} style={{ opacity: 0.85 }}>
                HANDOVER / TERMINATE
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
            <View style={[styles.warning, { backgroundColor: colors.noteBg, borderColor: colors.border }]}>
              <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
              <AppText size={13} secondary style={styles.warningText}>
                Requires a valid reason. You will be checked out of this vehicle. Optionally assign
                another available driver to continue the case.
              </AppText>
            </View>

            <AppText size={12} bold muted style={styles.sectionLabel}>
              REASON
            </AppText>
            <View style={styles.presetList}>
              {HANDOVER_REASON_PRESETS.map((preset) => {
                const active = selected === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetBtn,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.noteBg : colors.background,
                      },
                    ]}
                    onPress={() => setSelected(preset)}
                    disabled={isSubmitting}
                  >
                    <AppText size={14} bold={active} color={active ? colors.primary : colors.text}>
                      {preset}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppText size={14} bold style={{ marginTop: 16, marginBottom: 8 }}>
              Additional notes
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
              placeholder="Detail for dispatch…"
              placeholderTextColor={colors.textMuted}
              value={extraNote}
              onChangeText={setExtraNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSubmitting}
            />

            <View style={[styles.switchRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <AppText size={14} bold>
                  Auto-assign available driver
                </AppText>
                <AppText size={12} muted style={{ marginTop: 2 }}>
                  Pick the nearest READY unit with a checked-in driver
                </AppText>
              </View>
              <Switch
                value={autoAssign}
                onValueChange={(v) => {
                  setAutoAssign(v);
                  if (v) setPickedVehicleId(undefined);
                }}
                disabled={isSubmitting}
              />
            </View>

            {!autoAssign && (
              <View style={{ marginTop: 12 }}>
                <AppText size={12} bold muted style={styles.sectionLabel}>
                  REPLACEMENT VEHICLE (OPTIONAL)
                </AppText>
                {loadingVehicles ? (
                  <ActivityIndicator color={colors.primary} />
                ) : loadError ? (
                  <AppText size={13} color={colors.danger}>
                    {loadError}
                  </AppText>
                ) : vehicles.length === 0 ? (
                  <AppText size={13} muted>
                    No other available drivers checked in. Case will return to dispatch.
                  </AppText>
                ) : (
                  vehicles.map((v) => {
                    const active = pickedVehicleId === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          styles.presetBtn,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.noteBg : colors.background,
                            marginBottom: 8,
                          },
                        ]}
                        onPress={() =>
                          setPickedVehicleId((prev) => (prev === v.id ? undefined : v.id))
                        }
                        disabled={isSubmitting}
                      >
                        <AppText size={14} bold={active}>
                          {v.registrationNumber}
                        </AppText>
                        <AppText size={12} muted style={{ marginTop: 2 }}>
                          {v.currentDriver?.name ?? 'Driver'}
                          {v.currentEmt ? ` · EMT ${v.currentEmt.name}` : ''}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
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
                { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.5 },
              ]}
              onPress={handleConfirm}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Ionicons name="swap-horizontal" size={18} color={colors.onPrimary} />
                  <AppText size={15} bold color={colors.onPrimary}>
                    Confirm handover
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
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
    flex: 1.6,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 0,
  },
});
