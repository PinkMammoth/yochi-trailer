// Sound design accents, synthesised (deterministic) and mixed low under the track by tools/audio.mjs:
//   swish  a dry brush dragged across washi: band-passed noise with a fast attack and a falling centre, under each tear stroke
//   stamp  a hanko landing: a short felt thump (a falling low sine) plus a paper slap (a few ms of bright noise), at each
//          stamp contact (CALLED IT in the duel and the Battle Royale, the final seal)
// These are stand-ins: a recorded brush-on-washi pass and a real wood/rubber stamp would sit better (see README).
// usage: node tools/sfx.mjs <out.wav>
import fs from 'node:fs';
import { M, DURATION } from '../src/core/music.js';

const SR = 48000, N = Math.ceil(DURATION * SR);
const L = new Float32Array(N), Rt = new Float32Array(N);
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };

// a two-pole band-pass (RBJ), centre moving with time
function swish(t0, dur, gain, f0, f1, pan) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const n = Math.floor(dur * SR), i0 = Math.floor(t0 * SR);
  for (let i = 0; i < n && i0 + i < N; i++) {
    const u = i / n;
    const f = f0 * Math.pow(f1 / f0, u), Q = 0.9;
    const w = 2 * Math.PI * f / SR, al = Math.sin(w) / (2 * Q);
    const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * Math.cos(w), a2 = 1 - al;
    const x = rnd() * (0.6 + 0.4 * Math.abs(rnd())); // grainy: paper fibre under the bristles
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    const env = Math.min(1, u / 0.06) * Math.pow(1 - u, 1.6);
    const v = y * env * gain;
    L[i0 + i] += v * (1 - pan); Rt[i0 + i] += v * (1 + pan);
  }
}
function stamp(t0, gain) {
  const i0 = Math.floor(t0 * SR);
  for (let i = 0; i < 0.35 * SR && i0 + i < N; i++) {
    const t = i / SR;
    const f = 48 + 60 * Math.exp(-t / 0.03);
    const thump = Math.sin(2 * Math.PI * (48 * t + 60 * 0.03 * (1 - Math.exp(-t / 0.03)))) * Math.exp(-t / 0.09);
    const slap = t < 0.012 ? rnd() * (1 - t / 0.012) * 0.6 : 0;
    const v = (thump * 0.9 + slap) * gain;
    L[i0 + i] += v; Rt[i0 + i] += v;
  }
}

M.TEAR.forEach((t, i) => swish(t - 0.01, 0.34, 0.6, 2600, 700, [-0.5, 0.5, -0.2][i]));
for (const t of [M.STAMP, M.BR_WIN, M.END]) stamp(t - 0.004, t === M.END ? 0.42 : 0.36);
// HOOK: a felt thump under each word of the question, softer than the stamps, rising a little to DOWN?
M.HOOK_WORDS.forEach((t, i) => stamp(t + 0.002, [0.2, 0.16, 0.26][i]));

// 24-bit WAV
const out = Buffer.alloc(44 + N * 6);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 6, 4); out.write('WAVE', 8); out.write('fmt ', 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 6, 28); out.writeUInt16LE(6, 32); out.writeUInt16LE(24, 34); out.write('data', 36); out.writeUInt32LE(N * 6, 40);
for (let i = 0; i < N; i++) for (const [k, ch] of [[0, L], [1, Rt]]) {
  const v = Math.max(-1, Math.min(1, ch[i])) * 8388607 | 0;
  out.writeIntLE(v, 44 + i * 6 + k * 3, 3);
}
fs.writeFileSync(process.argv[2], out);
console.log('wrote', process.argv[2]);
