// Every frame is a pure function of t (seconds). Canvas 2D, 1080x1920, in the house 2.5D grammar
// (yochi-2p5d): the painting is one rigid layer over our own depth layers; ambient motion is a slow camera,
// parallax, ≤0.5% breath and ≤0.3° sway; the exaggeration is confined to one impact.
import { T } from './timing';

export const W = 1080;
export const H = 1920;

export type Assets = {
  fig: HTMLImageElement; // Cold Blooded v2, the house matte, paper fragments removed (tools/clean_matte.py)
  sky: HTMLImageElement;
  moon: HTMLImageElement;
  wisps: HTMLImageElement;
  ridgeFar: HTMLImageElement;
  ridgeMid: HTMLImageElement;
  ridgeNear: HTMLImageElement;
  mist: HTMLImageElement;
  grain: HTMLImageElement;
  paper: HTMLImageElement;
  seal: HTMLImageElement;
  figSil?: HTMLCanvasElement; // ink silhouette of the figure (built once)
};

export type Config = {
  captions: boolean;
  /** optional release line on the end card (not used by this film by default) */
  status: null | 'COMING SOON' | 'LIVE ON TESTNET' | 'NOW LIVE ON ELYSIUM';
};

// ---------------------------------------------------------------- tokens (asset-pack/sumi/README.md)
const C = {
  sumi: '#0f0d0b',
  ink: '#efe7d8',
  paper: '#f2ece0',
  paperInk: '#16130f',
  paperMuted: '#5d5548',
  down: '#ff4d6d', // standard OHLC down candle, sumi ground
  inkBlack: '#0b0908',
};

// ---------------------------------------------------------------- math
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const easeInOut = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vnoise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i + seed * 57.3) * (1 - u) + hash(i + 1 + seed * 57.3) * u;
};
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** cubic-bezier(.2,.9,.3,1.2) (the brand stamp curve), solved for x */
function bezier(x: number, p1x = 0.2, p1y = 0.9, p2x = 0.3, p2y = 1.2) {
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 30; i++) {
    t = (lo + hi) / 2;
    const bx = 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;
    if (bx < x) lo = t; else hi = t;
  }
  return 3 * (1 - t) * (1 - t) * t * p1y + 3 * (1 - t) * t * t * p2y + t * t * t;
}

// ---------------------------------------------------------------- figure geometry (plate px)
// Plate = the painting rect (card px − (72,150)). Head = house cast.json head point.
const FIG = { w: 1392, h: 1828, head: [595, 334] as const, anchor: [595, 1828] as const, eyes: [812, 318] as const };

type Shot = {
  /** figure: plate point `at` placed at screen (x,y) with scale s */
  fig: { at: readonly [number, number]; x: number; y: number; s: number };
  moon: { x: number; y: number; r: number };
  ridges: { y: number; x: number }; // offset of the ridge stack
  wisps: { y: number };
  mistY: number;
  /** camera: zoom from->to about focus, vertical/lateral truck in px (applied ×depth) */
  zoom: [number, number];
  focus: [number, number];
  truckX: [number, number];
  truckY: [number, number];
};

const WIDE: Shot = {
  fig: { at: FIG.head, x: 425, y: 975, s: 0.86 },
  moon: { x: 615, y: 760, r: 520 },
  ridges: { y: 430, x: -480 },
  wisps: { y: 380 },
  mistY: 1060,
  zoom: [1.0, 1.045],
  focus: [430, 930],
  truckX: [10, -10],
  truckY: [-170, 0],
};
const MEDIUM: Shot = {
  fig: { at: FIG.head, x: 300, y: 770, s: 1.1 },
  moon: { x: 790, y: 470, r: 700 },
  ridges: { y: 760, x: -300 },
  wisps: { y: 120 },
  mistY: 1250,
  zoom: [1.0, 1.11],
  focus: [800, 1180], // toward the hand on the mask
  truckX: [30, -40],
  truckY: [0, -30],
};
const EYES: Shot = {
  fig: { at: FIG.eyes, x: 540, y: 930, s: 2.12 },
  moon: { x: 900, y: 700, r: 900 },
  ridges: { y: 2400, x: 0 },
  wisps: { y: -900 },
  mistY: 3000,
  zoom: [1.0, 1.07],
  focus: [540, 930],
  truckX: [12, -12],
  truckY: [0, 0],
};

