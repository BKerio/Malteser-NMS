import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useTheme } from '@/context/ThemeContext';

interface AppTextProps extends TextProps {
  size?: number;
  bold?: boolean;
  color?: string;
  secondary?: boolean;
  muted?: boolean;
  style?: TextStyle | TextStyle[];
}

export default function AppText({
  size = 14,
  bold = false,
  color,
  secondary = false,
  muted = false,
  style,
  children,
  ...props
}: AppTextProps) {
  const { getTextStyle } = useAccessibility();
  const { colors } = useTheme();

  const textColor =
    color ?? (muted ? colors.textMuted : secondary ? colors.textSecondary : colors.text);

  return (
    <Text style={[getTextStyle(size, { bold }), { color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
}
