// Placeholder score and click track, synthesised from src/core/music.js (the same timing map the
// picture uses), so the cut can be judged before asset-pack/audio/yochi.wav exists.
//   node tools/score.mjs            -> audio/placeholder.wav (score) and audio/click.wav (click track)
// Sound palette: deep, dry low drums (a felt beater on a big skin, no gong), small wooden knocks, a
// brush swish under every fast stroke, a breath of air under the ghost, one held low chord, and true
// silence in the silences.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { M, HITS, SILENCES, SWISHES, BEAT, T0, DURATION } from '../src/core/music.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SR = 48000;
const N = Math.ceil(DURATION * SR);
const L = new Float32Array(N), Rr = new Float32Array(N);
const send = new Float32Array(N); // reverb send (mono)

let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const at = (t) => Math.round(t * SR);
function add(i, v, pan = 0, rev = 0.2) {
  if (i < 0 || i >= N) return;
  L[i] += v * (1 - Math.max(0, pan)); Rr[i] += v * (1 + Math.min(0, pan)); send[i] += v * rev;
}
// one-pole filters
const lp = (a) => { let y = 0; return (x) => (y += a * (x - y)); };
// biquad band-pass
function bp(f, q) {
  const w = 2 * Math.PI * f / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
  const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}

// a big low drum: pitch-dropping skin, felt attack, sub
function drum(t, amp, f0 = 92, f1 = 46, dec = 0.9) {
  const i0 = at(t); const n = Math.floor(SR * (dec * 2.2));
  let ph = 0; const nl = lp(0.08);
  for (let k = 0; k < n; k++) {
    const s = k / SR;
    const f = f1 + (f0 - f1) * Math.exp(-s / 0.07);
    ph += 2 * Math.PI * f / SR;
    const body = Math.sin(ph) * Math.exp(-s / dec);
    const sub = Math.sin(ph * 0.5) * Math.exp(-s / (dec * 1.3)) * 0.5;
    const felt = nl(rnd() * 2 - 1) * Math.exp(-s / 0.018) * 2.2;
    const att = Math.min(1, s / 0.0015);
    add(i0 + k, amp * att * (body * 0.9 + sub + felt), 0, 0.25);
  }
}
// a small wooden knock
function knock(t, amp, f = 420, pan = 0) {
  const i0 = at(t); const n = Math.floor(SR * 0.25);
  let p1 = 0, p2 = 0;
  for (let k = 0; k < n; k++) {
    const s = k / SR;
    p1 += 2 * Math.PI * f / SR; p2 += 2 * Math.PI * f * 2.71 / SR;
    const v = (Math.sin(p1) * Math.exp(-s / 0.05) + 0.4 * Math.sin(p2) * Math.exp(-s / 0.015)) + (rnd() - 0.5) * Math.exp(-s / 0.003);
    add(i0 + k, amp * v, pan, 0.35);
  }
}
// a brush dragged across paper: band-passed noise shaped over the stroke
function swish(t0, t1, amp) {
  const pre = 0.03, post = 0.12;
  const i0 = at(t0 - pre), n = at(t1 + post) - i0;
  const f1 = bp(1800, 0.7), f2 = bp(5200, 1.2);
  for (let k = 0; k < n; k++) {
    const t = t0 - pre + k / SR;
    const u = (t - t0) / Math.max(0.01, t1 - t0);
    const e = t < t0 ? Math.max(0, 1 - (t0 - t) / pre) * 0.4 : t > t1 ? Math.exp(-(t - t1) / 0.05) : 0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, u)) ;
    const x = rnd() * 2 - 1;
    const v = f1(x) * 0.9 + f2(x) * 0.5 * (0.5 + u);
    add(i0 + k, amp * e * v * 1.6, (u - 0.5) * 0.5, 0.15);
  }
}
// air: a breath of filtered noise swelling over [t0, t1]
function breath(t0, t1, amp, fA = 600, fB = 2400) {
  const i0 = at(t0), n = at(t1) - i0;
  const lo = bp(fA, 1.5), hi = bp(fB, 2.5);  // cross-fade a low band into a high one: the breath rises
  for (let k = 0; k < n; k++) {
    const u = k / n;
    const x = rnd() * 2 - 1;
    const e = Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 1.5;
    add(i0 + k, amp * e * (lo(x) * (1 - u) + hi(x) * u), 0.2 * Math.sin(u * 6), 0.4);
  }
}
// a held low chord (a fifth and an octave, slow beating), swelling and releasing
function chord(t0, t1, amp, root = 73.4) {
  const i0 = at(t0), n = at(t1) - i0;
  const fs_ = [root, root * 1.5, root * 2, root * 3.01];
  const ph = fs_.map(() => rnd() * 6);
  for (let k = 0; k < n; k++) {
    const s = k / SR, u = k / n;
    const e = Math.min(1, u / 0.35) * Math.min(1, (1 - u) / 0.25);
    let v = 0;
    fs_.forEach((f, j) => { ph[j] += 2 * Math.PI * f * (1 + 0.0015 * Math.sin(s * 0.7 + j)) / SR; v += Math.sin(ph[j]) / (j + 1.4); });
    add(i0 + k, amp * e * v, 0, 0.3);
  }
}

