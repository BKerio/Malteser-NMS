import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import ThemeStatusBar from '@/components/shared/ThemeStatusBar';
import FontLoader from '@/components/shared/FontLoader';
import Toast from 'react-native-toast-message';
import { ensureApiReady } from '@/api/client';

export default function RootLayout() {
  useEffect(() => {
    ensureApiReady().catch(() => {
      // First real request will retry / failover
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <FontLoader>
        <ThemeStatusBar />
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
          </Stack>
          <Toast />
        </AuthProvider>
        </FontLoader>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
