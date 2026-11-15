// House motion curves (docs/YOCHI_MOTION_STYLE_GUIDE.md section 5), as pure functions of time in seconds.
import { Easing } from 'remotion';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x: number) => Math.pow(clamp(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const yoStamp = Easing.bezier(0.2, 0.9, 0.3, 1.2);

/** Slam: x1.35 -> x1.0 in 0.16 s, first full frame on the hit. Returns {s, a}. */
export function slamK(t: number, t0: number, from = 1.35, dur = 0.16) {
  if (t < t0) return { s: from, a: 0 };
  const p = clamp((t - t0) / dur);
  return { s: lerp(from, 1, easeOut(p)), a: 1 };
}

/** Stamp: scale 2.8 / -28deg -> 0.9 -> 1.05 -> 1.0 / rest over 0.5 s; contact (~scale 1) about 0.07 s in. */
export function stampK(t: number, t0: number, rest = -10) {
  if (t < t0) return { s: 2.8, r: -28, a: 0 };
  const p = clamp((t - t0) / 0.5);
  const keys = [0, 0.55, 0.72, 1];
  const seg = (vals: number[]) => {
    for (let i = 0; i < 3; i++) {
      if (p <= keys[i + 1] || i === 2) {
        const local = yoStamp(clamp((p - keys[i]) / (keys[i + 1] - keys[i])));
        return vals[i] + (vals[i + 1] - vals[i]) * local;
      }
    }
    return vals[3];
  };
  return { s: seg([2.8, 0.9, 1.05, 1]), r: seg([-28, rest + 1, rest, rest]), a: p >= 0.55 ? 1 : yoStamp(p / 0.55) };
}
/** The stamp's contact moment after its start (for sound and shake). */
export const STAMP_CONTACT = 0.07;

/** Rise: 24 px up while fading in (the green amount after a win). */
export function riseK(t: number, t0: number, dur = 0.45) {
  const p = easeOut((t - t0) / dur);
  return { y: 24 * (1 - p), a: p };
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vnoise = (x: number, seed: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i + seed * 57.3) * (1 - u) + hash(i + 1 + seed * 57.3) * u;
};

export interface Hit { t: number; px: number; dur: number }
/** Sum of decaying band-limited shakes, with a hard first-frame kick. Output px. */
export function shakeAt(t: number, hits: Hit[], fps = 60) {
  let x = 0, y = 0, r = 0;
  for (const h of hits) {
    const since = t - h.t;
    if (since < 0 || since > h.dur * 1.6) continue;
    const env = Math.exp(-since * (3 / h.dur));
    const n = since * 54;
    x += h.px * env * (vnoise(n, 1) * 2 - 1) + (since < 1 / fps ? 0.45 * h.px : 0);
    y += h.px * env * (vnoise(n, 2) * 2 - 1) - (since < 1 / fps ? 0.35 * h.px : 0);
    r += 0.025 * h.px * env * (vnoise(n, 3) * 2 - 1);
  }
  return { x, y, r };
}

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export { hash, vnoise };
