const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add assets directory to watch folders
config.watchFolders = [
  path.resolve(__dirname, 'assets')
];

module.exports = config;