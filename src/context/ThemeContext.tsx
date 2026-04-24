import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof LightColors;
}

const LightColors = {
  background: '#e6f3fb',
  card: '#ffffff',
  text: '#334155',
  textSecondary: '#64748b',
  primary: '#0a1d37',
  accent: '#38bdf8',
  border: '#334155',
  inputBg: '#ffffff',
  inputPlaceholder: '#94a3b8',
};

const DarkColors = {
  background: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  primary: '#38bdf8',
  accent: '#0a1d37',
  border: '#334155',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputPlaceholder: '#64748b',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemColorScheme || 'light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