// ---------------------------------------------------------------- layer helper
type Cam = { zoom: number; focus: [number, number]; tx: number; ty: number };
function layer(ctx: CanvasRenderingContext2D, cam: Cam, z: number, fn: () => void) {
  const zl = 1 + (cam.zoom - 1) * (0.45 + 0.65 * z);
  ctx.save();
  ctx.translate(cam.focus[0], cam.focus[1]);
  ctx.scale(zl, zl);
  ctx.translate(-cam.focus[0] + cam.tx * (0.25 + z), -cam.focus[1] + cam.ty * (0.25 + z));
  fn();
  ctx.restore();
}

function camFor(shot: Shot, k: number): Cam {
  const e = easeInOut(k);
  return {
    zoom: lerp(shot.zoom[0], shot.zoom[1], e),
    focus: shot.focus,
    tx: lerp(shot.truckX[0], shot.truckX[1], e),
    ty: lerp(shot.truckY[0], shot.truckY[1], e),
  };
}

// ---------------------------------------------------------------- world layers
function drawSky(ctx: CanvasRenderingContext2D, A: Assets) {
  ctx.drawImage(A.sky, -210, -340);
}
function drawMoon(ctx: CanvasRenderingContext2D, A: Assets, m: Shot['moon'], dim = 0) {
  const S = (m.r / 640) * 1560;
  ctx.drawImage(A.moon, m.x - S / 2, m.y - S / 2, S, S);
  if (dim > 0) {
    ctx.fillStyle = `rgba(8,6,6,${dim})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawWisps(ctx: CanvasRenderingContext2D, A: Assets, y: number, t: number) {
  const x = -700 + t * 9; // drift
  ctx.globalAlpha = 0.9;
  ctx.drawImage(A.wisps, x, y, 2400, 900);
  ctx.globalAlpha = 1;
}
function drawRidge(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number) {
  ctx.drawImage(img, x, y);
}
function drawMist(ctx: CanvasRenderingContext2D, A: Assets, y: number, t: number, speed: number, alpha: number, scale = 1) {
  const w = 2000 * scale, h = 600 * scale;
  let x = -((t * speed) % w);
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 3; i++) ctx.drawImage(A.mist, x + i * w - w * 0.3, y - h / 2, w, h);
  ctx.globalAlpha = 1;
}

function drawFigure(ctx: CanvasRenderingContext2D, img: CanvasImageSource, shot: Shot, t: number, frozenT: number) {
  const { at, x, y, s } = shot.fig;
  // rigid ambient: breathing scale ≤0.5% and sway ≤0.3° about the anchor at the frame edge
  const tt = frozenT;
  const breath = 0.0042 * Math.sin((tt / 4.6) * Math.PI * 2);
  const sway = 0.22 * Math.sin((tt / 6.3) * Math.PI * 2 + 0.7) * (Math.PI / 180);
  const ax = x + (FIG.anchor[0] - at[0]) * s;
  const ay = y + (FIG.anchor[1] - at[1]) * s;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(sway);
  ctx.scale(s, s * (1 + breath));
  ctx.drawImage(img, -FIG.anchor[0], -FIG.anchor[1]);
  ctx.restore();
}

// ---------------------------------------------------------------- snow (in place of petals: see README)
type Flake = { x: number; y: number; z: number; r: number; v: number; ph: number; f: number };
const FLAKES: Flake[] = (() => {
  const r = mulberry(77);
  const out: Flake[] = [];
  for (let i = 0; i < 260; i++) {
    const z = Math.pow(r(), 1.8);
    out.push({ x: r() * 1400 - 160, y: r() * 2200, z, r: 1.2 + z * 6.5, v: 40 + z * 150 + r() * 30, ph: r() * 6.28, f: 0.3 + r() * 0.6 });
  }
  return out;
})();

function snowPos(fl: Flake, t: number, burst: number, bx: number, by: number): [number, number] {
  const fall = fl.v * t;
  let y = ((fl.y + fall) % 2200) - 140;
  let x = fl.x + t * (18 + fl.z * 40) + Math.sin(t * fl.f + fl.ph) * (10 + fl.z * 26);
  x = ((x + 160) % 1400 + 1400) % 1400 - 160;
  if (burst > 0) {
    const dx = x - bx, dy = y - by;
    const d = Math.hypot(dx, dy) + 1;
    const push = burst * 520 * (0.4 + fl.z) * Math.exp(-d / 900);
    x += (dx / d) * push;
    y += (dy / d) * push;
  }
  return [x, y];
}

function drawSnow(ctx: CanvasRenderingContext2D, t: number, near: boolean, opts: { burst: number; bx: number; by: number; alpha?: number }) {
  for (const fl of FLAKES) {
    if (near !== fl.z > 0.55) continue;
    const [x, y] = snowPos(fl, t, opts.burst, opts.bx, opts.by);
    if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
    const a = (0.35 + fl.z * 0.5) * (opts.alpha ?? 1);
    if (fl.z > 0.55) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, fl.r * 1.8);
      g.addColorStop(0, `rgba(239,231,216,${a * 0.75})`);
      g.addColorStop(1, 'rgba(239,231,216,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, fl.r * 1.8, 0, 6.283);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(239,231,216,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, fl.r, 0, 6.283);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- the candle (standard OHLC, no stylisation)
const CANDLE = { x: 470, w: 470, bodyTop: 640, bodyBot: 2150, wickTop: 440, wickW: 46 };
function drawCandle(ctx: CanvasRenderingContext2D, dy: number, color = C.down, smear = 0) {
  const { x, w, bodyTop, bodyBot, wickTop, wickW } = CANDLE;
  const pass = (oy: number, a: number) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.fillRect(x - wickW / 2, wickTop + dy + oy, wickW, bodyTop - wickTop + 2);
    ctx.fillRect(x - w / 2, bodyTop + dy + oy, w, bodyBot - bodyTop);
  };
  if (smear > 0) for (let i = 6; i >= 1; i--) pass(-smear * (i / 6), 0.12);
  pass(0, 1);
  ctx.globalAlpha = 1;
}
function candleDy(t: number) {
  if (t < T.candleIn) return -2700;
  if (t >= T.impact) return 0;
  const u = (t - T.candleIn) / (T.impact - T.candleIn);
  return -2700 * (1 - u * u);
}

const SANDAL_S = 1.7;
// ---------------------------------------------------------------- sandals (zori, side view, drawn in ink)
function drawSandal(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, s = 1, tone: 'colour' | 'ink' = 'colour') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  const L = 140, Th = 17;
  const ink = tone === 'ink' ? C.inkBlack : '#15110e';
  // strap (hanao): a dark cloth loop from the toe post back to the heel sides
  ctx.lineCap = 'round';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-L * 0.24, -Th / 2);
  ctx.quadraticCurveTo(-L * 0.05, -Th / 2 - 34, L * 0.2, -Th / 2 - 3);
  ctx.stroke();
  if (tone === 'colour') {
    ctx.strokeStyle = '#2d2a3a';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  // sole: layered straw slab, rounded toe and heel
  ctx.beginPath();
  const r = Th / 2;
  ctx.moveTo(-L / 2 + r, -Th / 2);
  ctx.lineTo(L / 2 - r, -Th / 2);
  ctx.arc(L / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-L / 2 + r, Th / 2);
  ctx.arc(-L / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
  ctx.fillStyle = tone === 'ink' ? C.inkBlack : '#bda37a';
  ctx.fill();
  if (tone === 'colour') {
    ctx.strokeStyle = 'rgba(60,44,28,0.75)';
    ctx.lineWidth = 1.6;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-L / 2 + 6, -Th / 2 + (i * Th) / 4);
      ctx.lineTo(L / 2 - 6, -Th / 2 + (i * Th) / 4 + (i % 2 ? 0.8 : -0.8));
      ctx.stroke();
    }
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-L / 2 + r, -Th / 2);
    ctx.lineTo(L / 2 - r, -Th / 2);
    ctx.arc(L / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-L / 2 + r, Th / 2);
    ctx.arc(-L / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.closePath();
    ctx.stroke();
    // toe post
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(-L * 0.24, -Th / 2 - 1, 4.5, 0, 6.283);
    ctx.fill();
  }
  ctx.restore();
}

/** sandal A leaves for good; sandal B leaves, then falls back onto the candle */
function sandalState(t: number, which: 0 | 1): { x: number; y: number; rot: number; visible: boolean } {
  const t0 = T.impact + 0.04;
  const x0 = which === 0 ? 430 : 575, y0 = 1790;
  if (t < t0) return { x: x0, y: y0, rot: 0, visible: false };
  if (t < T.sandalsOut + 0.3) {
    const dt = t - t0;
    const vx = which === 0 ? -330 : 300, vy = which === 0 ? -4300 : -4700;
    const g = 2600;
    return { x: x0 + vx * dt, y: y0 + vy * dt + 0.5 * g * dt * dt, rot: (which === 0 ? -1 : 1) * dt * 15, visible: true };
  }
  if (which === 0) return { x: 0, y: -999, rot: 0, visible: false };
  // the return: falls from above the frame onto the top of the candle body
  const restX = CANDLE.x + 140, restY = CANDLE.bodyTop - 9 * SANDAL_S;
  if (t < T.returnStart) return { x: restX, y: -200, rot: 0, visible: false };
  if (t < T.land1) {
    const u = (t - T.returnStart) / (T.land1 - T.returnStart);
    const y = lerp(-140, restY, u * u);
    return { x: restX + (1 - u) * 40, y, rot: (1 - u) * 5.2 + 0.0, visible: true };
  }
  if (t < T.land2) {
    const u = (t - T.land1) / (T.land2 - T.land1);
    const hop = 4 * u * (1 - u) * 38;
    return { x: restX - u * 6, y: restY - hop, rot: -0.22 * Math.sin(u * Math.PI), visible: true };
  }
  const u = clamp((t - T.land2) / (T.settle - T.land2));
  const rock = 0.09 * Math.exp(-u * 4) * Math.sin(u * Math.PI * 5) * (1 - u);
  return { x: restX - 6, y: restY - Math.abs(rock) * 40, rot: rock, visible: true };
}

// ---------------------------------------------------------------- the ink explosion
type Drop = { a: number; v: number; s: number; delay: number; k: number };
const DROPS: Drop[] = (() => {
  const r = mulberry(31);
  const out: Drop[] = [];
  for (let i = 0; i < 90; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.15;
    out.push({ a, v: 1400 + r() * 2800, s: 5 + Math.pow(r(), 2) * 34, delay: r() * 0.05, k: r() });
  }
  return out;
})();
const SPRAY: Drop[] = (() => {
  const r = mulberry(32);
  const out: Drop[] = [];
  for (let i = 0; i < 340; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.6;
    out.push({ a, v: 300 + r() * 2000, s: 1.5 + r() * 4.5, delay: r() * 0.08, k: r() });
  }
  return out;
})();
const IMPACT_PT: [number, number] = [CANDLE.x, 1880];

function drawInkDrops(ctx: CanvasRenderingContext2D, dt: number, color = C.inkBlack) {
  const g = 4600;
  ctx.fillStyle = color;
  for (const d of DROPS) {
    const tt = dt - d.delay;
    if (tt <= 0 || tt > 1.1) continue;
    const vx = Math.cos(d.a) * d.v, vy = Math.sin(d.a) * d.v;
    const x = IMPACT_PT[0] + vx * tt, y = IMPACT_PT[1] + vy * tt + 0.5 * g * tt * tt;
    if (y > H + 80 || x < -80 || x > W + 80) continue;
    const cvy = vy + g * tt;
    const sp = Math.hypot(vx, cvy);
    const stretch = 1 + Math.min(3.2, sp / 900);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(cvy, vx));
    ctx.beginPath();
    ctx.ellipse(0, 0, d.s * stretch * 0.6, d.s * 0.5, 0, 0, 6.283);
    ctx.fill();
    // a trailing droplet
    ctx.beginPath();
    ctx.arc(-d.s * stretch * 0.9, 0, d.s * 0.18, 0, 6.283);
    ctx.fill();
    ctx.restore();
  }
}
function drawSpray(ctx: CanvasRenderingContext2D, dt: number) {
  for (const d of SPRAY) {
    const tt = dt - d.delay;
    if (tt <= 0 || tt > 1.6) continue;
    const drag = (1 - Math.exp(-tt * 3.2)) / 3.2;
    const x = IMPACT_PT[0] + Math.cos(d.a) * d.v * drag;
    const y = IMPACT_PT[1] + Math.sin(d.a) * d.v * drag + 260 * tt * tt;
    const a = clamp(1 - tt / 1.6) * 0.85;
    ctx.fillStyle = `rgba(239,231,216,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, d.s, 0, 6.283);
    ctx.fill();
  }
}
/** snow kicked up at the base: soft cream billows */
function drawSnowCloud(ctx: CanvasRenderingContext2D, dt: number) {
  if (dt < 0 || dt > 2.4) return;
  const r = mulberry(51);
  for (let i = 0; i < 16; i++) {
    const ang = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.3;
    const dist = (220 + r() * 520) * easeOut(dt / 1.1);
    const x = IMPACT_PT[0] + Math.cos(ang) * dist * 1.3;
    const y = IMPACT_PT[1] + Math.sin(ang) * dist * 0.75 + 40;
    const rad = (120 + r() * 200) * (0.5 + easeOut(dt / 1.4));
    const a = 0.32 * clamp(1 - dt / 2.4) * (0.6 + r() * 0.4);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(214,204,192,${a})`);
    g.addColorStop(1, 'rgba(214,204,192,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
/** the big splat on the impact frames: an ink star at the contact point */
function drawSplat(ctx: CanvasRenderingContext2D, k: number, color = C.inkBlack) {
  const r = mulberry(9);
  const [cx, cy] = [CANDLE.x, 1500];
  ctx.fillStyle = color;
  ctx.beginPath();
  const n = 46;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const spike = r() < 0.35 ? 1.6 + r() * 1.6 : 0.8 + r() * 0.35;
    const rad = (260 + 120 * vnoise(i * 0.7, 3)) * spike * k;
    const x = cx + Math.cos(a) * rad * 1.1, y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = (380 + r() * 520) * k;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d * 1.1, cy + Math.sin(a) * d, (4 + r() * 22) * k, 0, 6.283);
    ctx.fill();
  }
}

// ---------------------------------------------------------------- type
function fadeIn(t: number, a: number, b: number, fin = 0.28, fout = 0.22) {
  return smooth((t - a) / fin) * (1 - smooth((t - (b - fout)) / fout));
}
function caption(ctx: CanvasRenderingContext2D, lines: string[], t: number, win: readonly [number, number], y: number, size: number, weight: number) {
  const a = fadeIn(t, win[0], win[1]);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${weight} ${size}px "ZenKaku"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 22;
  ctx.fillStyle = C.ink;
  const lift = (1 - smooth((t - win[0]) / 0.6)) * 10;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + i * size * 1.28 + lift));
  ctx.restore();
}

// ---------------------------------------------------------------- impact helpers
function shake(t: number): { x: number; y: number; rot: number } {
  const dt = t - T.impact;
  if (dt < 0 || dt > 0.75) return { x: 0, y: 0, rot: 0 };
  const env = Math.exp(-dt * 6.5);
  const kick = dt < 1 / 60 + 1e-6 ? 1 : 0;
  return {
    x: (vnoise(t * 38, 1) - 0.5) * 2 * 22 * env + kick * 16,
    y: (vnoise(t * 41, 2) - 0.5) * 2 * 22 * env + kick * -14,
    rot: (vnoise(t * 25, 3) - 0.5) * 2 * 0.6 * env * (Math.PI / 180),
  };
}

function inkNegative(ctx: CanvasRenderingContext2D) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const pr = 242, pg = 236, pb = 224, ir = 22, ig = 19, ib = 15;
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    const k = clamp((l - 0.16) / 0.1); // bright -> ink, dark -> paper
    const s = k * k * (3 - 2 * k);
    d[i] = pr + (ir - pr) * s;
    d[i + 1] = pg + (ig - pg) * s;
    d[i + 2] = pb + (ib - pb) * s;
  }
  ctx.putImageData(img, 0, 0);
}

function grade(ctx: CanvasRenderingContext2D, A: Assets, t: number, vignette = 0.55, grain = 0.07) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.22, W / 2, H * 0.5, H * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${vignette})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const e = ctx.createLinearGradient(0, 0, 150, 0);
  e.addColorStop(0, `rgba(6,5,4,${vignette * 0.9})`);
  e.addColorStop(1, 'rgba(6,5,4,0)');
  ctx.fillStyle = e;
  ctx.fillRect(0, 0, 150, H);
  const f = Math.floor(t * 24); // grain at 24 fps: film, not video noise
  const ox = Math.floor(hash(f) * 512), oy = Math.floor(hash(f + 9) * 512);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = grain;
  for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(A.grain, x, y);
  ctx.restore();
}

export function buildSilhouette(fig: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = fig.width;
  c.height = fig.height;
  const x = c.getContext('2d')!;
  x.drawImage(fig, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = C.inkBlack;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------------------------------------------------------------- the night scene
function night(ctx: CanvasRenderingContext2D, A: Assets, t: number, shot: Shot, cam: Cam, o: { figure: boolean; frozenT: number; dim?: number }) {
  ctx.fillStyle = C.sumi;
  ctx.fillRect(0, 0, W, H);
  layer(ctx, cam, 0, () => drawSky(ctx, A));
  layer(ctx, cam, 0.06, () => drawMoon(ctx, A, shot.moon, o.dim ?? 0));
  layer(ctx, cam, 0.14, () => drawWisps(ctx, A, shot.wisps.y, o.frozenT));
  layer(ctx, cam, 0.22, () => drawRidge(ctx, A.ridgeFar, shot.ridges.x - 40, shot.ridges.y));
  layer(ctx, cam, 0.3, () => drawMist(ctx, A, shot.ridges.y + 560, o.frozenT, 14, 0.55));
  layer(ctx, cam, 0.34, () => drawRidge(ctx, A.ridgeMid, shot.ridges.x - 260, shot.ridges.y + 150));
  layer(ctx, cam, 0.44, () => drawRidge(ctx, A.ridgeNear, shot.ridges.x - 120, shot.ridges.y + 300));
  layer(ctx, cam, 0.5, () => drawMist(ctx, A, shot.mistY, o.frozenT, 22, 0.6));
  layer(ctx, cam, 0.6, () => drawSnow(ctx, o.frozenT, false, { burst: 0, bx: 0, by: 0 }));
  if (o.figure) layer(ctx, cam, 0.8, () => drawFigure(ctx, A.fig, shot, t, o.frozenT));
}

// ---------------------------------------------------------------- end card (paper)
function endCard(ctx: CanvasRenderingContext2D, A: Assets, t: number, cfg: Config) {
  const ts = t - T.stamp;
  // impact shake on the stamped surface: ≤6 px, 0.38 s
  const sh = ts >= 0 && ts < 0.38 ? (1 - ts / 0.38) * 6 : 0;
  const sx = (vnoise(t * 50, 5) - 0.5) * 2 * sh, sy = (vnoise(t * 47, 6) - 0.5) * 2 * sh;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.drawImage(A.paper, -110, -140);
  // the seal: scale(2.8) rotate(-28°) -> overshoot 0.9 -> 1.0 / -10° over 0.5 s; contact on the beat
  const S = 330;
  const k0 = (t - (T.stamp - 0.17)) / 0.5; // 0.17 s of the 0.5 s curve land before contact
  if (k0 > 0) {
    const e = bezier(clamp(k0));
    const sc = lerp(2.8, 1.0, e);
    const rot = lerp(-28, -10, e) * (Math.PI / 180);
    const a = clamp(k0 * 5);
    // ink splatter on contact
    if (ts > 0) {
      const r = mulberry(4);
      ctx.fillStyle = 'rgba(214,64,43,0.9)';
      for (let i = 0; i < 18; i++) {
        const ang = r() * 6.283, d = S * (0.62 + r() * 0.5) * easeOut(ts / 0.18);
        ctx.beginPath();
        ctx.arc(W / 2 + Math.cos(ang) * d, 720 + Math.sin(ang) * d, 2 + r() * 7, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(W / 2, 720);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.drawImage(A.seal, -S / 2, -S / 2, S, S);
    ctx.restore();
  }
  const kt = (d: number) => smooth((ts - d) / 0.3);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.paperInk;
  // YOCHI: slam ×1.35 -> 1.0 in 0.16 s
  const ky = clamp((ts - 0.12) / 0.16);
  if (ky > 0) {
    ctx.save();
    ctx.translate(W / 2, 1065);
    const sc = lerp(1.35, 1, easeOut(ky));
    ctx.scale(sc, sc);
    ctx.globalAlpha = ky;
    ctx.font = '400 150px "Dela"';
    ctx.fillText('YOCHI', 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = kt(0.35);
  ctx.font = '700 54px "ZenKaku"';
  ctx.fillText('Call it right. Take the pool.', W / 2, 1185);
  ctx.globalAlpha = kt(0.5);
  ctx.font = '700 66px "JBMono"';
  ctx.fillText('yochigg.xyz', W / 2, 1335);
  if (cfg.status) {
    ctx.fillStyle = '#b3301e';
    ctx.font = '700 40px "JBMono"';
    ctx.fillText(cfg.status.split('').join(' '), W / 2, 1430);
    ctx.fillStyle = C.paperInk;
  }
  ctx.globalAlpha = kt(0.65);
  ctx.fillStyle = C.paperMuted;
  ctx.font = '500 32px "JBMono"';
  ctx.fillText('18+  ·  PLAY RESPONSIBLY', W / 2, 1690);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- the film
export function drawFrame(ctx: CanvasRenderingContext2D, A: Assets, t: number, cfg: Config) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  if (t >= T.end) {
    endCard(ctx, A, t, cfg);
    grade(ctx, A, t, 0.12, 0.05);
    return;
  }

  // ---- act one
  if (t < T.s1[1]) {
    const cam = camFor(WIDE, (t - T.s1[0]) / (T.s1[1] - T.s1[0]));
    night(ctx, A, t, WIDE, cam, { figure: true, frozenT: t });
    layer(ctx, cam, 1, () => {
      drawMist(ctx, A, 1880, t, 40, 0.5, 1.3);
      drawSnow(ctx, t, true, { burst: 0, bx: 0, by: 0 });
    });
    grade(ctx, A, t);
    if (cfg.captions) caption(ctx, ['I have studied the markets', 'for twenty years...'], t, T.cap1, 225, 62, 700);
    return;
  }
  if (t < T.s2[1]) {
    const cam = camFor(MEDIUM, (t - T.s2[0]) / (T.s2[1] - T.s2[0]));
    night(ctx, A, t, MEDIUM, cam, { figure: true, frozenT: t });
    layer(ctx, cam, 1, () => drawSnow(ctx, t, true, { burst: 0, bx: 0, by: 0 }));
    grade(ctx, A, t, 0.6);
    if (cfg.captions) caption(ctx, ['I have mastered', 'technical analysis...'], t, T.cap2, 225, 62, 700);
    return;
  }
  if (t < T.s3[1]) {
    const k = (t - T.s3[0]) / (T.s3[1] - T.s3[0]);
    const cam = camFor(EYES, k);
    night(ctx, A, t, EYES, cam, { figure: true, frozenT: t });
    layer(ctx, cam, 1, () => drawSnow(ctx, t, true, { burst: 0, bx: 0, by: 0, alpha: 0.6 }));
    grade(ctx, A, t, 0.4);
    // letterbox: the strip of his eyes
    ctx.fillStyle = '#070606';
    const top = 655, bot = 1205;
    ctx.fillRect(0, 0, W, top);
    ctx.fillRect(0, bot, W, H - bot);
    if (cfg.captions) caption(ctx, ['I cannot lose.'], t, T.cap3, 1380, 84, 900);
    return;
  }

  // ---- act two: back to the wide (the end of shot one's move), held in silence
  const cam = camFor(WIDE, 1);
  const sh = shake(t);
  const dtI = t - T.impact;
  const hitStop = dtI >= 0 && dtI < 0.1;
  // ambient time freezes for the hit-stop, then carries on
  const fT = t < T.impact ? t : hitStop ? T.impact : t - 0.1;
  ctx.save();
  ctx.translate(W / 2 + sh.x, H / 2 + sh.y);
  ctx.rotate(sh.rot);
  ctx.translate(-W / 2, -H / 2);
  const shadowK = smooth((t - T.shadow) / (T.impact - T.shadow));

  if (dtI >= 0 && dtI < 2 / 60) {
    // impact frame 1-2 (≤2 frames): paper-white, the candle and the warrior in one ink mass, the splat
    ctx.fillStyle = C.paper;
    ctx.fillRect(-60, -60, W + 120, H + 120);
    if (!A.figSil) A.figSil = buildSilhouette(A.fig);
    layer(ctx, cam, 0.8, () => {
      drawFigure(ctx, A.figSil!, WIDE, t, T.impact);
      drawCandle(ctx, 0, C.inkBlack);
      drawSplat(ctx, 1.1);
    });
    ctx.restore();
    return;
  }

  night(ctx, A, t, WIDE, cam, { figure: t < T.impact, frozenT: fT, dim: shadowK * 0.4 * (t < T.impact ? 1 : 0) });
  layer(ctx, cam, 0.8, () => {
    // the falling shadow over the warrior
    if (t < T.impact && shadowK > 0) {
      ctx.save();
      const blur = lerp(120, 30, shadowK);
      ctx.filter = `blur(${blur}px)`;
      ctx.fillStyle = `rgba(4,3,3,${0.8 * shadowK})`;
      const w = lerp(900, 560, shadowK);
      ctx.fillRect(CANDLE.x - w / 2, -200, w, H + 400);
      ctx.restore();
    }
    const dy = candleDy(t);
    if (t >= T.candleIn) drawCandle(ctx, dy, C.down, t < T.impact ? 260 : 0);
    if (dtI >= 0) {
      drawSnowCloud(ctx, dtI);
      drawInkDrops(ctx, hitStop ? 0.02 : dtI - 0.08);
      drawSpray(ctx, hitStop ? 0.02 : dtI - 0.08);
      for (const which of [0, 1] as const) {
        const s = sandalState(hitStop ? T.impact + 0.05 : t - 0.1, which);
        if (s.visible) drawSandal(ctx, s.x, s.y, s.rot, SANDAL_S);
      }
    }
  });
  layer(ctx, cam, 1, () => {
    drawMist(ctx, A, 1880, fT, 40, 0.5, 1.3);
    drawSnow(ctx, fT, true, { burst: dtI > 0 ? clamp(dtI / 0.5) : 0, bx: IMPACT_PT[0], by: IMPACT_PT[1] });
  });
  ctx.restore();
  grade(ctx, A, t);

  // impact frames 3-6 (≈2 frames at 30 fps): ink negative of the whole frame
  if (dtI >= 2 / 60 && dtI < 6 / 60) inkNegative(ctx);

  // the title
  if (t >= T.title && cfg.captions !== undefined) {
    const k = clamp((t - T.title) / 0.16);
    const sc = lerp(1.35, 1, easeOut(k));
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(W / 2, 235);
    ctx.scale(sc, sc);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink;
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 30;
    ctx.font = '400 90px "Dela"';
    ctx.fillText('THE CANDLE', 0, 0);
    ctx.fillText('DOESN\u2019T CARE.', 0, 112);
    ctx.restore();
  }
}
