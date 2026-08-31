const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Firebase JS SDK v9 + Expo SDK 53+: Metro's package-exports resolution picks
// a Firebase build whose auth component never registers ("Component auth has
// not been registered yet"). Legacy resolution + cjs keeps the RN auth build.
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

module.exports = config;
