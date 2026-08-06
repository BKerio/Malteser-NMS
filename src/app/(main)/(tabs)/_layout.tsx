import { Tabs } from 'expo-router/tabs';
import ResponderTabBar from '@/components/navigation/ResponderTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="crew"
      tabBar={(props) => <ResponderTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Default styles unused by custom bar, but keep for fallbacks
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="crew"
        options={{
          title: 'Crew',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Assignment',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
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
        }}
      />
    </Tabs>
  );
}
