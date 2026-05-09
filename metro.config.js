const { getDefaultConfig } = require('expo/metro-config');
const { withShareExtension } = require('expo-share-extension/metro');

const config = withShareExtension(getDefaultConfig(__dirname));
config.resolver.sourceExts.push('sql');

module.exports = config;
