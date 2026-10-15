const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to allow internal react-native relative imports to resolve on Windows
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
