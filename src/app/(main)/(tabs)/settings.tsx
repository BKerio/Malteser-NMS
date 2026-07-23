import React from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import { useTheme } from '@/context/ThemeContext';
import { useAccessibility, type FontWeightOption } from '@/context/AccessibilityContext';

const WEIGHT_OPTIONS: { id: FontWeightOption; label: string; icon: string }[] = [
  { id: 'normal', label: 'Normal', icon: 'text' },
  { id: 'bold', label: 'Bold', icon: 'format-bold' },
  { id: 'italic', label: 'Italic', icon: 'format-italic' },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const {
    fontScale,
    fontWeight,
    dyslexiaFont,
    setFontScale,
    setFontWeight,
    setDyslexiaFont,
    resetAccessibility,
    fontsLoaded,
  } = useAccessibility();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Settings" subtitle="Accessibility" />

      <ScrollView contentContainerStyle={styles.content}>
        <AppText size={12} bold secondary style={styles.sectionLabel}>
          ACCESSIBILITY
        </AppText>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.sliderHeader}>
            <MaterialCommunityIcons name="format-size" size={22} color={colors.text} />
            <AppText size={15} bold style={styles.rowLabel}>
              Text size
            </AppText>
            <AppText size={13} muted>
              {fontScale.toFixed(1)}×
            </AppText>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0.85}
            maximumValue={1.6}
            step={0.05}
            value={fontScale}
            onValueChange={setFontScale}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />
          <View style={styles.sliderLabels}>
            <AppText size={11} muted>
              Smaller
            </AppText>
            <AppText size={11} muted>
              Larger
            </AppText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <AppText size={15} bold style={styles.cardTitle}>
            Font weight & style
          </AppText>
          <View style={styles.segmentRow}>
            {WEIGHT_OPTIONS.map((opt) => {
              const active = fontWeight === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.segment,
                    { borderColor: colors.border, backgroundColor: active ? colors.brandNavy : colors.noteBg },
                  ]}
                  onPress={() => setFontWeight(opt.id)}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={18}
                    color={active ? colors.onPrimary : colors.textSecondary}
                  />
                  <AppText
                    size={13}
                    bold={active}
                    color={active ? colors.onPrimary : colors.textSecondary}
                    style={{ marginTop: 4 }}
                  >
                    {opt.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="eye-settings-outline" size={22} color={colors.text} />
            <View style={styles.flex}>
              <AppText size={16} style={styles.rowLabel}>
                Dyslexia-friendly font
              </AppText>
              <AppText size={12} secondary>
                Uses OpenDyslexic for easier reading
              </AppText>
            </View>
            <Switch
              value={dyslexiaFont}
              onValueChange={setDyslexiaFont}
              disabled={!fontsLoaded}
              trackColor={{ false: colors.border, true: colors.brandNavy }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={[styles.previewCard, { backgroundColor: colors.noteBg, borderColor: colors.border }]}>
          <AppText size={12} bold muted style={styles.previewLabel}>
            PREVIEW
          </AppText>
          <AppText size={20} bold>
            NMS Responder
          </AppText>
          <AppText size={15} secondary style={{ marginTop: 8, lineHeight: 22 }}>
            NMS-001 - patient stable, en route to facility.
          </AppText>
        </View>

        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: colors.border }]}
          onPress={resetAccessibility}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
          <AppText size={14} secondary>
            Reset accessibility to defaults
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { marginBottom: 8, marginTop: 4, letterSpacing: 0.8 },
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
  rowLabel: { flex: 1 },
  flex: { flex: 1 },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  cardTitle: { marginBottom: 14 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  previewLabel: { marginBottom: 10, letterSpacing: 0.6 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
