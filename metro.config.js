const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Exclude web-only files from mobile builds
config.resolver.blockList = [
  /src\/App\.js$/,
  /src\/pages\/.*\.js$/,
  /src\/components\/(Navigation|ProtectedRoute)\.js$/,
];

module.exports = config; 