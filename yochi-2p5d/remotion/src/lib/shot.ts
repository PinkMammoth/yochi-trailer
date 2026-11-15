// The shot model: a declarative ShotSpec plus pure per-frame state (shotState). Every frame is a pure
// function of (spec, character, frame), so shots render in parallel and Blender can key the same values.
//
// Two registers, by design (owner direction, 15 Nov 2026):
//   ambient  subtle, rigid, whole-figure: breathing scale and sway about the figure's anchor (rung 4 of the
//            house method ladder). No local mesh warp in ambient motion: the painting never rubber-sheets.
//   impact   brief and allowed to be exaggerated: shake, punch-in, hit-stop, ink-negative frames, shockwave,
//            a short gust on the free hair/cloth ends, slash, seal, burst. All decay inside ~0.6 s.
import { LIMITS, type Ground, type Kanji } from './brand.ts';

export type Format = '16:9' | '9:16' | '4:5' | 'card';
/** The house painting rect (card px) every card shares: film-flagship/tools/cast_prep.py. */
export const PLATE_RECT = { x: 72, y: 150, w: 1392, h: 1828 } as const;
/** 'card' renders the painting rect itself (the card frame is a static overlay), at this scale. */
export const CARD_SCALE = 1; // native: frame 0 is the painting's own pixels, 1:1
const even = (n: number) => Math.round(n / 2) * 2;
export const FORMATS: Record<Format, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '4:5': { width: 1080, height: 1350 },
  card: { width: even(PLATE_RECT.w * CARD_SCALE), height: even(PLATE_RECT.h * CARD_SCALE) },
};

type Framing = { center: [number, number]; width: number; pushTarget?: [number, number] };
/** Authored framing if the character has one, else one derived from its head point. */
export function framingFor(meta: CharacterMeta, format: Format): Framing {
  const P = meta.plate;
  if (format === 'card') return { center: [P.x + P.w / 2, P.y + P.h / 2], width: P.w };
  const authored = meta.framings?.[format];
  if (authored) return authored;
  const { width: W, height: H } = FORMATS[format];
  const width = format === '16:9' ? 1320 : format === '9:16' ? 928 : 960;
  const h = (width * H) / W;
  const [hx, hy] = meta.head;
  // head in the upper third (4:5, 16:9); 9:16 takes the full safe height
  const cy = format === '9:16' ? (meta.safe.y0 + meta.safe.y1) / 2 : hy + h * (format === '4:5' ? 0.2 : 0.12);
  return { center: [hx, cy], width, pushTarget: [hx, hy + h * 0.12] };
}

/** prepare_character.py writes this (characters/<id>/build/meta.json). Card pixel coordinates. */
export interface CharacterMeta {
  id: string;
  name: string;
  card: string;
  plate: { x: number; y: number; w: number; h: number };
  safe: { x0: number; y0: number; x1: number; y1: number };
  anchor: [number, number];
  head: [number, number];
  figBounds: [number, number, number, number];
  matte: { source: string; fill: number; provenance: string };
  flow: boolean;
  framings: Partial<Record<Format, Framing>>;
  ground: Ground;
  /** no figure/ground split (weak or missing matte): the painting moves as one piece */
  wholeImage?: boolean;
  /** 'ink' where the painting's own ground is vermilion */
  slashTone?: 'red' | 'ink';
}

export interface SlashSpec {
  /** start and end in frame units (0..1), drawn start -> end */
  from: [number, number];
  to: [number, number];
  /** brush width in px at 1080 (short side) */
  width?: number;
  /** behind the figure (cut across the ground) or in front of everything */
  behind?: boolean;
  /** 'auto' follows the character (ink on a vermilion ground) */
  tone?: 'red' | 'ink' | 'auto';
  /** frames to draw the stroke, ending on the hit */
  reveal?: number;
}

export interface SealSpec {
  glyph: Kanji;
  /** centre in frame units */
  at: [number, number];
  /** edge length in px at 1080 */
  size?: number;
  tone?: 'red' | 'ink' | 'out';
  rotate?: number;
}

