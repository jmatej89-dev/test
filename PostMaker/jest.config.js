/**
 * Tests run in a Node environment that boots CanvasKit (Skia compiled to wasm),
 * so the exact same drawing code used by the app produces the golden PNGs.
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: '<rootDir>/src/testing/skiaEnv.js',
  setupFiles: ['@shopify/react-native-skia/jestSetup.js'],
  transform: { '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest' },
  transformIgnorePatterns: ['node_modules/(?!(@shopify/react-native-skia|canvaskit-wasm)/)'],
  moduleNameMapper: { '^react-native$': '<rootDir>/src/testing/rnStub.js' },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testTimeout: 60000,
};
