import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type BrandSplashProps = {
  showSpinner?: boolean;
};

export default function BrandSplash({ showSpinner = true }: BrandSplashProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Image
        source={require('../../../assets/icon.png')}
        style={styles.icon}
        resizeMode="contain"
        accessibilityLabel="Nairobi City County"
      />
      {showSpinner ? (
        <ActivityIndicator size="large" color={colors.onPrimary} style={styles.spinner} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 160,
    height: 160,
  },
  spinner: {
    marginTop: 28,
  },
});
