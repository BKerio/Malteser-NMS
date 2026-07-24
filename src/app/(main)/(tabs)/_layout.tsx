import { Tabs } from 'expo-router/tabs';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useActiveTaskContext } from '@/context/ActiveTaskContext';
import { useTheme } from '@/context/ThemeContext';

export default function TabsLayout() {
  const { task } = useActiveTaskContext();
  const { colors } = useTheme();
  const hasTask = !!task;

  return (
    <Tabs
      initialRouteName="crew"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBar,
            shadowColor: colors.shadow,
            borderTopColor: colors.border,
          },
        ],
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="crew"
        options={{
          title: 'Crew',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Assignment',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'clipboard-pulse' : 'clipboard-pulse-outline'}
              size={24}
              color={color}
            />
          ),
          tabBarBadge: hasTask ? ' ' : undefined,
          tabBarBadgeStyle: [styles.badge, { backgroundColor: colors.accent }],
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: { paddingTop: 2 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  badge: {
    minWidth: 8,
    maxWidth: 8,
    height: 8,
    borderRadius: 4,
    top: 4,
    left: 2,
  },
});
