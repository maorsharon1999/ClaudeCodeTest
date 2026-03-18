const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'firebase/app') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/firebase/app/dist/index.cjs.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'firebase/auth') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/firebase/auth/dist/index.cjs.js'),
      type: 'sourceFile',
    };
  }
  // Fall through to default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
