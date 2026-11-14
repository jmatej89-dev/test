// Minimal react-native stand-in for Node render tests (Skia runs on CanvasKit there).
const Noop = () => null;
module.exports = {
  Platform: { OS: 'web', select: (o) => o.web ?? o.default },
  PixelRatio: { get: () => 1 },
  NativeModules: {},
  TurboModuleRegistry: { get: () => null, getEnforcing: () => ({}) },
  View: Noop,
  Image: { resolveAssetSource: (a) => a },
  requireNativeComponent: () => Noop,
  findNodeHandle: Noop,
  StyleSheet: { create: (s) => s, flatten: (s) => s },
};
