import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.evaluate(() => window.ready);
for (const t of [2.6, 70]) {
  const out = await page.evaluate(async (t) => {
    const F = await import('./src/film.js');
    const { POST_DEFAULTS } = await import('./src/core/post.js');
    const mk = () => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; return c; };
    const bc = mk(), gc = mk();
    const R = { b: bc.getContext('2d', { alpha: false }), g: gc.getContext('2d', { alpha: false }), S: 1, W: 1920, H: 1080 };
    const flush = () => { R.b.getImageData(0, 0, 1, 1); R.g.getImageData(0, 0, 1, 1); };
    flush();
    let a = performance.now();
    const P = structuredClone(POST_DEFAULTS);
    F.renderFilm(t, R, P); flush();
    const draw = performance.now() - a;
    return `t=${t} draw(raster) ${draw.toFixed(0)}ms`;
  }, t);
  console.log(out);
}
await browser.close(); server.close();