export interface ImpactSpec {
  frame: number;
  /** shake amplitude, px at 1080 short side, and its duration (s) */
  shake: number;
  shakeDuration: number;
  /** scale punch on the hit (house impact frame: 1.0 -> 1.08 over 2 frames) */
  punch: number;
  /** freeze ambient motion and atmosphere for this long (s); the camera keeps shaking */
  hitStop: number;
  /** ink-negative impact frames (0..2) */
  inkFrames: number;
  /** paper-white flash strength on the first frames (<= 2 frames) */
  flash: number;
  /** radial shockwave strength 0..1 (0 = off) */
  shockwave: number;
  /** brief gust on the free hair/cloth ends, px at 1080 (0 = off). The only local warp, impact only. */
  gust: number;
  /** frames of anticipation before the hit (lean-in, gust build) */
  anticipation: number;
  slash?: SlashSpec | false;
  seal?: SealSpec | false;
  burst?: boolean;
}

/** House-safe impact: the numbers in the motion style guide. */
export const IMPACT_HOUSE: Omit<ImpactSpec, 'frame'> = {
  shake: LIMITS.houseShakePx, shakeDuration: LIMITS.houseShakeS, punch: 0.08, hitStop: 0.12,
  inkFrames: 0, flash: 0.5, shockwave: 0, gust: 0, anticipation: 20,
};
/** Dramatic impact: for the one big hit of a trailer. Still brief: everything decays inside ~0.6 s. */
export const IMPACT_DRAMATIC: Omit<ImpactSpec, 'frame'> = {
  shake: 22, shakeDuration: 0.6, punch: 0.08, hitStop: 0.1,
  inkFrames: 2, flash: 0.6, shockwave: 1, gust: 9, anticipation: 30,
};

export interface ShotSpec {
  character: string;
  format: Format;
  durationInFrames: number;
  fps?: number;
  ground?: Ground;
  /** 'grey' = a loss (house grey variant), 'silhouette' = ink silhouette (locked reward / reveal tease) */
  variant?: 'color' | 'grey' | 'silhouette';
  camera?: {
    /** zoom at the start and end of the shot (1 = the framing's width fills the frame) */
    push?: [number, number];
    /** lateral move over the shot, card px at the figure's depth */
    truck?: [number, number];
    /** 0..1: how far the centre travels toward the framing's pushTarget as it pushes */
    toTarget?: number;
    /** start the shot this far into the framing (frames of an imaginary earlier move), for cuts */
    offset?: number;
  };
  ambient?: {
    /** breathing: vertical scale about the anchor (<= 0.015) */
    breath?: number;
    period?: number;
    /** sway: degrees about the anchor (<= 2) */
    sway?: number;
  };
  light?: {
    /** key light angle in degrees (0 = from the right, + = above), start -> end */
    angle?: [number, number];
    /** the figure's soft shadow on the ground plate (world light) */
    shadow?: number;
    /** a slow pool of light drifting across the ground plate (world light) */
    pool?: number;
    /** rim + directional wash ON the figure. 0 by default: OPEN_DECISIONS #7 (keep lighting in the world) */
    figure?: number;
  };
  atmosphere?: { dust?: number; ink?: number; bokeh?: number; wind?: number };
  impact?: ImpactSpec;
  /** seamless loop: every ambient term is periodic over the duration, frame N === frame 0 */
  loop?: boolean;
  /** vignette + grain (false = none, e.g. app assets that must match the still art) */
  grade?: false | { vignette?: number; grain?: number };
}

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

/** Layer zoom for depth z (0 far .. 1 near): near layers grow faster as the camera pushes (a dolly feel). */
export const layerZoom = (zoom: number, z: number) => 1 + (zoom - 1) * (0.45 + 0.65 * z);

export interface ShotState {
  W: number;
  H: number;
  /** output px per 1080 px (shake, widths, sizes scale with this) */
  unit: number;
  cam: { zoom: number; cx: number; cy: number; winW: number; truckX: number; truckY: number; shakeX: number; shakeY: number; shakeRot: number };
  fig: { anchor: [number, number]; scaleX: number; scaleY: number; rot: number };
  gust: number;
  /** ambient time (s): stops during hit-stop */
  t: number;
  light: { dx: number; dy: number; intensity: number; shadow: number; pool: number; figure: number; poolPhase: number };
  impact: { env: number; since: number; flash: number; inkFrame: boolean; shockwave: number; anticipation: number; active: boolean };
  variant: 0 | 1 | 2;
  loop: boolean;
  phase: number;
  /** plate px over which motion falls to zero at the plate edge (0 = off) */
  pin: number;
}

