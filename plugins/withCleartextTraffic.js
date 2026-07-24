const {
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Release APKs block plain HTTP by default. Expo Go / debug builds allow it
 * via android/app/src/debug/AndroidManifest.xml — release does not.
 * This plugin enables cleartext for release so http:// API hosts work.
 */
function withCleartextTraffic(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    AndroidConfig.Manifest.ensureToolsAvailable(manifest);

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.$['android:usesCleartextTraffic'] = 'true';
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    app.$['tools:targetApi'] = '28';

    return config;
  });

  // Ensure network_security_config.xml exists after prebuild (EAS regenerates android/).
  config = withDangerousModWriteNetworkConfig(config);

  return config;
}

function withDangerousModWriteNetworkConfig(config) {
  const { withDangerousMod } = require('@expo/config-plugins');
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      const dest = path.join(xmlDir, 'network_security_config.xml');
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">156.67.25.84</domain>
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
  </domain-config>
</network-security-config>
`;
      fs.writeFileSync(dest, xml);
      return config;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withCleartextTraffic,
  'with-nms-cleartext-traffic',
  '1.0.0'
);
