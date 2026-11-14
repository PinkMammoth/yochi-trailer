// Deterministic parallel render -> H.264 MP4 (+ AAC if --audio is given).
// Workers take interleaved frames (f % workers); frames are streamed to ffmpeg in order through a small reorder buffer.
// usage: node tools/render.mjs --film usdc --out <file.mp4> [--audio <wav>] [--w 1920 --h 1080] [--fps 30] [--workers 4] [--crf 16] [--from 0 --to dur] [--q k=v,...]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = { film: 'usdc', fps: 30, w: 0, h: 0, workers: 4, crf: 16, out: null, audio: null, from: 0, to: null, q: '', preset: 'slow' };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) { const v = av[i + 1]; A[av[i].replace(/^--/, '')] = v === '' || isNaN(+v) ? v : +v; }
const outPath = path.resolve(process.cwd(), A.out || `out/${A.film}.mp4`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const frames = new Map();
let next = 0, ff = null, flushing = Promise.resolve();
const flush = () => (flushing = flushing.then(async () => {
  while (frames.has(next)) {
    const fr = frames.get(next); frames.delete(next); next++;
    if (!ff.stdin.write(fr)) await new Promise((r) => ff.stdin.once('drain', r));
  }
}));
const { server, port } = await startServer(root, async (q, body) => { frames.set(+q.get('f'), body); flush(); });
const url = `http://127.0.0.1:${port}/index.html?film=${A.film}${A.w ? `&w=${A.w}&h=${A.h}` : ''}${A.q ? '&' + A.q.split(',').join('&') : ''}`;

const probe = await chromium.launch({ args: BROWSER_ARGS });
const pp = await probe.newPage();
await pp.goto(url); await pp.waitForFunction(() => window.ready); await pp.evaluate(() => window.ready);
const meta = await pp.evaluate(() => ({ dur: window.META.dur, W: document.getElementById('out').width, H: document.getElementById('out').height }));
await probe.close();
const { W, H } = meta;
const from = A.from, to = A.to ?? meta.dur;
const f0 = Math.round(from * A.fps), total = Math.round(to * A.fps) - f0;

const args = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(A.fps), '-i', '-'];
if (A.audio) args.push('-ss', String(from), '-t', String(to - from), '-i', path.resolve(process.cwd(), A.audio));
args.push('-vf', 'vflip', '-c:v', 'libx264', '-preset', A.preset, '-crf', String(A.crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1', '-g', String(A.fps * 2), '-r', String(A.fps));
if (A.audio) args.push('-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest');
else args.push('-an');
args.push('-movflags', '+faststart', outPath);
ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
await Promise.all(Array.from({ length: A.workers }, async (_, k) => {
  const browser = await chromium.launch({ args: BROWSER_ARGS });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.log(`[w${k}]`, e.message));
  await page.goto(url); await page.waitForFunction(() => window.ready); await page.evaluate(() => window.ready);
  for (let f = k; f < total; f += A.workers) {
    while (f - next > A.workers * 6) await new Promise((r) => setTimeout(r, 20));
    await page.evaluate(async ([t, u]) => { window.renderFrame(t); await window.sendFrame(u); }, [(f0 + f) / A.fps, `/frame?f=${f}`]);
    if (f % 30 === 0) process.stdout.write(`\r${f}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();
}));
await flushing;
while (next < total) { await new Promise((r) => setTimeout(r, 50)); await flushing; }
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
server.close();
console.log(`\nwrote ${outPath} (${total} frames, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
