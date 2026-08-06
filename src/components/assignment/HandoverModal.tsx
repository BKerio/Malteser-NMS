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

function formatDistance(km?: number | null) {
  if (km == null || !Number.isFinite(km)) return 'Distance unknown';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

interface HandoverModalProps {
  visible: boolean;
  caseNumber: string;
  currentVehicleId: string;
  /** Releasing unit or scene coords — used to rank nearby free ambulances. */
  referenceLat?: number | null;
  referenceLng?: number | null;
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
  referenceLat,
  referenceLng,
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
        const list = await getAvailableHandoverVehicles({
          excludeVehicleId: currentVehicleId,
          lat: referenceLat,
          lng: referenceLng,
        });
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
  }, [visible, currentVehicleId, referenceLat, referenceLng]);

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

  const hasReceiver = autoAssign ? vehicles.length > 0 : Boolean(pickedVehicleId);
  const canSubmit =
    selected.length > 0 && reasonText.length >= 5 && !isSubmitting && hasReceiver;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm({
      reason: reasonText,
      autoAssign,
      newVehicleId: !autoAssign ? pickedVehicleId : undefined,
    });
  };

  const nearest = vehicles[0];

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
                TRANSFER CASE
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
                Pass this live case to a nearby free ambulance that already has a driver. The case
                stays open — it is not cancelled — and dispatch plus the receiving crew are notified
                for the log.
              </AppText>
            </View>

            <AppText size={12} bold muted style={styles.sectionLabel}>
              WHY ARE YOU TRANSFERRING?
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
              Extra notes for dispatch
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
              placeholder="Anything the next crew should know…"
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
                  Send to nearest free unit
                </AppText>
                <AppText size={12} muted style={{ marginTop: 2 }}>
                  {loadingVehicles
                    ? 'Looking for nearby ambulances…'
                    : nearest
                      ? `Suggested: ${nearest.registrationNumber} · ${formatDistance(nearest.distanceKm)}`
                      : 'No free ambulances with a driver right now'}
                </AppText>
              </View>
              <Switch
                value={autoAssign}
                onValueChange={(v) => {
                  setAutoAssign(v);
                  if (v) setPickedVehicleId(undefined);
                }}
                disabled={isSubmitting || vehicles.length === 0}
              />
            </View>

            {!autoAssign && (
              <View style={{ marginTop: 12 }}>
                <AppText size={12} bold muted style={styles.sectionLabel}>
                  CHOOSE A NEARBY FREE AMBULANCE
                </AppText>
                {loadingVehicles ? (
                  <ActivityIndicator color={colors.primary} />
                ) : loadError ? (
                  <AppText size={13} color={colors.danger}>
                    {loadError}
                  </AppText>
                ) : vehicles.length === 0 ? (
                  <AppText size={13} muted>
                    No other free ambulances with a checked-in driver are nearby. Stay with the case
                    or call dispatch.
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
                        <View style={styles.vehicleRow}>
                          <View style={{ flex: 1 }}>
                            <AppText size={14} bold={active}>
                              {v.registrationNumber}
                            </AppText>
                            <AppText size={12} muted style={{ marginTop: 2 }}>
                              {v.currentDriver?.name ?? 'Driver'}
                              {v.currentEmt ? ` · EMT ${v.currentEmt.name}` : ''}
                              {v.lastLocationName ? ` · ${v.lastLocationName}` : ''}
                            </AppText>
                          </View>
                          <View
                            style={[
                              styles.distancePill,
                              { backgroundColor: active ? colors.primary : colors.noteBg },
                            ]}
                          >
                            <AppText
                              size={11}
                              bold
                              color={active ? colors.onPrimary : colors.primary}
                            >
                              {formatDistance(v.distanceKm)}
                            </AppText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {!loadingVehicles && vehicles.length === 0 ? (
              <AppText size={13} color={colors.danger} style={{ marginTop: 12 }}>
                A receiving ambulance is required so the case stays active for patients and the log.
              </AppText>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.footerBtn, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <AppText size={15} bold>
                Keep case
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
                    Transfer case
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
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distancePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
