import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

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
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
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

const DarkColors: ThemeColors = {
  background: '#0b1220',
  surface: '#111827',
  card: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#38bdf8',
  accent: '#2dd4bf',
  border: '#334155',
  inputBg: '#1e293b',
  inputText: '#f8fafc',
  tabBar: '#111827',
  tabActive: '#38bdf8',
  tabInactive: '#64748b',
  iconButton: '#1e293b',
  headerBorder: '#1e293b',
  drawerBg: '#111827',
  overlay: 'rgba(0, 0, 0, 0.65)',
  danger: '#f87171',
  dangerBg: '#450a0a',
  success: '#2dd4bf',
  successBg: '#042f2e',
  noteBg: '#0f172a',
  locationBg: '#042f2e',
  shadow: '#000000',
  onPrimary: '#0a1d37',
  brandNavy: '#0a1d37',
};

const THEME_STORAGE_KEY = 'nms_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isDark = theme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors }}>
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
