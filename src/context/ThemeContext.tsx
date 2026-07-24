import React, { createContext, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  accent: string;
  border: string;
  inputBg: string;
  inputText: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  iconButton: string;
  headerBorder: string;
  drawerBg: string;
  overlay: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  noteBg: string;
  locationBg: string;
  shadow: string;
  onPrimary: string;
  brandNavy: string;
}

interface ThemeContextType {
  theme: 'light';
  isDark: false;
  colors: ThemeColors;
}

/** Aligned with frontend `index.css` design tokens */
const LightColors: ThemeColors = {
  background: '#F4F7F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#15211B',
  textSecondary: '#6B7670',
  textMuted: '#94A099',
  primary: '#005A32',
  accent: '#169A5B',
  border: '#E3E8E5',
  inputBg: '#F1F5F3',
  inputText: '#15211B',
  tabBar: '#FFFFFF',
  tabActive: '#005A32',
  tabInactive: '#94A099',
  iconButton: '#FFFFFF',
  headerBorder: '#E3E8E5',
  drawerBg: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  danger: '#D62828',
  dangerBg: '#FBEAEA',
  success: '#169A5B',
  successBg: '#E8F3ED',
  noteBg: '#F8FAF9',
  locationBg: '#E8F3ED',
  shadow: '#10211A',
  onPrimary: '#FFFFFF',
  brandNavy: '#06231A',
};

const THEME_STORAGE_KEY = 'nms_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AsyncStorage.removeItem(THEME_STORAGE_KEY);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', isDark: false, colors: LightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
