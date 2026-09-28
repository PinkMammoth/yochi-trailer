// Render character design sheets to PNG.
// usage: node tools/design.mjs <outDir> <sheet[:arg]> [sheet ...] [--w 1920] [--h 1080] [--jpg] [--name sheet=file ...]
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let W = 1920, H = 1080, outDir = null, jpg = false;
const sheets = [], names = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--w') W = +args[++i];
  else if (args[i] === '--h') H = +args[++i];
  else if (args[i] === '--jpg') jpg = true;
  else if (args[i] === '--name') { const [k, v] = args[++i].split('='); names[k] = v; }
  else if (!outDir) outDir = args[i];
  else sheets.push(args[i]);
}
fs.mkdirSync(outDir, { recursive: true });
const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning' || m.text().startsWith('[design]')) console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/design/index.html?w=${W}&h=${H}`);
await page.evaluate(() => window.ready);
for (const spec of sheets) {
  const [name, arg] = spec.split(':');
  try {
    const info = await page.evaluate(([n, a]) => window.renderSheet(n, a), [name, arg]);
    const base = names[spec] || `${name}${arg ? '-' + arg : ''}`;
    const f = path.join(outDir, `${base}.${jpg ? 'jpg' : 'png'}`);
    await page.locator('#out').screenshot({ path: f, timeout: 0, ...(jpg ? { type: 'jpeg', quality: 92 } : {}) });
    console.log(`${f}  (${info.ms.toFixed(0)} ms)${info.stats ? '  ' + JSON.stringify(info.stats) : ''}`);
  } catch (e) {
    console.log(`[error] ${spec}: ${e.message}`);
  }
}
await browser.close();
server.close();
