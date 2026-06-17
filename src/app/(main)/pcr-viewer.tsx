import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
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

function docHtml(content: string, textColor: string, bg: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; margin: 0; color: ${textColor}; background: ${bg}; line-height: 1.5; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 6px; }
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
    html, body { margin: 0; padding: 0; height: 100%; background: #1a1a1a; }
    embed, iframe { width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <embed src="data:application/pdf;base64,${base64}" type="application/pdf" width="100%" height="100%" />
</body>
</html>`;
}

export default function PcrViewerScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    taskId?: string;
    reportId?: string;
    mimeType?: string;
    caseNumber?: string;
    note?: string;
  }>();

  const taskId = params.taskId ?? '';
  const reportId = params.reportId ?? '';
  const mimeType = params.mimeType ?? 'application/octet-stream';
  const caseNumber = params.caseNumber ?? '';
  const note = params.note ?? '';

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const kind: PcrFileKind = useMemo(() => getPcrFileKind(mimeType), [mimeType]);
  const title = caseNumber ? `PCR · ${caseNumber}` : 'Patient Care Report';

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

      try {
        const uri = await downloadPcrFile(taskId, reportId, mimeType);
        if (cancelled) return;

        if (kind === 'image') {
          setLocalUri(uri);
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
          setHtml(docHtml(result.value, colors.text, colors.background));
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
  }, [taskId, reportId, mimeType, kind, colors.text, colors.background, reloadKey]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={title} subtitle="Report viewer" />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setReloadKey((k) => k + 1);
          }}
        />
      ) : kind === 'unknown' ? (
        <EmptyState
          icon={<Ionicons name="document-outline" size={40} color={colors.textMuted} />}
          title="Cannot preview"
          message="This file type cannot be previewed in the app."
        />
      ) : (
        <View style={styles.body}>
          {!!note && (
            <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <AppText size={12} bold muted style={{ textTransform: 'uppercase' }}>
                Note
              </AppText>
              <AppText size={14} secondary style={{ marginTop: 6, lineHeight: 20 }}>
                {note}
              </AppText>
            </View>
          )}

          {kind === 'image' && localUri ? (
            <ScrollView contentContainerStyle={styles.imageScroll}>
              <Image source={{ uri: localUri }} style={styles.image} resizeMode="contain" />
            </ScrollView>
          ) : html ? (
            <WebView
              style={styles.webview}
              originWhitelist={['*']}
              source={{ html }}
              scalesPageToFit
              startInLoadingState
              renderLoading={() => <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 16, paddingBottom: 24 },
  noteCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  imageScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  image: {
    width: '100%',
    minHeight: 420,
  },
  webview: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
