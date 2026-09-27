import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
await page.goto(`http://127.0.0.1:${port}/index.html?w=400&h=400`);
await page.evaluate(() => window.ready);
const res = await page.evaluate(async () => {
  const { drawHelmet, shellPath } = await import('./src/elements/helmet.js');
  const c = document.createElement('canvas'); c.width = 400; c.height = 400;
  const b = c.getContext('2d'); const g = document.createElement('canvas').getContext('2d');
  const R = { b, g };
  b.fillStyle = '#000'; b.fillRect(0, 0, 400, 400);
  const probe = () => Array.from(b.getImageData(125, 95, 1, 1).data).slice(0, 3).join(',');
  const out = [];
  // step 1: plain shell fill
  b.save(); b.translate(200, 200); b.scale(150, 150); b.fillStyle = 'rgb(243,241,249)'; shellPath(b); b.fill(); b.restore();
  out.push('plain ' + probe());
  b.fillStyle = '#000'; b.fillRect(0, 0, 400, 400);
  const base = { x: 200, y: 200, s: 150, type: 'dome', shell: [226, 224, 240], accent: '#18e0ff', face: { eyes: 'up' }, led: '#39ff14',
    key: { x: -0.7, y: -0.45, col: [170, 210, 255], k: 0.6 }, rim: { x: 0.9, y: -0.3, col: [24, 224, 255], k: 1.2 } };
  const pts = [[125,95],[110,130],[170,70],[250,80]];
  const P = () => pts.map(([x,y]) => Array.from(b.getImageData(x, y, 1, 1).data).slice(0, 3).join(',')).join(' | ');
  for (const extra of [{}, { body: 'bust' }, { stripes: 'y' }, { status: '#39ff14' }, { yaw: -0.22, pitch: 0.05 }]) {
    b.fillStyle = '#000'; b.fillRect(0, 0, 400, 400);
    drawHelmet(R, { ...base, ...extra });
    out.push(JSON.stringify(extra) + ' ' + P());
  }
  return out;
});
console.log(res);
await browser.close(); server.close();
