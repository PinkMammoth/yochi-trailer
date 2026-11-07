// PNG stills of the film at given times. usage: node tools/still.mjs <outdir> <A|B> t1 t2 ... [--w 960 --h 540]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const av = process.argv.slice(2);
const opt = { w: 1920, h: 1080 };
const pos = [];
for (let i = 0; i < av.length; i++) { if (av[i].startsWith('--')) opt[av[i].slice(2)] = +av[++i]; else pos.push(av[i]); }
const [dir, v, ...times] = pos;
fs.mkdirSync(dir, { recursive: true });
const { server, port } = await startServer(path.resolve(root, '..'), async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: opt.w, height: opt.h } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
await page.goto(`http://127.0.0.1:${port}/film-gameplay/index.html?v=${v}&w=${opt.w}&h=${opt.h}`);
await page.evaluate(() => window.ready);
for (const t of times) {
  await page.evaluate((t) => window.renderFrame(t), +t);
  const f = path.join(dir, `${v}-${(+t).toFixed(2).padStart(5, '0')}.png`);
  await page.locator('#out').screenshot({ path: f });
  console.log(f);
}
await browser.close(); server.close();
