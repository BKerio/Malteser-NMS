const appJson = require('./app.json');

// Bake public env into the native/JS bundle so EAS cloud builds
// still hit the production API even if EAS env vars aren't set.
const googleMapsKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ||
  appJson.expo?.extra?.googleMapsKey ||
  '';
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  appJson.expo?.extra?.apiUrl ||
  'http://156.67.25.84:8080';
const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || apiUrl;

const existingSchemes = appJson.expo?.ios?.infoPlist?.LSApplicationQueriesSchemes || [];

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios?.config || {}),
        googleMapsApiKey: googleMapsKey,
      },
      infoPlist: {
        ...(appJson.expo.ios?.infoPlist || {}),
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          ...(appJson.expo.ios?.infoPlist?.NSAppTransportSecurity || {}),
        },
        LSApplicationQueriesSchemes: [
          ...new Set([...existingSchemes, 'comgooglemaps', 'googlechromes']),
        ],
      },
    },
    android: {
      ...appJson.expo.android,
      usesCleartextTraffic: true,
      permissions: [
        ...new Set([...(appJson.expo.android?.permissions || []), 'INTERNET']),
      ],
      config: {
        ...(appJson.expo.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsKey,
        },
      },
    },
    extra: {
      ...(appJson.expo.extra || {}),
      apiUrl,
      socketUrl,
      googleMapsKey,
      eas: {
        ...(appJson.expo.extra?.eas || {}),
        projectId: '04b3c784-8fe8-4c1d-aba4-03a652183c42',
      },
    },
  },
};
