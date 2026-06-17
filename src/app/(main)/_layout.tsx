import { Drawer } from 'expo-router/drawer';
import { ActiveTaskProvider } from '@/context/ActiveTaskContext';
import { CrewCheckInProvider } from '@/context/CrewCheckInContext';
import { useTheme } from '@/context/ThemeContext';
import DrawerContent from '@/components/navigation/DrawerContent';

export default function MainLayout() {
  const { colors } = useTheme();

  return (
    <ActiveTaskProvider>
      <CrewCheckInProvider>
        <Drawer
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerType: 'front',
            drawerStyle: { width: 300, backgroundColor: colors.drawerBg },
            overlayColor: colors.overlay,
            swipeEdgeWidth: 60,
          }}
        >
          <Drawer.Screen name="(tabs)" options={{ title: 'NMS Responder' }} />
          <Drawer.Screen
            name="patient-data"
            options={{
              drawerItemStyle: { display: 'none' },
              swipeEnabled: false,
            }}
          />
        </Drawer>
      </CrewCheckInProvider>
    </ActiveTaskProvider>
  );
}
