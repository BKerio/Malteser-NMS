import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontWeightOption = 'normal' | 'bold' | 'italic';

export interface AccessibilitySettings {
  fontScale: number;
  fontWeight: FontWeightOption;
  dyslexiaFont: boolean;
}

interface AccessibilityContextValue extends AccessibilitySettings {
  setFontScale: (scale: number) => void;
  setFontWeight: (weight: FontWeightOption) => void;
  setDyslexiaFont: (enabled: boolean) => void;
  resetAccessibility: () => void;
  getTextStyle: (baseSize: number, options?: { bold?: boolean }) => TextStyle;
  fontsLoaded: boolean;
}

const STORAGE_KEY = 'nms_accessibility';

const DEFAULTS: AccessibilitySettings = {
  fontScale: 1,
  fontWeight: 'normal',
  dyslexiaFont: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AccessibilityProvider({
  children,
  fontsLoaded,
}: {
  children: React.ReactNode;
  fontsLoaded: boolean;
}) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
        setSettings({
          fontScale: clamp(parsed.fontScale ?? DEFAULTS.fontScale, 0.85, 1.6),
          fontWeight: parsed.fontWeight ?? DEFAULTS.fontWeight,
          dyslexiaFont: parsed.dyslexiaFont ?? DEFAULTS.dyslexiaFont,
        });
      } catch {
        // ignore corrupt storage
      }
    });
  }, []);

  const update = useCallback((patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setFontScale = useCallback(
    (fontScale: number) => update({ fontScale: clamp(fontScale, 0.85, 1.6) }),
    [update]
  );

  const setFontWeight = useCallback(
    (fontWeight: FontWeightOption) => update({ fontWeight }),
    [update]
  );

  const setDyslexiaFont = useCallback(
    (dyslexiaFont: boolean) => update({ dyslexiaFont }),
    [update]
  );

  const resetAccessibility = useCallback(() => {
    setSettings(DEFAULTS);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
  }, []);

  const getTextStyle = useCallback(
    (baseSize: number, options?: { bold?: boolean }): TextStyle => {
      const scaledSize = Math.round(baseSize * settings.fontScale);
      const isBold = options?.bold || settings.fontWeight === 'bold';
      const isItalic = settings.fontWeight === 'italic';

      if (settings.dyslexiaFont && fontsLoaded) {
        return {
          fontSize: scaledSize,
          fontFamily: isBold ? 'OpenDyslexic-Bold' : 'OpenDyslexic',
          fontStyle: isItalic ? 'italic' : 'normal',
        };
      }

      return {
        fontSize: scaledSize,
        fontWeight: isBold ? '700' : '400',
        fontStyle: isItalic ? 'italic' : 'normal',
      };
    },
    [settings, fontsLoaded]
  );

  const value = useMemo(
    () => ({
      ...settings,
      setFontScale,
      setFontWeight,
      setDyslexiaFont,
      resetAcceessibility,
      getTextStyle,
      fontsLoaded,
    }),
    [settings, setFontScale, setFontWeight, setDyslexiaFont, resetAccessibility, getTextStyle, fontsLoaded]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