// ---- the score ----
for (const [t, kind] of HITS) {
  if (kind === 'big') drum(t, 0.75, 88, 44, 1.0);
  else if (kind === 'mid') drum(t, 0.45, 104, 52, 0.6);
  else if (kind === 'soft') knock(t, 0.3, 380 + (t * 37 % 90), (t * 13 % 1) - 0.5);
  else if (kind === 'accent') knock(t, 0.3, 610, 0.2);
}
for (const [a, b, amp] of SWISHES) swish(a, b, 0.22 * amp);
breath(M.FS1_GHOST[0] - 0.1, M.SILENCE_2[0] + 0.05, 0.18);
breath(M.FS2_GHOST[0] - 0.05, M.FS2_GHOST[1] + 0.1, 0.14);
breath(M.CALM, M.SILENCE_1[0], 0.03, 300, 900);
chord(M.KANJI.chi[7][1] - 0.4, M.YMARK + 0.1, 0.07);
chord(M.YMARK, M.CARD.url + 3.5, 0.06, 55);

// reverb: a small dark room (Schroeder: 4 combs, 2 all-passes) on the send
{
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d, buf: new Float32Array(d), i: 0, fb: 0.78, z: 0 }));
  const aps = [225, 556].map((d) => ({ d, buf: new Float32Array(d), i: 0 }));
  for (let k = 0; k < N; k++) {
    const x = send[k] * 0.25;
    let y = 0;
    for (const c of combs) {
      const o = c.buf[c.i]; c.z = o * 0.6 + c.z * 0.4; c.buf[c.i] = x + c.z * c.fb; c.i = (c.i + 1) % c.d; y += o;
    }
    for (const a of aps) { const o = a.buf[a.i]; const v = y + o * 0.5; a.buf[a.i] = v; a.i = (a.i + 1) % a.d; y = o - v * 0.5; }
    L[k] += y * 0.7; Rr[k] += y * 0.7;
  }
}
// true silence inside the silences (a short fade so nothing clicks)
for (const [a, b] of SILENCES) {
  for (let k = at(a - 0.12); k < at(b); k++) {
    if (k < 0 || k >= N) continue;
    const t = k / SR;
    const g = t < a ? 1 - (t - (a - 0.12)) / 0.12 : 0;
    L[k] *= g; Rr[k] *= g;
  }
}
// tail fade
for (let k = at(DURATION - 1.2); k < N; k++) { const g = Math.max(0, (N - k) / (SR * 1.2)); L[k] *= g; Rr[k] *= g; }

function writeWav(file, chans) {
  let peak = 1e-6;
  for (const c of chans) for (let k = 0; k < N; k++) peak = Math.max(peak, Math.abs(c[k]));
  const g = 0.89 / peak;
  const buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let k = 0; k < N; k++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chans[0][k] * g)) * 32767), 44 + k * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chans[1][k] * g)) * 32767), 46 + k * 4);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log('wrote', path.relative(root, file));
}
writeWav(path.join(root, 'audio/placeholder.wav'), [L, Rr]);

// ---- the click track: beats (downbeats accented), every hit as a low blip, silences marked by a tone pair
L.fill(0); Rr.fill(0); send.fill(0);
const blip = (t, f, amp, dur = 0.03) => {
  const i0 = at(t);
  for (let k = 0; k < SR * dur; k++) { const s = k / SR; add(i0 + k, amp * Math.sin(2 * Math.PI * f * s) * Math.exp(-s / (dur / 4)), 0, 0); }
};
for (let n = 0; T0 + n * BEAT < DURATION; n++) blip(T0 + n * BEAT, n % 4 === 0 ? 1760 : 1100, n % 4 === 0 ? 0.5 : 0.3);
for (const [t, kind] of HITS) blip(t, kind === 'big' ? 160 : 260, kind === 'big' ? 0.9 : 0.5, 0.12);
for (const [a, b] of SILENCES) { blip(a, 660, 0.3, 0.08); blip(b, 880, 0.3, 0.08); }
writeWav(path.join(root, 'audio/click.wav'), [L, Rr]);
