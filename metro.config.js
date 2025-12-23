const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Включите CSS поддержку для NativeWind
  isCSSEnabled: true,
});

// УДАЛИТЬ весь блок про transformer и resolver для SVG!
// Нативная поддержка SVG уже включена.

// Примените NativeWind в конце (как и было)
module.exports = withNativeWind(config, { input: './global.css' });