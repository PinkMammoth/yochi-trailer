// Shared world state for the film: the market, the crowd, the named players.
import { clamp, lerp, E, noise1, fbm1, smooth, hexToRgb } from '../core/math.js';
import { M } from '../core/music.js';
import { RGB, C } from '../elements/helmet.js';
import { makeCrowd, makeRing } from '../elements/crowd.js';

export const CANDLE_Z = -9;
export const CS = 3.0; // world units per chart unit (candle scale)
// YOU's hoodie: near-black like everyone else's; the lit cyan piping round the face is what finds
// YOU in a crowd (the pearl alternative is [226, 224, 240])
export const YOU_SHELL = [28, 28, 40];

export const CAST = {
  you: { name: 'YOU', type: 'dome', shell: YOU_SHELL, accent: C.cyan, stripes: 'y' },
  exit: { name: 'EXIT_LIQUIDITY', type: 'bear', shell: [40, 34, 52], accent: C.red, stripes: 'one' },
  oxtom: { name: '0XTOM', type: 'frog', shell: [56, 74, 70], accent: C.green },
  soup: { name: 'SOUP', type: 'antenna', shell: [74, 62, 96], accent: C.gold },
  cope: { name: 'COPE_DEALER', type: 'cat', shell: [62, 52, 80], accent: C.faint },
};

let crowd = null, hero = null, rival = null;
export function world() {
  if (!crowd) {
    crowd = makeRing({ seed: 7, cx: 0, cz: CANDLE_Z, r0: 5.6, r1: 44, sx: 0.8, sz: 0.76, grow: 0.004 });
    const HX = 0.25, HZ = CANDLE_Z + 7.4;
    hero = crowd.reduce((a, m) => (Math.hypot(m.x - HX, m.z - HZ) < Math.hypot(a.x - HX, a.z - HZ) ? m : a));
    rival = crowd.filter((m) => m !== hero).reduce((a, m) => (Math.hypot(m.x - (hero.x + 0.85), m.z - hero.z) < Math.hypot(a.x - (hero.x + 0.85), a.z - hero.z) ? m : a));
    hero.hero = true; rival.rival = true;
    hero.type = 'dome'; rival.type = 'bear';
  }
  return { crowd, hero, rival };
}

// ---- Round 1: the first candle (Act I), closes at the drop -----------------
// Price in world units relative to the strike (the floor).
export function price1(t) {
  if (t >= M.DROP1) {
    const u = (t - M.DROP1) / 0.42;
    return 0.02 + 8.6 * E.outExpo(u) + 0.25 * Math.sin((t - M.DROP1) * 3) * clamp(u - 1, 0, 1);
  }
  if (t >= M.GAP) return freezeTwitch(t);
  // envelope of volatility grows through the act
  const amp = t < 2.4 ? 0.28 : t < 5.15 ? 0.45 : t < 9.75 ? 0.7 : t < 11.59 ? 1.1 : 1.55;
  const speed = t < 9.75 ? 0.9 : t < 11.59 ? 1.6 : 2.6;
  let p = fbm1(t * speed + 3.7, 3) * amp * 1.4 + 0.12;
  // accents on the claps
  const kick = (t0, v, d = 0.25) => (t > t0 ? v * Math.exp(-(t - t0) / d) : 0);
  p += kick(M.CLAP_A, 0.7) + kick(M.CLAP_B, -0.8);
  const e8 = [4.234, 4.464, 4.694, 4.924];
  e8.forEach((te, i) => { p += kick(te, i % 2 ? -0.75 : 0.75, 0.2); });
  // converge to the strike before the freeze
  const conv = clamp((t - 13.9) / (M.GAP - 13.9));
  return lerp(p, 0, E.inCubic(conv));
}
// The silence: the candle twitches green on the stab at 14.81 and on each stab of the figure that
// follows (false starts, each a little bigger), then strains upward as the bass swells into the kick.
const TWITCHES = [[M.STAB, 0.1], ...M.STABS.map((t0, i) => [t0, 0.07 + i * 0.03])];
export function stabTwitch(t) {
  let v = 0;
  for (const [t0, a] of TWITCHES) { const tw = t - t0; if (tw > 0 && tw < 0.14) v = Math.max(v, a * (1 - tw / 0.14)); }
  return v;
}
export function bassStrain(t) {
  const s0 = M.STABS[M.STABS.length - 1] + 0.14;
  const sw = clamp((t - s0) / (M.DROP1 - s0));
  return sw > 0 && t < M.DROP1 ? 0.05 * sw * sw * (0.65 + 0.35 * Math.sin(t * 90)) : 0;
}
export function freezeTwitch(t) { return Math.max(stabTwitch(t), bassStrain(t)); }
// running hi/lo for the wicks
export function hiLo(fn, t0, t, step = 0.04) {
  let hi = -1e9, lo = 1e9;
  for (let s = t0; s <= t; s += step) { const v = fn(s); if (v > hi) hi = v; if (v < lo) lo = v; }
  const v = fn(t); hi = Math.max(hi, v); lo = Math.min(lo, v);
  return [hi, lo];
}

// ---- crowd picks for round 1 -------------------------------------------------
export function pickOf(m) { return m.r1 < 0.06 ? 0 : m.r1 < 0.55 ? 1 : -1; }
export function pickTime(m) { return m.r2 < 0.72 ? 0.7 + m.r2 * 1.5 : 2.4 + (m.r2 - 0.72) / 0.28 * 6.6; }

export function ledFor(p) { return p === 1 ? RGB.green : p === -1 ? RGB.red : RGB.text; }
export function eyesFor(p) { return p === 1 ? 'up' : p === -1 ? 'down' : 'dot'; }

// Tennis signal: every head snaps up/down on the claps. Returns [-1..1].
const TENNIS = [[3.66, 1], [4.0, -1], [4.234, 1], [4.464, -1], [4.694, 1], [4.924, -1], [5.15, 1]];
export function tennis(t, lag = 0) {
  const tt = t - lag;
  if (tt >= 10.67 && tt < 11.595) {
    // pre-drop callback: every 8th note, faster
    const k = Math.floor((tt - 10.67) / 0.23);
    const u = ((tt - 10.67) % 0.23) / 0.05;
    const cur = k % 2 ? -1 : 1, prev = -cur;
    return prev + (cur - prev) * E.outBack(clamp(u), 2.2);
  }
  let prev = 0, cur = 0, t0 = -9;
  for (const [tk, v] of TENNIS) if (tt >= tk) { prev = cur; cur = v; t0 = tk; }
  const u = clamp((tt - t0) / 0.07);
  return prev + (cur - prev) * E.outBack(u, 2.4);
}

// A single jump that lands and holds (celebrations stay restrained: no looping bounce).
// u: time since take-off; returns height (0 on the ground, peak h), a small dip on landing.
export function jump(u, h, dur = 0.34) {
  if (u <= 0) return 0;
  if (u < dur) { const k = u / dur; return 4 * h * k * (1 - k); }
  const d = u - dur;
  return d < 0.16 ? -h * 0.18 * Math.sin((d / 0.16) * Math.PI) : 0;
}

// Standard look-at-candle for tennis heads (positive = up).
export function lookAt(t, m, fn = price1, lag = 0.07) {
  return clamp(fn(t - lag * (0.3 + m.r3)) / 1.3, -1, 1);
}
