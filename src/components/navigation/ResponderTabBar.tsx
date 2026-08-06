import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';

type IconSet = 'ion' | 'mci';

type TabVisual = {
  label: string;
  icon: string;
  iconFocused: string;
  set: IconSet;
  /** Elevated center “command” control for the active case */
  primary?: boolean;
};

const TAB_VISUALS: Record<string, TabVisual> = {
  crew: {
    label: 'Crew',
    icon: 'people-outline',
    iconFocused: 'people',
    set: 'ion',
  },
  index: {
    label: 'Assignment',
    icon: 'clipboard-pulse-outline',
    iconFocused: 'clipboard-pulse',
    set: 'mci',
    primary: true,
  },
  activity: {
    label: 'Activity',
    icon: 'timeline-clock-outline',
    iconFocused: 'timeline-clock',
    set: 'mci',
  },
  history: {
    label: 'History',
    icon: 'time-outline',
    iconFocused: 'time',
    set: 'ion',
  },
  settings: {
    label: 'Settings',
    icon: 'settings-outline',
    iconFocused: 'settings',
    set: 'ion',
  },
};

function TabIcon({
  visual,
  focused,
  color,
  size,
}: {
  visual: TabVisual;
  focused: boolean;
  color: string;
  size: number;
}) {
  const name = (focused ? visual.iconFocused : visual.icon) as any;
  if (visual.set === 'mci') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
}

/**
 * Floating “command dock” for responders.
 * Large hit targets, clear active chips, and bottom inset so Android/iOS
 * gesture bars don’t swallow taps.
 */
export default function ResponderTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { task } = useActiveTaskContext();
  const hasTask = !!task;

  const routes = useMemo(
    () => state.routes.filter((route) => route.name !== 'profile'),
    [state.routes]
  );

  const onPressTab = (routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      navigation.navigate(routeName);
    }
  };

  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingBottom: bottomPad,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.dock,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {routes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const visual = TAB_VISUALS[route.name] ?? {
            label: descriptors[route.key]?.options.title ?? route.name,
            icon: 'ellipse-outline',
            iconFocused: 'ellipse',
            set: 'ion' as IconSet,
          };
          const showLiveDot = hasTask && (route.name === 'index' || route.name === 'activity');
          const isPrimary = !!visual.primary;

          if (isPrimary) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={visual.label}
                onPress={() => onPressTab(route.name, route.key, isFocused)}
                style={({ pressed }) => [
                  styles.primaryHit,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <View
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: isFocused || hasTask ? colors.primary : colors.brandNavy,
                      shadowColor: colors.shadow,
                    },
                  ]}
                >
                  <TabIcon visual={visual} focused color={colors.onPrimary} size={26} />
                  {showLiveDot ? (
                    <View style={[styles.liveDot, { backgroundColor: colors.accent, borderColor: colors.onPrimary }]} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.primaryLabel,
                    { color: isFocused ? colors.primary : colors.tabInactive },
                  ]}
                  numberOfLines={1}
                >
                  {visual.label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={visual.label}
              hitSlop={6}
              onPress={() => onPressTab(route.name, route.key, isFocused)}
              style={({ pressed }) => [
                styles.tabHit,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View
                style={[
                  styles.chip,
                  isFocused && {
                    backgroundColor: colors.locationBg,
                    borderColor: colors.primary + '33',
                  },
                ]}
              >
                <View>
                  <TabIcon
                    visual={visual}
                    focused={isFocused}
                    color={isFocused ? colors.tabActive : colors.tabInactive}
                    size={22}
                  />
                  {showLiveDot ? (
                    <View style={[styles.miniDot, { backgroundColor: colors.accent }]} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: isFocused ? colors.tabActive : colors.tabInactive },
                  ]}
                  numberOfLines={1}
                >
                  {visual.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 72,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  tabHit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  chip: {
    minWidth: 58,
    maxWidth: 84,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 2,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  primaryHit: {
    width: 86,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -22,
    marginHorizontal: 2,
  },
  primaryBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  liveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  miniDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
