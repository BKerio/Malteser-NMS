import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
