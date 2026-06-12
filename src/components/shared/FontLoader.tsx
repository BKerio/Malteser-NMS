import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { useTheme } from '@/context/ThemeContext';

export default function FontLoader({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [loaded] = useFonts({
    OpenDyslexic: require('../../../assets/fonts/OpenDyslexic-Regular.otf'),
    'OpenDyslexic-Bold': require('../../../assets/fonts/OpenDyslexic-Bold.otf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <AccessibilityProvider fontsLoaded={loaded}>{children}</AccessibilityProvider>;
}
