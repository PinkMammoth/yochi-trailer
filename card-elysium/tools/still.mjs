// Render frames to PNG for review (and the companion still).
// usage: node tools/still.mjs <outDir> <t1> [t2 ...] [--w 1080] [--h 1350]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let W = 1080, H = 1350, outDir = null;
const times = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--w') W = +args[++i];
  else if (args[i] === '--h') H = +args[++i];
  else if (!outDir) outDir = args[i];
  else times.push(+args[i]);
}
fs.mkdirSync(outDir, { recursive: true });
const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?w=${W}&h=${H}`);
await page.evaluate(() => window.ready);
for (const t of times) {
  await page.evaluate((t) => window.renderFrame(t), t);
  const f = path.join(outDir, `t${t.toFixed(3).padStart(6, '0')}.png`);
  await page.locator('#out').screenshot({ path: f });
  console.log(f);
}
await browser.close();
server.close();
