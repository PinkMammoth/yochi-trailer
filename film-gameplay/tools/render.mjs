// Deterministic parallel render. Each worker renders a contiguous range of frames in its own Chromium and streams
// them into its own lossless RGB segment (libx264rgb, qp 0); the segments are then joined losslessly.
// usage: node tools/render.mjs --v A [--workers 4] [--from 0] [--to 24.6] [--out out/A_lossless.mkv]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';
import { DURATION, FPS } from '../src/edl.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = { v: 'A', fps: FPS, w: 1920, h: 1080, workers: 4, from: 0, to: DURATION };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) { const x = av[i + 1]; A[av[i].replace(/^--/, '')] = isNaN(+x) ? x : +x; }
A.out = path.resolve(root, A.out || `out/${A.v}_lossless.mkv`);
fs.mkdirSync(path.dirname(A.out), { recursive: true });
const f0 = Math.round(A.from * A.fps), f1 = Math.round(A.to * A.fps), total = f1 - f0;
const per = Math.ceil(total / A.workers);
const enc = [], segs = [];
for (let k = 0; k < A.workers; k++) {
  const seg = A.out.replace(/\.mkv$/, `.seg${k}.mkv`); segs.push(seg);
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${A.w}x${A.h}`, '-r', String(A.fps), '-i', '-',
    '-vf', 'vflip,format=rgb24', '-c:v', 'libx264rgb', '-qp', '0', '-preset', 'ultrafast', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  enc.push({ p, done: new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c))))) });
}
const { server, port } = await startServer(path.resolve(root, '..'), async (q, body) => {
  const s = enc[+q.get('k')].p.stdin;
  if (!s.write(body)) await new Promise((r) => s.once('drain', r));
});
const t0 = Date.now();
let doneN = 0;
await Promise.all(enc.map(async (e, k) => {
  const a = f0 + k * per, z = Math.min(f1, a + per);
  if (z > a) {
    const browser = await chromium.launch({ args: BROWSER_ARGS });
    const page = await browser.newPage({ viewport: { width: A.w, height: A.h } });
    page.on('pageerror', (er) => console.log(`[w${k}]`, er.message));
    await page.goto(`http://127.0.0.1:${port}/film-gameplay/index.html?v=${A.v}&w=${A.w}&h=${A.h}`);
    await page.evaluate(() => window.ready);
    for (let f = a; f < z; f++) {
      await page.evaluate(async ([t, url]) => { await window.renderFrame(t); await window.sendFrame(url); }, [f / A.fps, `/frame?k=${k}&f=${f}`]);
      if (++doneN % 60 === 0) console.log(`${doneN}/${total} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await browser.close();
  }
  e.p.stdin.end();
  await e.done;
}));
server.close();
const list = A.out.replace(/\.mkv$/, '.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', A.out], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
for (const s of segs) fs.unlinkSync(s); fs.unlinkSync(list);
console.log(`rendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${A.out}`);
