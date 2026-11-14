// PNG stills for review.
// usage: node tools/still.mjs <film> <outDir> <t1> [t2 ...] [--w 1920] [--h 1080] [--q k=v,...]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let W = 0, H = 0, Q = '', film = null, outDir = null;
const times = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--w') W = +args[++i];
  else if (args[i] === '--h') H = +args[++i];
  else if (args[i] === '--q') Q = '&' + args[++i].split(',').join('&');
  else if (!film) film = args[i];
  else if (!outDir) outDir = args[i];
  else times.push(+args[i]);
}
fs.mkdirSync(outDir, { recursive: true });
const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: W || 1920, height: H || 1080 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?film=${film}${W ? `&w=${W}&h=${H}` : ''}${Q}`);
await page.waitForFunction(() => window.ready); await page.evaluate(() => window.ready);
for (const t of times) {
  await page.evaluate((t) => window.renderFrame(t), t);
  const f = path.join(outDir, `t${t.toFixed(3).padStart(7, '0')}.png`);
  await page.locator('#out').screenshot({ path: f });
  console.log(f);
}
await browser.close();
server.close();