export function shotState(spec: ShotSpec, meta: CharacterMeta, f: number): ShotState {
  const fps = spec.fps ?? 30;
  const { width: W, height: H } = FORMATS[spec.format];
  const unit = Math.min(W, H) / 1080;
  const framing = framingFor(meta, spec.format);
  const card = spec.format === 'card';
  const loop = !!spec.loop;
  // loop phase: frame N wraps to frame 0
  const ph = (2 * Math.PI * f) / spec.durationInFrames;
  const L = spec.durationInFrames / fps;
  const N = Math.max(1, spec.durationInFrames - 1);
  const im = spec.impact;

  // ---- impact envelopes
  const since = im && f >= im.frame ? (f - im.frame) / fps : -1;
  const env = since >= 0 ? Math.exp(-since * (3 / Math.max(0.05, im!.shakeDuration))) : 0;
  const ant = im ? smooth((f - (im.frame - im.anticipation)) / Math.max(1, im.anticipation)) * (f < im.frame ? 1 : 0) : 0;
  const hit = im && since >= 0 && since < im.hitStop;
  // ambient time freezes during hit-stop, then carries on (no jump)
  const t = !im || f < im.frame ? f / fps : f / fps - Math.min(since, im.hitStop);

  // ---- camera
  const c = spec.camera ?? {};
  const [z0, z1] = c.push ?? [1, 1.1];
  const u = easeInOut((f + (c.offset ?? 0)) / N);
  let zoom = loop ? z0 + (z1 - z0) * (1 - Math.cos(ph)) / 2 : z0 + (z1 - z0) * u;
  if (im) {
    // punch-in: up over 2 frames, then relax with the envelope; a little lean-in during anticipation
    const punchIn = since >= 0 ? (since * fps < 2 ? (since * fps + 1) / 2 : env) : 0;
    zoom += im.punch * punchIn + 0.012 * ant;
  }
  const k = clamp((zoom - 1) / Math.max(0.01, z1 - 1 + 0.03));
  const tgt = framing.pushTarget ?? framing.center;
  const toT = (c.toTarget ?? 0.35) * k;
  let cx = framing.center[0] + (tgt[0] - framing.center[0]) * toT;
  let cy = framing.center[1] + (tgt[1] - framing.center[1]) * toT;
  const [tx, ty] = c.truck ?? [-26, 6];
  const truckX = loop ? tx * Math.sin(ph) : tx * easeInOut(f / N);
  const truckY = loop ? ty * 0.5 * Math.sin(2 * ph) : ty * Math.sin((f / N) * Math.PI);
  // keep the widest (farthest) layer's window inside the safe rect, with room for the shake
  const winW = framing.width;
  const farW = winW / layerZoom(zoom, 0.15);
  const farH = (farW * H) / W;
  const shakeMargin = ((im?.shake ?? 0) * unit * env * winW) / W + 2;
  const s = meta.safe;
  const clampC = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : clamp(v, lo, hi));
  if (!card) {
    cx = clampC(cx + truckX * 0.15, s.x0 + farW / 2 + shakeMargin, s.x1 - farW / 2 - shakeMargin) - truckX * 0.15;
    cy = clampC(cy + truckY * 0.15, s.y0 + farH / 2 + shakeMargin, s.y1 - farH / 2 - shakeMargin) - truckY * 0.15;
  }

  // shake: decaying band-limited noise with a hard first kick (output px)
  let shakeX = 0, shakeY = 0, shakeRot = 0;
  if (im && since >= 0) {
    const n = since * fps * 0.9;
    const amp = im.shake * unit * env;
    shakeX = amp * (vnoise(n, 1) * 2 - 1) + (f === im.frame ? 0.45 * im.shake * unit : 0);
    shakeY = amp * (vnoise(n, 2) * 2 - 1) - (f === im.frame ? 0.35 * im.shake * unit : 0);
    shakeRot = 0.027 * im.shake * env * (vnoise(n, 3) * 2 - 1); // degrees (0.6 deg at 22 px)
  }

  // ---- ambient (rigid, whole figure)
  const a = spec.ambient ?? {};
  const breathAmt = clamp(a.breath ?? 0.006, 0, LIMITS.breathScale);
  const swayAmt = clamp(a.sway ?? 0.25, 0, LIMITS.swayDeg);
  const period = a.period ?? 3.4;
  const breaths = Math.max(1, Math.round(L / period));
  const br = loop ? 0.5 - 0.5 * Math.cos(breaths * ph) : 0.5 - 0.5 * Math.cos((t / period) * Math.PI * 2);
  // the figure lifts a touch into the hit and settles back (still rigid)
  const brace = im ? ant + (since >= 0 ? Math.exp(-since * 1.4) : 0) : 0;
  const scaleY = 1 + breathAmt * br + 0.002 * brace;
  const scaleX = 1 + breathAmt * 0.3 * br;
  const sway = loop ? Math.sin(ph) : Math.sin(t * 0.55 + 0.6);
  const rot = (((swayAmt * sway) - 0.15 * brace) * Math.PI) / 180;

  // gust: impact only, on the flow mask (free ends)
  const gust = im && meta.flow ? im.gust * (0.35 * ant + (since >= 0 ? env : 0)) : 0;

  // ---- light (world by default)
  const l = spec.light ?? {};
  const [a0, a1] = l.angle ?? [-25, 20];
  const ang = ((a0 + (a1 - a0) * (loop ? (1 - Math.cos(ph)) / 2 : easeInOut(f / N))) * Math.PI) / 180;
  const flash = im && since >= 0 && since * fps < 2 ? im.flash : 0;
  const light = {
    dx: Math.cos(ang), dy: Math.sin(ang),
    intensity: 0.9 + 0.1 * (loop ? Math.sin(ph) : Math.sin(t * 1.7)) + (im && since >= 0 ? 0.6 * env : 0),
    // in a loop the world light breathes in from zero at the seam, so frame 0 is the still painting
    shadow: (l.shadow ?? 0.22) * (loop ? (1 - Math.cos(ph)) / 2 : 1),
    pool: (l.pool ?? 0.07) * (loop ? (1 - Math.cos(ph)) / 2 : 1),
    figure: l.figure ?? 0,
    poolPhase: loop ? ph : t * 0.6,
  };

  const inkFrame = !!im && since >= 0 && since * fps < im.inkFrames;
  const variant = spec.variant === 'grey' ? 1 : spec.variant === 'silhouette' ? 2 : 0;
  return {
    W, H, unit,
    cam: { zoom, cx, cy, winW, truckX, truckY, shakeX, shakeY, shakeRot },
    fig: { anchor: meta.anchor, scaleX, scaleY, rot },
    gust,
    t,
    light,
    impact: { env, since, flash, inkFrame, shockwave: im?.shockwave ?? 0, anticipation: ant, active: !!hit },
    variant,
    loop, phase: ph,
    // card format: motion falls to zero at the frame, so the static frame overlay always matches
    pin: card ? 110 : 0,
  };
}

/** Particles and the burst follow ambient time (they freeze in a hit-stop too). Wind integral, for drift. */
export function windIntegral(spec: ShotSpec, f: number) {
  const fps = spec.fps ?? 30;
  const base = spec.atmosphere?.wind ?? 1;
  let acc = 0;
  for (let i = 1; i <= f; i++) {
    const im = spec.impact;
    const since = im && i >= im.frame ? (i - im.frame) / fps : -1;
    if (im && since >= 0 && since < im.hitStop) continue;
    const ant = im ? smooth((i - (im.frame - im.anticipation)) / Math.max(1, im.anticipation)) * (i < im.frame ? 1 : 0) : 0;
    const env = since >= 0 ? Math.exp(-since * 5) : 0;
    acc += (base * (0.55 + 0.45 * ant) + 1.4 * env) / fps;
  }
  return acc;
}
