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

const LightColors: ThemeColors = {
  background: '#f8f9fc',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#0a1d37',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  primary: '#0a1d37',
  accent: '#0d9488',
  border: '#e2e8f0',
  inputBg: '#ececec',
  inputText: '#0f172a',
  tabBar: '#ffffff',
  tabActive: '#0a1d37',
  tabInactive: '#94a3b8',
  iconButton: '#ffffff',
  headerBorder: '#e8edf4',
  drawerBg: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.5)',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  success: '#0d9488',
  successBg: '#ecfdf5',
  noteBg: '#f8fafc',
  locationBg: '#f0fdfa',
  shadow: '#0a1d37',
  onPrimary: '#ffffff',
  brandNavy: '#0a1d37',
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
