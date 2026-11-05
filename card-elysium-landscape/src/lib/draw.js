// Grounds, type, seals and the brand's motion (stamp, impact, rise), drawn on the virtual stage.
import { SUMI, PAPER, F } from './brand.js';
import { clamp, lerp, mulberry32, noise2, hash1 } from '../core/math.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------------------------------------------------------------------------------------------- grounds
// Washi: warm off-white, long horizontal fibre strands, a slow mottle. Made once, a little larger than the
// stage so it can drift with the camera.
let PAPER_TEX = null, SUMI_TEX = null;
export function initGrounds(R) {
  const w = R.VW + 240, h = R.VH + 240;
  PAPER_TEX = mk(w, h);
  {
    const c = PAPER_TEX.getContext('2d');
    c.fillStyle = PAPER.bg; c.fillRect(0, 0, w, h);
    const sw = Math.ceil(w / 4), sh = Math.ceil(h / 4);
    const m = mk(sw, sh), mc = m.getContext('2d'), id = mc.createImageData(sw, sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const n = noise2(x / 60, y / 60) * 0.6 + noise2(x / 14, y / 14) * 0.4;
      const i = (y * sw + x) * 4;
      id.data[i] = 120; id.data[i + 1] = 95; id.data[i + 2] = 60; id.data[i + 3] = 10 + n * 10;
    }
    mc.putImageData(id, 0, 0);
    c.imageSmoothingQuality = 'high'; c.drawImage(m, 0, 0, w, h);
    const rnd = mulberry32(11);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * w, y = rnd() * h, L = 30 + rnd() * 260, a = 0.025 + rnd() * 0.05;
      c.strokeStyle = rnd() < 0.7 ? `rgba(107,84,56,${a})` : `rgba(255,252,244,${a * 2.2})`;
      c.lineWidth = 0.6 + rnd() * 1.4;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + L * 0.3, y + (rnd() - 0.5) * 4, x + L * 0.7, y + (rnd() - 0.5) * 4, x + L, y + (rnd() - 0.5) * 3); c.stroke();
    }
  }
  SUMI_TEX = mk(w, h);
  {
    const c = SUMI_TEX.getContext('2d');
    c.fillStyle = SUMI.bg; c.fillRect(0, 0, w, h);
    const sw = Math.ceil(w / 6), sh = Math.ceil(h / 6);
    const m = mk(sw, sh), mc = m.getContext('2d'), id = mc.createImageData(sw, sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const n = noise2(x / 40, y / 40) * 0.5 + 0.5;
      const i = (y * sw + x) * 4;
      id.data[i] = 60; id.data[i + 1] = 48; id.data[i + 2] = 36; id.data[i + 3] = n * 22;
    }
    mc.putImageData(id, 0, 0);
    c.drawImage(m, 0, 0, w, h);
  }
}
export function paper(R, dx = 0, dy = 0) { R.b.drawImage(PAPER_TEX, -120 + (dx % 120), -120 + (dy % 120)); }
export function sumi(R, dx = 0, dy = 0) { R.b.drawImage(SUMI_TEX, -120 + (dx % 120), -120 + (dy % 120)); }
export const paperTex = () => PAPER_TEX;
export const sumiTex = () => SUMI_TEX;

