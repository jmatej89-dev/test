/**
 * Entry point. On native this is just Expo Router. On web (the page opened from the chat)
 * CanvasKit must be loaded before any Skia module is evaluated, so the app is required afterwards.
 */
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // The artifact page may live under any path; assets are resolved against where the page is,
  // and the router always starts at "/".
  const base = globalThis.__PM_BASE__ || '/';
  try {
    if (globalThis.__PM_BASE__) window.history.replaceState(null, '', '/');
  } catch {
    // History may be locked down in some frames; routing still works from the start screen.
  }
  const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
  LoadSkiaWeb({ locateFile: (file) => `${base}${file}` }).then(() => require('expo-router/entry'));
} else {
  require('expo-router/entry');
}
