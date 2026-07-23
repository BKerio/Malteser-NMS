import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { useTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const FONT_LOAD_TIMEOUT_MS = 8_000;

export default function FontLoader({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [timedOut, setTimedOut] = useState(false);
  const [loaded, error] = useFonts({
    OpenDyslexic: require('../../../assets/fonts/OpenDyslexic-Regular.otf'),
    'OpenDyslexic-Bold': require('../../../assets/fonts/OpenDyslexic-Bold.otf'),
  });

  const fontsReady = loaded || Boolean(error) || timedOut;

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <AccessibilityProvider fontsLoaded={loaded && !error}>{children}</AccessibilityProvider>;
}
