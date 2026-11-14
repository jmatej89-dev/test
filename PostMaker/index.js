/**
 * Entry point. On native this is just Expo Router. On web (used only for local UI previews)
 * CanvasKit must be loaded before any Skia module is evaluated, so the app is required afterwards.
 */
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
  LoadSkiaWeb({ locateFile: (file) => `/${file}` }).then(() => require('expo-router/entry'));
} else {
  require('expo-router/entry');
}
