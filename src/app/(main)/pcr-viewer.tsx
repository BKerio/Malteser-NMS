import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import mammoth from 'mammoth';
import AppHeader from '@/components/navigation/AppHeader';
import AppText from '@/components/shared/AppText';
import EmptyState, { ErrorState } from '@/components/shared/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { getErrorMessage } from '@/api/client';
import {
  base64ToArrayBuffer,
  downloadPcrFile,
  getPcrFileKind,
  readPcrFileBase64,
  type PcrFileKind,
} from '@/utils/pcrFiles';

const SCREEN_WIDTH = Dimensions.get('window').width;

const KIND_META: Record<
  PcrFileKind,
  { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; hint: string }
> = {
  image: { label: 'Photo', icon: 'image-outline', hint: 'Pinch to zoom on iOS' },
  pdf: { label: 'PDF', icon: 'document-text-outline', hint: 'Scroll to read' },
  docx: { label: 'Word document', icon: 'document-outline', hint: 'Scroll to read' },
  unknown: { label: 'File', icon: 'help-circle-outline', hint: '' },
};

function docHtml(content: string, textColor: string, bg: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; margin: 0; color: ${textColor}; background: ${bg}; line-height: 1.6; font-size: 15px; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    td, th { border: 1px solid #ccc; padding: 8px; }
    p { margin: 0 0 12px; }
  </style>
</head>
<body>${content}</body>
</html>`;
}

function pdfHtml(base64: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #111827; }
    embed { width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <embed src="data:application/pdf;base64,${base64}" type="application/pdf" width="100%" height="100%" />
</body>
</html>`;
}

export default function PcrViewerScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{
    taskId?: string;
    reportId?: string;
    mimeType?: string;
    caseNumber?: string;
    note?: string;
    fileSize?: string;
  }>();

  const taskId = params.taskId ?? '';
  const reportId = params.reportId ?? '';
  const mimeType = params.mimeType ?? 'application/octet-stream';
  const caseNumber = params.caseNumber ?? '';
  const note = params.note ?? '';
  const fileSizeKb = params.fileSize ? Math.round((Number(params.fileSize) / 1024) * 10) / 10 : null;

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const kind: PcrFileKind = useMemo(() => getPcrFileKind(mimeType), [mimeType]);
  const meta = KIND_META[kind];
  const title = caseNumber || 'Patient Care Report';
  const viewerBg = isDark ? '#0b1220' : '#0f172a';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!taskId || !reportId) {
        setError('Missing report details');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setLocalUri(null);
      setHtml(null);
      setImageHeight(null);

      try {
        const uri = await downloadPcrFile(taskId, reportId, mimeType);
        if (cancelled) return;

        if (kind === 'image') {
          setLocalUri(uri);
          Image.getSize(
            uri,
            (w, h) => {
              if (!cancelled) {
                const displayWidth = SCREEN_WIDTH - 32;
                setImageHeight(Math.max(displayWidth * (h / w), displayWidth * 0.6));
              }
            },
            () => {
              if (!cancelled) setImageHeight(SCREEN_WIDTH * 1.2);
            }
          );
        } else if (kind === 'pdf') {
          const base64 = await readPcrFileBase64(uri);
          if (cancelled) return;
          setHtml(pdfHtml(base64));
        } else if (kind === 'docx') {
          const base64 = await readPcrFileBase64(uri);
          if (cancelled) return;
          const arrayBuffer = base64ToArrayBuffer(base64);
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (cancelled) return;
          setHtml(docHtml(result.value, colors.text, colors.card));
        } else {
          throw new Error('Unsupported file type');
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId, reportId, mimeType, kind, colors.text, colors.card, reloadKey]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        showBack
        title={title}
        subtitle={`${meta.label} report${fileSizeKb ? ` · ${fileSizeKb} KB` : ''}`}
      />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <View style={[styles.loadingCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <AppText size={15} bold style={{ marginTop: 16 }}>
              Loading report…
            </AppText>
            <AppText size={13} muted style={{ marginTop: 6 }}>
              Downloading securely from server
            </AppText>
          </View>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : kind === 'unknown' ? (
        <EmptyState
          icon={<Ionicons name="document-outline" size={40} color={colors.textMuted} />}
          title="Cannot preview"
          message="This file type cannot be previewed in the app."
        />
      ) : (
        <View style={styles.body}>
          <View style={[styles.metaRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.typeBadge, { backgroundColor: colors.noteBg }]}>
              <Ionicons name={meta.icon} size={16} color={colors.accent} />
              <AppText size={13} bold color={colors.accent}>
                {meta.label}
              </AppText>
            </View>
            {!!meta.hint && (
              <AppText size={12} muted style={{ flex: 1 }}>
                {meta.hint}
              </AppText>
            )}
          </View>

          {!!note && (
            <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.noteHeader}>
                <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.primary} />
                <AppText size={12} bold muted style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Crew note
                </AppText>
              </View>
              <AppText size={14} secondary style={{ marginTop: 8, lineHeight: 21 }}>
                {note}
              </AppText>
            </View>
          )}

          <View style={[styles.viewerFrame, { backgroundColor: viewerBg, borderColor: colors.border }]}>
            {kind === 'image' && localUri ? (
              <ScrollView
                style={styles.imageScroll}
                contentContainerStyle={styles.imageScrollContent}
                maximumZoomScale={Platform.OS === 'ios' ? 4 : 1}
                minimumZoomScale={1}
                centerContent
                showsVerticalScrollIndicator={false}
                bouncesZoom={Platform.OS === 'ios'}
              >
                <Image
                  source={{ uri: localUri }}
                  style={[styles.image, { height: imageHeight ?? SCREEN_WIDTH * 1.2 }]}
                  resizeMode="contain"
                />
              </ScrollView>
            ) : html ? (
              <WebView
                style={styles.webview}
                originWhitelist={['*']}
                source={{ html }}
                scalesPageToFit
                startInLoadingState
                renderLoading={() => (
                  <View style={[styles.webviewLoading, { backgroundColor: viewerBg }]}>
                    <ActivityIndicator color={colors.accent} />
                  </View>
                )}
              />
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerFrame: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 280,
  },
  imageScroll: { flex: 1 },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  image: {
    width: SCREEN_WIDTH - 48,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
