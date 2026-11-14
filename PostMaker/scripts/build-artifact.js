/* eslint-env node */
/**
 * Builds the self-contained web page that can be opened straight from the chat (claude.ai artifact).
 *   node scripts/build-artifact.js <expo web export dir> <out dir>
 * The JS bundle is inlined into the page; CanvasKit (wasm) and the four fonts the app uses are
 * published next to it and resolved relative to the page.
 */
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error('usage: build-artifact.js <export dir> <out dir>');
const jsDir = path.join(src, '_expo/static/js/web');
const bundleName = fs.readdirSync(jsDir).find((f) => f.startsWith('index-') && f.endsWith('.js'));
let js = fs.readFileSync(path.join(jsDir, bundleName), 'utf8');

const before = (js.match(/"\/assets\//g) || []).length;
js = js.replace(/"\/assets\//g, 'window.__PM_BASE__+"assets/').replace(/<\/script/gi, '<\\/script');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const KEEP = [/assets\/assets\/fonts\/Montserrat_\d+\w+\.[0-9a-f]+\.ttf$/, /Fonts\/Ionicons\.[0-9a-f]+\.ttf$/];
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else {
      const rel = path.relative(src, p).split(path.sep).join('/');
      if (KEEP.some((re) => re.test(rel))) files.push(rel);
    }
  }
})(path.join(src, 'assets'));
for (const rel of files) {
  fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true });
  fs.copyFileSync(path.join(src, rel), path.join(out, rel));
}
fs.copyFileSync(require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm'), path.join(out, 'canvaskit.wasm'));

const page = `<title>Post Maker</title>
<meta name="theme-color" content="#070F28">
<style>
  :root { --navy: #070F28; color-scheme: dark; background: var(--navy); box-sizing: border-box; height: 100%; }
  body { background: var(--navy); color: #fff; height: 100%; overflow: hidden; margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
    -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
  #root { display: flex; height: 100%; flex: 1; }
  #pm-boot { position: fixed; inset: 0; display: grid; place-items: center; color: rgba(255,255,255,.7); font-size: 15px; }
</style>
<div id="pm-boot">Načítám Post Maker…</div>
<div id="root"></div>
<script>
  window.__PM_BASE__ = new URL('.', location.href).href;
  new MutationObserver(function (m, o) {
    if (document.getElementById('root').childElementCount) { var b = document.getElementById('pm-boot'); if (b) b.remove(); o.disconnect(); }
  }).observe(document.getElementById('root'), { childList: true });
</script>
<script>
${js}
</script>
`;
fs.writeFileSync(path.join(out, 'index.html'), page);
console.log(JSON.stringify({ bundle: bundleName, assetRefsRewritten: before, files: [...files, 'canvaskit.wasm'], pageMB: (Buffer.byteLength(page) / 1e6).toFixed(2) }, null, 1));
