// One source of truth for the shot's timing and camera, used by both implementations.
// A (pure Remotion) reads it directly; B (Blender) reads the same values from
// timeline.json, which tools/export-timeline.ts writes from this file.
//
// Coordinates are in "canvas px": the derived plates in demo-2p5d/assets (1344 x 856),
// cut from the Untouchable card painting. The 16:9 camera window is 1320 x 742.5.

export const FPS = 30;
export const DURATION = 150; // 5 s
export const W = 1920;
export const H = 1080;

export const CANVAS = { w: 1344, h: 856 };
export const WINDOW = { w: 1320, h: 742.5 };

export const IMPACT = 96; // frame of the hit (3.2 s)

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const easeInOut = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

// Deterministic hash noise.
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const vnoise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i + seed * 57.3) * (1 - u) + hash(i + 1 + seed * 57.3) * u;
};

export interface Cam {
  /** zoom of the nearest layer (1 = window fills frame) */
  zoom: number;
  /** camera centre, canvas px */
  cx: number;
  cy: number;
  /** lateral truck, canvas px at depth 1 (near layers move the full amount) */
  truckX: number;
  truckY: number;
  /** shake in output px and degrees */
  shakeX: number;
  shakeY: number;
  shakeRot: number;
}

/** Impact envelope: 1 at the hit, decaying. */
export const impactEnv = (f: number) => {
  if (f < IMPACT) return 0;
  const t = (f - IMPACT) / FPS;
  return Math.exp(-t * 5.5);
};

/** Anticipation ramp in the second before the hit. */
export const anticipation = (f: number) => smooth((f - (IMPACT - 30)) / 30) * (f < IMPACT ? 1 : 0);

export function camera(f: number): Cam {
  const t = f / (DURATION - 1);
  // Slow push: 1.0 -> 1.12, with a small punch-in at the hit that relaxes back.
  const push = 1 + 0.12 * easeInOut(t);
  const punch = 0.035 * impactEnv(f) + 0.012 * anticipation(f);
  const zoom = push + punch;
  // Drift the centre toward the face as we push (kept inside the plates' margins).
  const k = (zoom - 1) / 0.15;
  const cx = 672 + 40 * k;
  const cy = 386 - 18 * k;
  // A slow truck left that reveals parallax (grows with the push so the edges stay covered).
  const truckX = -26 * easeInOut(t);
  const truckY = 6 * Math.sin(t * Math.PI);
  // Shake: decaying, band-limited noise; a hard first kick.
  const e = impactEnv(f);
  const n = (f - IMPACT) * 0.9;
  const amp = 22 * e;
  const shakeX = amp * (vnoise(n, 1) * 2 - 1) + (f === IMPACT ? 10 : 0);
  const shakeY = amp * (vnoise(n, 2) * 2 - 1) + (f === IMPACT ? -8 : 0);
  const shakeRot = 0.6 * e * (vnoise(n, 3) * 2 - 1);
  return { zoom, cx, cy, truckX, truckY, shakeX, shakeY, shakeRot };
}

/** Character performance (all small: the painting must still read as the painting). */
export function performance(f: number) {
  const s = f / FPS;
  // Breath: ~3.4 s cycle, an inhale held a beat before the hit, a release after.
  const breath = 0.5 - 0.5 * Math.cos((s / 3.4) * Math.PI * 2) - 0.35 * impactEnv(f);
  // Head: a slow settle, then she lifts her chin and turns a touch toward the threat.
  // Degrees, screen space (y down): negative lifts her chin. Held after the hit, easing half back.
  const post = f >= IMPACT ? 1 - 0.5 * smooth((f - IMPACT) / 45) : 0;
  const headRot = 0.3 * Math.sin(s * 0.9) - 1.4 * (f < IMPACT ? anticipation(f) : post);
  const headLift = 2.5 * (f < IMPACT ? anticipation(f) : post);
  // Wind on hair and ribbons: steady breeze, a gust into the hit, a burst at the hit.
  const wind = 0.55 + 0.45 * anticipation(f) + 1.4 * impactEnv(f);
  return { breath: Math.max(0, breath), headRot, headLift, wind, time: s };
}

/** Key light: starts low right (behind her, a rim on the profile), climbs and swings. */
export function light(f: number) {
  const t = f / (DURATION - 1);
  const ang = (-25 + 45 * easeInOut(t)) * (Math.PI / 180); // radians, 0 = from the right
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const flash = impactEnv(f) * (f - IMPACT < 3 ? 1 : 0.6);
  return { dx, dy, intensity: 0.85 + 0.15 * Math.sin(t * 3) + 0.8 * flash, flash };
}
