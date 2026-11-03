// Deterministic math, easing, noise and random utilities.
// Every frame is a pure function of time, so nothing here may depend on call order.

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const remap = (x, a, b, c, d) => lerp(c, d, invLerp(a, b, x));
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const fract = (x) => x - Math.floor(x);
export const TAU = Math.PI * 2;

// Easing ------------------------------------------------------------------
export const E = {
  linear: (t) => clamp(t),
  inQuad: (t) => { t = clamp(t); return t * t; },
  outQuad: (t) => { t = clamp(t); return 1 - (1 - t) * (1 - t); },
  inOutQuad: (t) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  inCubic: (t) => { t = clamp(t); return t * t * t; },
  outCubic: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 3); },
  inOutCubic: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  inOutSine: (t) => { t = clamp(t); return -(Math.cos(Math.PI * t) - 1) / 2; },
  inQuart: (t) => { t = clamp(t); return t * t * t * t; },
  outQuart: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 4); },
  inOutQuart: (t) => { t = clamp(t); return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; },
  outQuint: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 5); },
  inExpo: (t) => { t = clamp(t); return t === 0 ? 0 : Math.pow(2, 10 * t - 10); },
  outExpo: (t) => { t = clamp(t); return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
  inOutExpo: (t) => {
    t = clamp(t);
    if (t === 0 || t === 1) return t;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  outBack: (t, s = 1.70158) => { t = clamp(t); const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  inBack: (t, s = 1.70158) => { t = clamp(t); return (s + 1) * t * t * t - s * t * t; },
  outElastic: (t) => {
    t = clamp(t);
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  // snappy "anime" ease: very fast start, long settle
  snap: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 6); },
};

// Damped spring response to a unit step at t=0 (for overshoot/settle).
export function spring(t, freq = 4, damp = 0.35) {
  if (t <= 0) return 0;
  const w = TAU * freq;
  return 1 - Math.exp(-damp * w * t) * Math.cos(w * Math.sqrt(1 - damp * damp) * t);
}

// Seeded RNG ---------------------------------------------------------------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function rngFrom(...keys) {
  let h = 2166136261 >>> 0;
  for (const k of keys) {
    const s = String(k);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= 0x9e3779b9; h = Math.imul(h, 16777619);
  }
  return mulberry32(h);
}
// stateless hash -> [0,1)
export function hash1(n) {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
export function hash2(a, b) {
  let x = Math.sin(a * 127.1 + b * 311.7 + 74.7) * 43758.5453123;
  return x - Math.floor(x);
}

// Smooth value noise ------------------------------------------------------
export function noise1(x) {
  const i = Math.floor(x); const f = x - i; const u = f * f * (3 - 2 * f);
  return lerp(hash1(i), hash1(i + 1), u) * 2 - 1;
}
export function fbm1(x, oct = 3) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise1(x * f + i * 17.3); f *= 2.03; a *= 0.5; }
  return v;
}
export function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y); const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}

// Camera shake: smooth, decaying, deterministic.
export function shake(t, t0, amp, dur = 0.35, freq = 22, seed = 1) {
  const dt = t - t0;
  if (dt < 0 || dt > dur) return [0, 0];
  const k = Math.pow(1 - dt / dur, 2) * amp;
  return [noise1(dt * freq + seed * 13.1) * k, noise1(dt * freq + seed * 29.7 + 50) * k];
}

// piecewise keyframes: keys = [[t, v, ease?], ...]
export function keys(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) {
      const [t0, v0] = ks[i - 1]; const [t1, v1, ez] = ks[i];
      const u = (t - t0) / (t1 - t0);
      const e = ez ? ez(u) : u;
      if (Array.isArray(v0)) return v0.map((a, j) => lerp(a, v1[j], e));
      return lerp(v0, v1, e);
    }
  }
  return ks[ks.length - 1][1];
}

// Envelope that is 0 before a, rises over `att`, holds, falls over `rel` before b.
export function env(t, a, b, att = 0.1, rel = 0.1, ez = smooth) {
  if (t < a || t > b) return 0;
  return Math.min(ez((t - a) / Math.max(1e-6, att)), ez((b - t) / Math.max(1e-6, rel)));
}

// Impulse decaying after t0.
export function pulse(t, t0, decay = 0.25) {
  const d = t - t0;
  if (d < 0) return 0;
  return Math.exp(-d / decay);
}

export function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(c, a = 1) {
  const [r, g, b] = typeof c === 'string' ? hexToRgb(c) : c;
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
export function mixRgb(a, b, t) {
  const A = typeof a === 'string' ? hexToRgb(a) : a;
  const B = typeof b === 'string' ? hexToRgb(b) : b;
  return [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];
}
export function scaleRgb(c, k) {
  const A = typeof c === 'string' ? hexToRgb(c) : c;
  return [A[0] * k, A[1] * k, A[2] * k];
}
