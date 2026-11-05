// Deterministic parallel render of one loop -> silent H.264 MP4.
// usage: node tools/render.mjs [--out deliverables/yochi-elysium-card-16x9.mp4] [--fps 30] [--workers 4] [--crf 14]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';
import { LOOP } from '../src/loop.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = { fps: 30, w: 1920, h: 1080, workers: 4, crf: 14, out: 'deliverables/yochi-elysium-card-16x9.mp4' };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) { const v = av[i + 1]; A[av[i].replace(/^--/, '')] = isNaN(+v) ? v : +v; }
const outPath = path.resolve(root, A.out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const total = Math.round(LOOP * A.fps);
const frames = new Array(total);
const { server, port } = await startServer(root, async (q, body) => { frames[+q.get('f')] = body; });
const t0 = Date.now();
const per = Math.ceil(total / A.workers);
await Promise.all(Array.from({ length: A.workers }, async (_, k) => {
  const a = k * per, z = Math.min(total, a + per);
  if (z <= a) return;
  const browser = await chromium.launch({ args: BROWSER_ARGS });
  const page = await browser.newPage({ viewport: { width: A.w, height: A.h } });
  page.on('pageerror', (e) => console.log(`[w${k}]`, e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?w=${A.w}&h=${A.h}`);
  await page.evaluate(() => window.ready);
  for (let f = a; f < z; f++) await page.evaluate(async ([t, url]) => { window.renderFrame(t); await window.sendFrame(url); }, [f / A.fps, `/frame?f=${f}`]);
  await browser.close();
}));
server.close();
console.log(`rendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
// frames arrive bottom-up from WebGL: vflip. yuv420p + high profile + faststart for X.
const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${A.w}x${A.h}`, '-r', String(A.fps), '-i', '-',
  '-vf', 'vflip', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(A.crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-g', String(total), '-movflags', '+faststart', '-r', String(A.fps), outPath], { stdio: ['pipe', 'inherit', 'inherit'] });
for (const fr of frames) if (!ff.stdin.write(fr)) await new Promise((r) => ff.stdin.once('drain', r));
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
console.log('wrote', outPath);
