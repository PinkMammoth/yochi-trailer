// Pure motion helpers: every value is a function of the film time t (seconds).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** 0..1 progress of t through [a, b]. */
export const k = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const smooth = (u: number) => u * u * (3 - 2 * u);

/** Cubic bezier easing (CSS-style). */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = (s: number) => ((ax * s + bx) * s + cx) * s;
  const fy = (s: number) => ((ay * s + by) * s + cy) * s;
  return (x: number) => {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const d = (3 * ax * s + 2 * bx) * s + cx;
      if (Math.abs(d) < 1e-6) break;
      s -= (fx(s) - x) / d;
    }
    return fy(clamp(s));
  };
}
const stampEase = bezier(0.2, 0.9, 0.3, 1.2);
/** The house stamp: scale 2.8 rot -28 -> overshoot 0.9 -> 1.0 / -10 over 0.5 s. Returns {s, r, o}. */
export function stamp(t: number, at: number) {
  const u = k(t, at - 0.5, at);
  if (t < at - 0.5) return { s: 2.8, r: -28, o: 0 };
  const e = stampEase(u);
  const s = u < 1 ? lerp(2.8, 1.0, e) : 1.0;
  return { s, r: lerp(-28, -10, e), o: clamp(u * 4) };
}
/** Slam: x1.35 -> x1.0 in 0.16 s, first full frame on the hit. */
export function slam(t: number, at: number) {
  if (t < at) return { s: 1.35, o: 0 };
  const u = k(t, at, at + 0.16);
  return { s: lerp(1.35, 1, easeOut(u)), o: 1 };
}
/** Impact shake on the ground: <= amp px, decaying over len s. */
export function shake(t: number, at: number, amp = 6, len = 0.38) {
  if (t < at || t > at + len) return { x: 0, y: 0 };
  const u = (t - at) / len, a = amp * (1 - u);
  return { x: a * Math.sin(t * 173), y: a * Math.cos(t * 211) };
}
/** Rise: 24 px up while fading in. */
export const rise = (t: number, at: number, len = 0.45) => ({ y: 24 * (1 - easeOut(k(t, at, at + len))), o: k(t, at, at + len * 0.6) });
export const fade = (t: number, a: number, b: number, c: number, d: number) => Math.min(k(t, a, b), 1 - k(t, c, d));
export const within = (t: number, a: number, b: number) => t >= a && t < b;
