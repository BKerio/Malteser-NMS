import { Linking, Platform } from 'react-native';

/**
 * Open Google Maps turn-by-turn navigation only (not the generic geo: chooser
 * that surfaces Uber/Bolt).
 */
export async function openGoogleMapsNavigation(lat: number, lng: number) {
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving&dir_action=navigate`;

  if (Platform.OS === 'android') {
    const navIntent = `google.navigation:q=${lat},${lng}`;
    try {
      const canOpen = await Linking.canOpenURL(navIntent);
      if (canOpen) {
        await Linking.openURL(navIntent);
        return;
      }
    } catch {
      // fall through
    }
  }

  if (Platform.OS === 'ios') {
    const gmaps = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    try {
      const canOpen = await Linking.canOpenURL(gmaps);
      if (canOpen) {
        await Linking.openURL(gmaps);
        return;
      }
    } catch {
      // fall through
    }
  }

  await Linking.openURL(webUrl);
}
