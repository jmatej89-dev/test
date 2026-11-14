/* Jest environment: boots CanvasKit and shares typed-array constructors with it,
   so colour arrays created inside tests are accepted by CanvasKit (same realm). */
const { TestEnvironment } = require('jest-environment-node');
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit');

module.exports = class SkiaEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    const ck = await CanvasKitInit({});
    // CanvasKit checks `instanceof Array` – re-create plain arrays from the test realm in this realm.
    const outer = (a) => (Array.isArray(a) ? Array.prototype.map.call(a, (x) => x) : a);
    for (const name of ['MakeLinearGradient', 'MakeRadialGradient', 'MakeTwoPointConicalGradient', 'MakeSweepGradient']) {
      const orig = ck.Shader[name];
      ck.Shader[name] = function (...args) {
        return orig.apply(this, args.map(outer));
      };
    }
    this.global.CanvasKit = ck;
    for (const k of ['Float32Array', 'Uint8Array', 'Uint32Array', 'Int32Array', 'Uint16Array', 'Float64Array', 'ArrayBuffer', 'Array']) {
      this.global[k] = globalThis[k];
    }
  }
};
