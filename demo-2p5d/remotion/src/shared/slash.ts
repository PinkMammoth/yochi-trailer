// The impact graphic: one sumi-ink brush slash, drawn bristle by bristle (procedural, no
// assets), revealed over 4 frames at the hit. It sits BETWEEN the background and the
// figure, so it reads as cut across the moon behind her. Output space, 1920 x 1080.
import { IMPACT, clamp, easeOut, hash } from './timeline';

const P0 = { x: 1915, y: 70 };
const P1 = { x: 1095, y: 1035 };
export const slashCenter = () => ({ x: (P0.x + P1.x) / 2, y: (P0.y + P1.y) / 2 });

// Vermilion (paper ground, large shapes): the brand's one skewed element, once per scene.
const INK = [214, 64, 43];

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

export function slashProgress(f: number) {
  return easeOut((f - (IMPACT - 2)) / 4);
}

export function drawSlash(ctx: CanvasRenderingContext2D, f: number) {
  const rev = slashProgress(f);
  if (rev <= 0) return;
  // After the hit the ink soaks in: a little lighter and softer, never gone.
  const age = Math.max(0, (f - IMPACT) / 30);
  const fade = 1 - 0.35 * clamp(age / 1.4);
  const dx = P1.x - P0.x;
  const dy = P1.y - P0.y;
  const len = Math.hypot(dx, dy);
  const tx = dx / len;
  const ty = dy / len;
  const nx = -ty;
  const ny = tx;
  // slight S-curve so it reads as a hand, not a line
  const path = (u: number, off: number) => {
    const bow = Math.sin(u * Math.PI) * 38 + Math.sin(u * Math.PI * 2) * 10;
    const x = P0.x + dx * u + nx * (bow + off);
    const y = P0.y + dy * u + ny * (bow + off);
    return [x, y];
  };
  // broad press at the start, thinning and breaking into dry-brush streaks at the tail
  const maxW = 170;
  const width = (u: number) =>
    maxW * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, 0.15 + u * 1.5))) * (1 - 0.8 * Math.pow(u, 1.6)) * (0.6 + 0.4 * clamp(u / 0.05));
  const rnd = mulberry(1234);
  const N = 150;
  const steps = 110;
  ctx.save();
  ctx.lineCap = 'round';
  // faint bleed halo under the stroke
  ctx.globalAlpha = 0.07 * fade;
  ctx.fillStyle = `rgb(${INK[0]},${INK[1]},${INK[2]})`;
  ribbon(ctx, path, (u) => width(u) * 0.56, rev, 70);
  ctx.globalAlpha = 1;
  for (let k = 0; k < N; k++) {
    const side = rnd() * 2 - 1; // position across the brush
    const lw = 1.5 + rnd() * 4.5;
    // outer bristles run out of ink first, so the tail frays into streaks
    const uEnd = 1 - Math.abs(side) * (0.25 + rnd() * 0.5) - rnd() * 0.1;
    const dryStart = 0.12 + rnd() * 0.5;
    const shade = 0.82 + rnd() * 0.3;
    const a0 = (0.65 + rnd() * 0.35) * fade;
    ctx.strokeStyle = `rgba(${Math.round(INK[0] * shade)},${Math.round(INK[1] * shade)},${Math.round(INK[2] * shade)},${a0})`;
    ctx.lineWidth = lw;
    let drawing = false;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * Math.min(rev, uEnd);
      const w = width(u);
      const jitter = (hash(k * 13.1 + i * 0.37) - 0.5) * 2.2;
      const [x, y] = path(u, side * w * 0.5 + jitter);
      const dry = u > dryStart && hash(k * 7.7 + Math.floor(u * 45)) < (u - dryStart) * 2.6;
      if (dry) {
        if (drawing) ctx.stroke();
        drawing = false;
        ctx.beginPath();
        continue;
      }
      if (!drawing) {
        ctx.moveTo(x, y);
        drawing = true;
      } else ctx.lineTo(x, y);
    }
    if (drawing) ctx.stroke();
  }
  // a denser core through the first two thirds so the slash has weight
  ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${0.92 * fade})`;
  ribbon(ctx, path, (u) => width(u) * 0.2 * (1 - clamp((u - 0.35) / 0.3)), Math.min(rev, 0.7), 60);
  // paper grain through the ink (like the seal's stamp texture)
  ctx.globalCompositeOperation = 'destination-out';
  const r3 = mulberry(31337);
  for (let i = 0; i < 2600; i++) {
    const u = r3() * rev;
    const [x, y] = path(u, (r3() * 2 - 1) * width(u) * 0.5);
    ctx.fillStyle = `rgba(0,0,0,${0.25 + r3() * 0.6})`;
    ctx.fillRect(x, y, 1 + r3() * 2.5, 1 + r3() * 2.5);
  }
  ctx.globalCompositeOperation = 'source-over';
  // splatter thrown off the stroke where the brush hit hardest
  const r2 = mulberry(99);
  for (let i = 0; i < 70; i++) {
    const u = r2() * rev;
    const side = r2() < 0.5 ? -1 : 1;
    const d = width(u) * 0.5 + 6 + Math.pow(r2(), 2.2) * 120;
    const [x, y] = path(u, side * d);
    const r = 1 + Math.pow(r2(), 3) * 9;
    ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${(0.6 + r2() * 0.4) * fade})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + r2() * 0.5), r2() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function ribbon(
  ctx: CanvasRenderingContext2D,
  path: (u: number, off: number) => number[],
  half: (u: number) => number,
  rev: number,
  M: number,
) {
  ctx.beginPath();
  for (let i = 0; i <= M; i++) {
    const u = (i / M) * rev;
    const [x, y] = path(u, -half(u));
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  for (let i = M; i >= 0; i--) {
    const u = (i / M) * rev;
    const [x, y] = path(u, half(u));
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}
