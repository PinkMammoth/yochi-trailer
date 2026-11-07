// Sound design, synthesised and deterministic (the flagship's tools/sfx.mjs, same voices), mixed low under the
// track by tools/audio.mjs:
//   stamp  a hanko landing (a felt thump plus a few ms of paper slap) at each stamp contact on screen
//   swish  a dry-brush swish under each vermilion slash wipe
// usage: node tools/sfx.mjs <A|B> <out.wav>
import fs from 'node:fs';
import { DURATION, bar } from '../src/core/music.js';
import { EDITS } from '../src/edl.js';

const [v, outPath] = process.argv.slice(2);
const SR = 48000, N = Math.ceil(DURATION * SR);
const L = new Float32Array(N), Rt = new Float32Array(N);
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
function swish(t0, dur, gain, f0, f1, pan) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const n = Math.floor(dur * SR), i0 = Math.floor(t0 * SR);
  for (let i = 0; i < n && i0 + i < N; i++) {
    const u = i / n, f = f0 * Math.pow(f1 / f0, u), Q = 0.9;
    const w = 2 * Math.PI * f / SR, al = Math.sin(w) / (2 * Q);
    const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * Math.cos(w), a2 = 1 - al;
    const x = rnd() * (0.6 + 0.4 * Math.abs(rnd()));
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    const env = Math.min(1, u / 0.06) * Math.pow(1 - u, 1.6), val = y * env * gain;
    L[i0 + i] += val * (1 - pan); Rt[i0 + i] += val * (1 + pan);
  }
}
function stamp(t0, gain) {
  const i0 = Math.floor(t0 * SR);
  for (let i = 0; i < 0.35 * SR && i0 + i < N; i++) {
    const t = i / SR;
    const thump = Math.sin(2 * Math.PI * (48 * t + 60 * 0.03 * (1 - Math.exp(-t / 0.03)))) * Math.exp(-t / 0.09);
    const slap = t < 0.012 ? rnd() * (1 - t / 0.012) * 0.6 : 0;
    const val = (thump * 0.9 + slap) * gain;
    L[i0 + i] += val; Rt[i0 + i] += val;
  }
}
const E = EDITS[v];
E.stamps.forEach((t, i) => stamp(t - 0.004, i === E.stamps.length - 1 ? 0.42 : 0.34));
[bar(4), bar(9)].forEach((t, i) => swish(t - 0.12, 0.3, 0.5, 2600, 700, i ? 0.4 : -0.4));
const out = Buffer.alloc(44 + N * 6);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 6, 4); out.write('WAVE', 8); out.write('fmt ', 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 6, 28); out.writeUInt16LE(6, 32); out.writeUInt16LE(24, 34); out.write('data', 36); out.writeUInt32LE(N * 6, 40);
for (let i = 0; i < N; i++) for (const [k, ch] of [[0, L], [1, Rt]]) out.writeIntLE(Math.max(-1, Math.min(1, ch[i])) * 8388607 | 0, 44 + i * 6 + k * 3, 3);
fs.writeFileSync(outPath, out);
console.log('wrote', outPath);
