import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import ThemeStatusBar from '@/components/shared/ThemeStatusBar';
import FontLoader from '@/components/shared/FontLoader';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
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
