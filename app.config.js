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
  },
};