// ---------------------------------------------------------------------------------------------- motion
// CSS cubic-bezier(x1, y1, x2, y2) as a function of progress.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s;
  return (x) => {
    x = clamp(x); let s = x;
    for (let i = 0; i < 8; i++) { const d = (3 * ax * s + 2 * bx) * s + cx; if (Math.abs(d) < 1e-6) break; s -= (X(s) - x) / d; }
    return Y(clamp(s));
  };
}
const STAMP_EASE = bezier(0.2, 0.9, 0.3, 1.2);
const EASE_OUT = bezier(0, 0, 0.58, 1);
// keyframes with a per-segment timing function, like CSS
function kf(p, frames, ez) {
  if (p <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    if (p <= frames[i][0]) {
      const [p0, v0] = frames[i - 1], [p1, v1] = frames[i];
      const u = ez((p - p0) / (p1 - p0));
      return v0.map((a, j) => lerp(a, v1[j], u));
    }
  }
  return frames[frames.length - 1][1];
}
// The stamp: scale 2.8 / -28deg -> 0.9 -> 1.05 -> 1.0 at the resting angle, 0.5 s. Returns {s, r, a}.
export function stampK(dt, rest = -10, dur = 0.5) {
  if (dt < 0) return { s: 2.8, r: -28, a: 0 };
  const [s, r, a] = kf(dt / dur, [[0, [2.8, -28, 0]], [0.55, [0.9, rest + 1, 1]], [0.72, [1.05, rest, 1]], [1, [1, rest, 1]]], STAMP_EASE);
  return { s, r, a };
}
// The impact shake on the stamped surface: 0.38 s, at most 6 px.
export function impactK(dt, amp = 1) {
  if (dt < 0 || dt > 0.38) return [0, 0];
  const [x, y] = kf(dt / 0.38, [[0, [0, 0]], [0.2, [-6, 4]], [0.4, [5, -3]], [0.6, [-3, 2]], [0.8, [2, -1]], [1, [0, 0]]], EASE_OUT);
  return [x * amp, y * amp];
}
// The rise: 24 px up and in over 0.45 s.
export function riseK(dt, dist = 24) {
  if (dt < 0) return { y: dist, a: 0 };
  const u = EASE_OUT(clamp(dt / 0.45));
  return { y: dist * (1 - u), a: u };
}
// A slam: from big and blurred to rest in `dur`, a little overshoot.
export function slamK(dt, from = 1.35, dur = 0.16) {
  if (dt < 0) return { s: from, a: 0 };
  const u = clamp(dt / dur);
  const e = 1 - Math.pow(1 - u, 3);
  const s = lerp(from, 1, e) - Math.sin(clamp((dt - dur) / 0.14) * Math.PI) * 0.018;
  return { s, a: 1 }; // a smash cut is solid on its first frame
}

// ---------------------------------------------------------------------------------------------- type
export function text(c, str, x, y, o = {}) {
  c.save();
  c.font = o.font || F.dela(64);
  c.fillStyle = o.color || PAPER.ink;
  c.textAlign = o.align || 'left';
  c.textBaseline = o.base || 'alphabetic';
  c.letterSpacing = (o.track || 0) + 'px';
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  if (o.maxW) {
    const w = c.measureText(str).width;
    if (w > o.maxW) { c.translate(x, y); c.scale(o.maxW / w, o.maxW / w); x = 0; y = 0; }
  }
  if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.strokeW || 4; c.lineJoin = 'round'; c.strokeText(str, x, y); }
  if (!o.noFill) c.fillText(str, x, y);
  c.restore();
}
export function measure(c, str, font, track = 0) {
  c.save(); c.font = font; c.letterSpacing = track + 'px'; const w = c.measureText(str).width; c.restore(); return w;
}
// tracked caps label in mono (the UI's eyebrow)
export function label(c, str, x, y, o = {}) {
  text(c, str, x, y, { font: F.mono(o.size || 22, o.weight || 700), track: o.track ?? (o.size || 22) * 0.22, color: o.color || PAPER.muted, align: o.align, base: o.base, alpha: o.alpha });
}

