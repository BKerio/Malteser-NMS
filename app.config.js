const appJson = require('./app.json');

const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';

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
        LSApplicationQueriesSchemes: [
          ...new Set([...existingSchemes, 'comgooglemaps', 'googlechromes']),
        ],
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsKey,
        },
      },
    },
    extra: {
      ...(appJson.expo.extra || {}),
      eas: {
        ...(appJson.expo.extra?.eas || {}),
        projectId: '04b3c784-8fe8-4c1d-aba4-03a652183c42',
      },
    },
  },
};
