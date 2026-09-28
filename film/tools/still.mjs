// Render individual frames to PNG for review.
// usage: node tools/still.mjs <outDir> <t1> [t2 ...] [--w 1920] [--h 1080]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let W = 1920, H = 1080, CUT = 'full';
const times = [];
let outDir = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--w') W = +args[++i];
  else if (args[i] === '--h') H = +args[++i];
  else if (args[i] === '--cut') CUT = args[++i];
  else if (!outDir) outDir = args[i];
  else times.push(+args[i]);
}
fs.mkdirSync(outDir, { recursive: true });
const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?w=${W}&h=${H}&cut=${CUT}`);
await page.evaluate(() => window.ready);
for (const t of times) {
  const s = Date.now();
  await page.evaluate((t) => window.renderFrame(t), t);
  const ms = Date.now() - s;
  const f = path.join(outDir, `t${t.toFixed(3).padStart(7, '0')}.png`);
  await page.locator('#out').screenshot({ path: f });
  console.log(`${f}  (${ms} ms)`);
}
await browser.close();
server.close();
