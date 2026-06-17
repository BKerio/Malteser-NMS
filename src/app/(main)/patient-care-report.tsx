import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import ConfirmActionModal from '@/components/shared/ConfirmActionModal';
import { uploadPatientCareReport } from '@/api/responder';
import { useTheme } from '@/context/ThemeContext';
import { getErrorMessage } from '@/api/client';

export default function PatientCareReportScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ taskId?: string; caseNumber?: string }>();
  const taskId = params.taskId ?? '';
  const caseNumber = params.caseNumber ?? '';

  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const title = useMemo(() => (caseNumber ? `PCR · ${caseNumber}` : 'Patient Care Report'), [caseNumber]);

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!res.canceled) setImageUri(res.assets[0]?.uri ?? null);
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.9,
    });
    if (!res.canceled) setImageUri(res.assets[0]?.uri ?? null);
  };

  const submit = async () => {
    if (!taskId) {
      Toast.show({ type: 'error', text1: 'Missing task', text2: 'Please return to Assignment and try again.' });
      return;
    }
    if (!imageUri) {
      Toast.show({ type: 'error', text1: 'Add a photo', text2: 'Take a photo or pick an image to upload.' });
      return;
    }
    setIsUploading(true);
    try {
      await uploadPatientCareReport(taskId, { note: note.trim() || undefined, image: { uri: imageUri } });
      Toast.show({
        type: 'success',
        text1: 'PCR uploaded',
        text2: 'Patient care report saved successfully.',
        position: 'bottom',
        bottomOffset: 90,
      });
      router.back();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: getErrorMessage(err),
        position: 'bottom',
        bottomOffset: 90,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ConfirmActionModal
        visible={confirmSkip}
        iconName="file-cancel-outline"
        title="Skip PCR upload?"
        message="You can upload later from Activity history (coming soon), but dispatch may require a report to close the case."
        cancelLabel="Continue"
        confirmLabel="Skip"
        tone="danger"
        onCancel={() => setConfirmSkip(false)}
        onConfirm={() => {
          setConfirmSkip(false);
          router.back();
        }}
      />

      <AppHeader title={title} subtitle="Upload photo + add a short note" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <AppText size={16} bold>
            Report image
          </AppText>
          <AppText size={13} secondary style={{ marginTop: 6, lineHeight: 19 }}>
            Take a clear photo of the patient care report (PCR), or upload a saved image.
          </AppText>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={takePhoto}
              disabled={isUploading}
            >
              <Ionicons name="camera" size={18} color={colors.onPrimary} />
              <AppText size={14} bold color={colors.onPrimary}>
                Take photo
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.iconButton }]}
              onPress={pickFromLibrary}
              disabled={isUploading}
            >
              <Ionicons name="image" size={18} color={colors.text} />
              <AppText size={14} bold>
                Choose image
              </AppText>
            </TouchableOpacity>
          </View>

          {imageUri ? (
            <View style={[styles.previewWrap, { borderColor: colors.border }]}>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: colors.overlay }]}
                onPress={() => setImageUri(null)}
                disabled={isUploading}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.noteBg }]}>
              <MaterialCommunityIcons name="file-image-outline" size={34} color={colors.textMuted} />
              <AppText size={13} muted style={{ marginTop: 8 }}>
                No image selected yet
              </AppText>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <AppText size={16} bold>
            Note (optional)
          </AppText>
          <AppText size={13} secondary style={{ marginTop: 6, lineHeight: 19 }}>
            Add any quick context for dispatch (handover details, complications, missing fields, etc.).
          </AppText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write a short note…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.noteInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.noteBg },
            ]}
            editable={!isUploading}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => setConfirmSkip(true)}
            disabled={isUploading}
          >
            <AppText size={15} bold muted>
              Skip for now
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.brandNavy }]}
            onPress={submit}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color={colors.onPrimary} />
                <AppText size={15} bold color={colors.onPrimary}>
                  Upload report
                </AppText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 28 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholder: {
    marginTop: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewWrap: {
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  preview: { width: '100%', height: 220 },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteInput: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 21,
  },
  footer: { flexDirection: 'row', gap: 12, marginTop: 4 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});

