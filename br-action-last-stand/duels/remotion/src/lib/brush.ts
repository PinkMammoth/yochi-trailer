// Ink-brush transitions and splatter on a 2D canvas. A broad loaded brush (bristles that run dry toward the
// tail, a dense core, grain) sweeps across the frame; the next shot is revealed behind its trailing edge. The
// strokes are horizontal: the vermilion slash stays the scene's one skewed element. Never used for candles.
import { clamp, easeInOut, hash, mulberry } from './motion';

/** One horizontal broad stroke from x0 to x1 at height y, revealed to fraction `rev`. */
export function broadStroke(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number, width: number, rev: number, col: [number, number, number], seed: number, alpha = 1) {
  if (rev <= 0) return;
  const rnd = mulberry(seed);
  const len = x1 - x0;
  const path = (u: number, off: number) => [x0 + len * u, y + off + Math.sin(u * Math.PI) * width * 0.08 * (rnd() * 0 + 1)];
  const half = (u: number) => width * 0.5 * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, 0.1 + u * 1.2))) * (1 - 0.35 * Math.pow(u, 2));
  const c = (a: number, k = 1) => `rgba(${Math.round(col[0] * k)},${Math.round(col[1] * k)},${Math.round(col[2] * k)},${a * alpha})`;
  // dense core
  ctx.fillStyle = c(0.97);
  ctx.beginPath();
  const M = 60;
  for (let i = 0; i <= M; i++) {
    const u = (i / M) * rev;
    const [x, yy] = path(u, -half(u) * 0.86 + (hash(seed + i * 1.7) - 0.5) * width * 0.05);
    i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  }
  for (let i = M; i >= 0; i--) {
    const u = (i / M) * rev;
    const [x, yy] = path(u, half(u) * 0.86 + (hash(seed * 3 + i * 2.3) - 0.5) * width * 0.05);
    ctx.lineTo(x, yy);
  }
  ctx.closePath();
  ctx.fill();
  // bristles at the edges, running dry toward the tail
  ctx.lineCap = 'round';
  for (let k = 0; k < 90; k++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const off = side * (0.78 + rnd() * 0.3);
    const uEnd = 1 - rnd() * 0.25;
    const dryStart = 0.3 + rnd() * 0.5;
    ctx.strokeStyle = c(0.6 + rnd() * 0.4, 0.9 + rnd() * 0.15);
    ctx.lineWidth = 2 + rnd() * 6;
    ctx.beginPath();
    let on = false;
    for (let i = 0; i <= 50; i++) {
      const u = (i / 50) * Math.min(rev, uEnd);
      const [x, yy] = path(u, off * half(u));
      const dry = u > dryStart && hash(k * 7.7 + Math.floor(u * 40)) < (u - dryStart) * 2.4;
      if (dry) {
        if (on) ctx.stroke();
        on = false;
        ctx.beginPath();
        continue;
      }
      on ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      on = true;
    }
    if (on) ctx.stroke();
  }
  // the leading edge: a ragged, wet head
  const [hx, hy] = path(rev, 0);
  ctx.fillStyle = c(1);
  ctx.beginPath();
  ctx.ellipse(hx, hy, width * 0.09, half(rev) * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * A wipe of stacked broad strokes, staggered top to bottom. p: 0..1 over the transition. Covers the frame by
 * p ~0.5; `hole` (0..1, after 0.5) clears from the left so the next shot shows through the trailing edge.
 */
export function brushWipe(ctx: CanvasRenderingContext2D, W: number, H: number, p: number, col: [number, number, number], seed = 1, bands = 5) {
  if (p <= 0 || p >= 1) return;
  const bh = H / bands;
  for (let b = 0; b < bands; b++) {
    const delay = (b % 2 ? 0.06 : 0) + b * 0.02;
    const rev = easeInOut(clamp((p - delay) / 0.38));
    const dir = b % 2 ? -1 : 1;
    const y = bh * (b + 0.5);
    const x0 = dir > 0 ? -W * 0.15 : W * 1.15;
    const x1 = dir > 0 ? W * 1.15 : -W * 0.15;
    broadStroke(ctx, y, x0, x1, bh * 1.12, rev, col, seed * 31 + b);
  }
  // the clear: from 0.62 (after the cut, which sits at p = 0.6), a ragged edge sweeps left to right, cutting the ink away
  const clr = easeInOut(clamp((p - 0.62) / 0.38));
  if (clr > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    const ex = (yy: number) => clr * W * 1.3 - W * 0.15 + (hash(Math.floor(yy / 23) + seed) - 0.5) * 60 + Math.sin(yy * 0.004 + seed) * 40;
    ctx.moveTo(-10, -10);
    for (let yy = -10; yy <= H + 10; yy += 12) ctx.lineTo(ex(yy), yy);
    ctx.lineTo(-10, H + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Ink splatter: a burst of drops around (x, y), thrown out over `p` (0..1). */
export function splatter(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, p: number, col: string, seed: number, n = 40) {
  if (p <= 0) return;
  const rnd = mulberry(seed);
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.25 + Math.pow(rnd(), 0.6) * 0.95) * clamp(p * 1.6);
    const r = (2 + Math.pow(rnd(), 3) * 16) * (0.6 + 0.4 * clamp(p * 3));
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, r, r * (0.6 + rnd() * 0.5), a, 0, Math.PI * 2);
    ctx.fill();
  }
}
