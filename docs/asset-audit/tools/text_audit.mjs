// Typography audit for any code-rendered Yochi film that uses the shorts / flagship engine.
// Wraps CanvasRenderingContext2D.fillText/strokeText in the page, renders every frame, and records each string's
// on-screen box (canvas transform applied). Reports strings that leave the frame or the title-safe area, and key
// text whose cap height is under the brand's ~48 px minimum (SHARED-RULES, "Craft").
//
// usage (from the engine dir, e.g. shorts/):
//   node ../docs/asset-audit/tools/text_audit.mjs --film usdc [--fps 30] [--safe 0.05] [--json out.json]
// Read-only: it renders in memory and writes nothing except the optional JSON report.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const film = args.film || 'usdc', fps = +(args.fps || 30), SAFE = +(args.safe || 0.05);
const root = process.cwd();
const { startServer, BROWSER_ARGS } = await import(pathToFileURL(path.join(root, 'tools/server.mjs')).href);
const { chromium } = createRequire(path.join(root, 'package.json'))('playwright');

const { server, port } = await startServer(root, async () => {});
const browser = await chromium.launch({ args: BROWSER_ARGS });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.addInitScript(() => {
  window.__TXT = [];
  const P = CanvasRenderingContext2D.prototype;
  for (const fn of ['fillText', 'strokeText']) {
    const orig = P[fn];
    P[fn] = function (s, x, y, mw) {
      const cv = this.canvas;
      if (cv.width === 1920 && cv.height === 1080 && this.globalAlpha > 0.05 && String(s).trim()) {
        const m = this.measureText(s), T = this.getTransform();
        const xs = [x - m.actualBoundingBoxLeft, x + m.actualBoundingBoxRight];
        const ys = [y - m.actualBoundingBoxAscent, y + m.actualBoundingBoxDescent];
        const pts = xs.flatMap((px) => ys.map((py) => [T.a * px + T.c * py + T.e, T.b * px + T.d * py + T.f]));
        const sc = Math.hypot(T.a, T.b);
        const H = this.measureText('H');
        window.__TXT.push({ s: String(s), font: this.font, a: this.globalAlpha,
          x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
          y0: Math.min(...pts.map((p) => p[1])), y1: Math.max(...pts.map((p) => p[1])),
          cap: H.actualBoundingBoxAscent * sc });
      }
      return orig.call(this, s, x, y, ...(mw === undefined ? [] : [mw]));
    };
  }
});
await page.goto(`http://127.0.0.1:${port}/index.html?film=${film}`);
await page.waitForFunction(() => window.ready); await page.evaluate(() => window.ready);
const dur = await page.evaluate(() => window.META.dur);
const rec = new Map();
for (let f = 0; f < Math.round(dur * fps); f++) {
  const t = f / fps;
  const hits = await page.evaluate((t) => { window.__TXT = []; window.renderFrame(t); return window.__TXT; }, t);
  for (const h of hits) {
    const k = h.s + ' | ' + h.font.replace(/"/g, '');
    const r = rec.get(k) || { s: h.s, font: h.font.replace(/"/g, ''), t0: t, t1: t, x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, capMin: 1e9, capMax: 0, out: [], unsafe: [] };
    r.t1 = t; r.x0 = Math.min(r.x0, h.x0); r.x1 = Math.max(r.x1, h.x1); r.y0 = Math.min(r.y0, h.y0); r.y1 = Math.max(r.y1, h.y1);
    if (h.a > 0.6) { r.capMin = Math.min(r.capMin, h.cap); r.capMax = Math.max(r.capMax, h.cap); }
    const out = h.x0 < 0 || h.x1 > 1920 || h.y0 < 0 || h.y1 > 1080;
    const mx = 1920 * SAFE, my = 1080 * SAFE;
    const unsafe = h.x0 < mx || h.x1 > 1920 - mx || h.y0 < my || h.y1 > 1080 - my;
    if (out && h.a > 0.3) r.out.push(t);
    else if (unsafe && h.a > 0.3) r.unsafe.push(t);
    rec.set(k, r);
  }
}
await browser.close(); server.close();
const rows = [...rec.values()].sort((a, b) => a.t0 - b.t0);
const rng = (ts) => (ts.length ? `${ts[0].toFixed(2)}–${ts[ts.length - 1].toFixed(2)}s (${ts.length}f)` : '');
console.log(`text audit: film=${film}, ${rows.length} distinct strings, title-safe margin ${SAFE * 100}% (${1920 * SAFE}x${1080 * SAFE}px)\n`);
console.log('t0–t1 | string | font | box (min x0,y0 – max x1,y1) | cap px | OUT OF FRAME | OUTSIDE TITLE-SAFE');
for (const r of rows) {
  console.log([`${r.t0.toFixed(2)}–${r.t1.toFixed(2)}`, JSON.stringify(r.s), r.font, `${r.x0 | 0},${r.y0 | 0} – ${r.x1 | 0},${r.y1 | 0}`,
    r.capMax ? `${r.capMin | 0}–${r.capMax | 0}` : '-', rng(r.out), rng(r.unsafe)].join(' | '));
}
if (args.json) fs.writeFileSync(args.json, JSON.stringify(rows, null, 1));
