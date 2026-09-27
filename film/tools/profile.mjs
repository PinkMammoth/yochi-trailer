// usage: node tools/profile.mjs [--w 1920 --h 1080] t1 t2 ...
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); let W = 1920, H = 1080; const times = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--w') W = +args[++i]; else if (args[i] === '--h') H = +args[++i]; else times.push(+args[i]); }
const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?w=${W}&h=${H}`);
await page.evaluate(() => window.ready);
for (const t of times) {
  const r = await page.evaluate((t) => {
    const a = performance.now(); window.renderFrame(t); const b = performance.now(); window.readFrame(); const c = performance.now();
    return [b - a, c - b];
  }, t);
  const r2 = await page.evaluate((t) => { const a = performance.now(); window.renderFrame(t); window.readFrame(); return performance.now() - a; }, t);
  console.log(`t=${t}  render ${r[0].toFixed(0)}ms  read ${r[1].toFixed(0)}ms  (2nd total ${r2.toFixed(0)}ms)`);
}
await browser.close(); server.close();
