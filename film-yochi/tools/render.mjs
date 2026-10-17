// Parallel deterministic render -> MP4 with sound. Every frame is a pure function of time, so the
// frame range is split across workers (each its own headless Chromium) and stitched losslessly.
// usage: node tools/render.mjs [--from 0] [--to 34] [--fps 30] [--w 1920] [--h 1080] [--workers 4]
//                              [--out out/yochi.mp4] [--crf 17] [--audio auto|score|click|mix|none]
//   --audio auto: asset-pack/audio/yochi.wav if it exists, else the placeholder score
//   --audio mix:  the placeholder score with the click track over it (for judging the cut)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer, BROWSER_ARGS } from './server.mjs';
import { DURATION } from '../src/core/music.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = { from: 0, to: DURATION, fps: 30, w: 1920, h: 1080, workers: 4, out: 'out/yochi.mp4', crf: 17, audio: 'auto', keep: 0 };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) {
  const k = av[i].replace(/^--/, ''); const v = av[i + 1];
  A[k] = isNaN(+v) ? v : +v;
}
const outPath = path.resolve(root, A.out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const tmp = fs.mkdtempSync(path.join(path.dirname(outPath), '.seg-'));
const f0 = Math.round(A.from * A.fps), f1 = Math.round(A.to * A.fps);
const total = f1 - f0;
const per = Math.ceil(total / A.workers);
const chunks = [];
for (let k = 0; k < A.workers; k++) {
  const a = f0 + k * per, b = Math.min(f1, a + per);
  if (b > a) chunks.push([a, b]);
}
const run = (args) => new Promise((res, rej) => { const p = spawn('ffmpeg', args, { stdio: 'inherit' }); p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))); });

function ffmpegSeg(file) {
  return spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${A.w}x${A.h}`, '-r', String(A.fps), '-i', '-',
    '-vf', 'vflip', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '6', '-pix_fmt', 'yuv444p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
}
const encs = chunks.map((_, k) => ffmpegSeg(path.join(tmp, `seg${String(k).padStart(2, '0')}.mkv`)));
const write = (k, buf) => new Promise((res, rej) => {
  const ok = encs[k].stdin.write(buf, (e) => (e ? rej(e) : null));
  if (ok) res(); else encs[k].stdin.once('drain', res);
});
const { server, port } = await startServer(root, async (q, body) => { await write(+q.get('w'), body); });
const t0 = Date.now();
let done = 0;
await Promise.all(chunks.map(async ([a, b], k) => {
  const browser = await chromium.launch({ args: BROWSER_ARGS });
  const page = await browser.newPage({ viewport: { width: A.w, height: A.h } });
  page.on('pageerror', (e) => console.log(`[w${k} pageerror]`, e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log(`[w${k}]`, m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html?w=${A.w}&h=${A.h}`);
  await page.evaluate(() => window.ready);
  for (let f = a; f < b; f++) {
    await page.evaluate(async ([t, url]) => { window.renderFrame(t); await window.sendFrame(url); }, [f / A.fps, `/frame?w=${k}&f=${f}`]);
    done++;
    if (done % 30 === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r${done}/${total} frames  ${(done / el).toFixed(2)} fps  eta ${((total - done) / (done / el)).toFixed(0)}s   `);
    }
  }
  encs[k].stdin.end();
  await browser.close();
}));
await Promise.all(encs.map((p) => new Promise((r) => (p.exitCode !== null ? r() : p.on('close', r)))));
server.close();
console.log(`\nrendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, chunks.map((_, k) => `file 'seg${String(k).padStart(2, '0')}.mkv'`).join('\n'));

// sound
const track = path.resolve(root, '../asset-pack/audio/yochi.wav');
const score = path.join(root, 'audio/placeholder.wav'), click = path.join(root, 'audio/click.wav');
let audio = null;
if (A.audio === 'auto') audio = fs.existsSync(track) ? track : score;
else if (A.audio === 'score') audio = score;
else if (A.audio === 'click') audio = click;
else if (A.audio === 'mix') {
  audio = path.join(tmp, 'mix.wav');
  await run(['-hide_banner', '-loglevel', 'error', '-y', '-i', score, '-i', click, '-filter_complex', '[0:a][1:a]amix=inputs=2:weights=1 0.6:normalize=0[o]', '-map', '[o]', audio]);
}
if (audio) console.log('audio:', path.relative(root, audio));
const ff = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list];
if (audio) ff.push('-ss', String(A.from), '-t', String(A.to - A.from), '-i', audio);
ff.push('-map', '0:v');
if (audio) ff.push('-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000');
ff.push('-c:v', 'libx264', '-preset', 'slow', '-crf', String(A.crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-r', String(A.fps), outPath);
await run(ff);
if (A.keep) {
  const master = outPath.replace(/\.mp4$/, '') + '_master.mkv';
  await run(['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', master]);
  console.log('kept master', master);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', outPath);
