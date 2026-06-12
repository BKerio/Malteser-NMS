import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const MAIN_HOME = '/(main)/(tabs)' as Href;

export default function Index() {
  const { token, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={MAIN_HOME} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