// ---------------------------------------------------------------------------------------------- seals
// The hanko: rounded square, one glyph in Yuji Syuku (or the CALLED IT latin hanko), with the stamp texture
// (fractal-noise holes, kept light so the glyph stays readable). Drawn once per look at 400 px and cached.
const SEALS = new Map();
let HOLES = null;
function holes() {
  if (HOLES) return HOLES;
  const n = 400; HOLES = mk(n, n);
  const c = HOLES.getContext('2d'), id = c.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = noise2(x / 3.2, y / 3.2) * 0.55 + noise2(x / 9, y / 9) * 0.3 + noise2(x / 40, y / 40) * 0.35;
    const i = (y * n + x) * 4;
    id.data[i + 3] = v > 0.52 ? clamp((v - 0.52) * 6) * 255 : 0;
  }
  c.putImageData(id, 0, 0);
  return HOLES;
}
const TONE = {
  red: (G) => ({ fill: G.red, stroke: null, ink: G.onRed }),
  outline: (G) => ({ fill: null, stroke: G.red, ink: G.red }),
  ink: (G) => ({ fill: G.ink, stroke: null, ink: G.bg }),
  out: (G) => ({ fill: null, stroke: G.out, ink: G.out }),
  empty: (G) => ({ fill: null, stroke: G.muted, ink: G.muted, dash: true }),
};
export function sealCanvas(kind, tone = 'red', ground = 'sumi') {
  const key = `${kind}|${tone}|${ground}`;
  if (SEALS.has(key)) return SEALS.get(key);
  const G = ground === 'paper' ? PAPER : SUMI;
  const t = TONE[tone](G);
  const n = 400, cv = mk(n, n), c = cv.getContext('2d');
  const inset = n * 0.075, r = n * 0.075;
  c.beginPath(); c.roundRect(inset, inset, n - 2 * inset, n - 2 * inset, r);
  if (t.fill) { c.fillStyle = t.fill; c.fill(); }
  if (t.stroke) { c.strokeStyle = t.stroke; c.lineWidth = n * (t.dash ? 0.03 : 0.0625); if (t.dash) c.setLineDash([n * 0.09, n * 0.065]); c.stroke(); c.setLineDash([]); }
  c.fillStyle = t.ink; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  if (kind === 'CALLED IT') {
    c.strokeStyle = t.ink; c.lineWidth = n * 0.0156;
    c.beginPath(); c.roundRect(n * 0.131, n * 0.131, n * 0.738, n * 0.738, n * 0.03); c.stroke();
    c.font = F.dela(n * 0.163);
    const w = c.measureText('CALLED').width, want = n * 0.6125;
    c.save(); c.translate(n / 2, n * 0.45); c.scale(want / w, 1); c.fillText('CALLED', 0, 0); c.restore();
    c.font = F.dela(n * 0.25); c.fillText('IT', n / 2, n * 0.725);
  } else if (kind === 'Y') {
    // drawn by the caller from the logo SVG
  } else {
    const chars = [...kind].length;
    const fs = chars > 1 ? (58 / chars) * (n / 80) : 46 * (n / 80);
    c.font = F.glyph(fs);
    c.fillText(kind, n / 2, n / 2 + fs * 0.36);
  }
  if (tone !== 'empty') { c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 0.85; c.drawImage(holes(), 0, 0); }
  SEALS.set(key, cv);
  return cv;
}
// draw a seal centred at x,y with size `size`, rotation in degrees, scale and alpha
export function seal(c, kind, x, y, size, o = {}) {
  const cv = o.canvas || sealCanvas(kind, o.tone || 'red', o.ground || 'sumi');
  c.save();
  c.translate(x, y); c.rotate(((o.rot ?? -6) * Math.PI) / 180); c.scale(o.s ?? 1, o.s ?? 1);
  c.globalAlpha *= o.a ?? 1;
  if (o.shadow) { c.shadowColor = o.shadow; c.shadowBlur = size * 0.12; c.shadowOffsetY = size * 0.04; }
  c.drawImage(cv, -size / 2, -size / 2, size, size);
  c.restore();
}
// The stamp's motion first reaches full size (contact: the moment it hits the paper) 0.1 s in.
export const CONTACT = 0.1;
// a seal that makes contact at tc (the stamp motion starts CONTACT before), plus its ink splatter
export function stampSeal(c, kind, x, y, size, t, tc, o = {}) {
  const dur = o.dur ?? 0.5, t0 = tc - CONTACT * dur / 0.5;
  if (t < t0) return;
  const k = stampK(t - t0, o.rest ?? -10, dur);
  seal(c, kind, x, y, size, { ...o, s: k.s, rot: k.r, a: k.a * (o.a ?? 1) });
  if (o.splat !== false && t >= tc) splatter(c, x, y, size, o.color || (o.ground === 'paper' ? PAPER.red : SUMI.red), o.seed || 3, clamp((t - tc) / 0.05));
}
// ink splatter around a landed stamp: a few round drops flung outward, deterministic per seed
export function splatter(c, x, y, size, color, seed = 1, k = 1) {
  const rnd = mulberry32(seed * 7919);
  c.save(); c.fillStyle = color;
  const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = size * (0.55 + rnd() * 0.45) * (0.7 + 0.3 * k);
    const r = size * (0.012 + rnd() * rnd() * 0.05);
    c.globalAlpha = k;
    c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------------------------------------- images
export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('load ' + src)); i.src = src; });
}
export { mk };
export const sh = hash1;
