// The vermilion slash along a curve (a quadratic Bezier from P0 through the pull of C to P1), for a strike that
// launches from the blade and arcs into the target. Same loaded-brush construction as yochi-2p5d's drawSlash
// (dense core, dry bristles running out toward the tail, paper grain through the ink, splatter), plus a broad
// loaded core so it reads as one enormous stroke. Revealed from P0 over `reveal` frames ending on the hit.
import { PAPER, SUMI } from './brand';
import { clamp, easeOut, hash, mulberry } from './motion';

export type P2 = [number, number];
const rgbOf = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export function curveSlash(ctx: CanvasRenderingContext2D, P0: P2, C: P2, P1: P2, f: number, hitFrame: number, opts: { width: number; reveal: number; ground: 'paper' | 'sumi'; unit?: number; soak?: number }) {
  const rev = easeOut((f - (hitFrame - opts.reveal)) / opts.reveal);
  if (rev <= 0) return;
  const unit = opts.unit ?? 1;
  const INK = rgbOf(opts.ground === 'paper' ? PAPER.red : SUMI.red);
  const age = Math.max(0, (f - hitFrame) / 60);
  const fade = (1 - 0.32 * clamp(age / 1.6)) * (opts.soak ?? 1);
  const B = (u: number): P2 => {
    const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    return [a * P0[0] + b * C[0] + c * P1[0], a * P0[1] + b * C[1] + c * P1[1]];
  };
  const N = (u: number): P2 => {
    const dx = 2 * (1 - u) * (C[0] - P0[0]) + 2 * u * (P1[0] - C[0]);
    const dy = 2 * (1 - u) * (C[1] - P0[1]) + 2 * u * (P1[1] - C[1]);
    const L = Math.hypot(dx, dy) || 1;
    return [-dy / L, dx / L];
  };
  const path = (u: number, off: number): P2 => { const p = B(u), n = N(u); return [p[0] + n[0] * off, p[1] + n[1] * off]; };
  const maxW = opts.width * unit;
  // thin at the blade, swelling, then running dry
  const width = (u: number) => maxW * (0.18 + 0.82 * Math.sin(Math.PI * Math.min(1, 0.08 + u * 0.95))) * (1 - 0.55 * Math.pow(u, 2));
  const col = (a: number, k = 1) => `rgba(${Math.round(INK[0] * k)},${Math.round(INK[1] * k)},${Math.round(INK[2] * k)},${a})`;
  const ribbon = (half: (u: number) => number, r: number, M: number) => {
    ctx.beginPath();
    for (let i = 0; i <= M; i++) { const u = (i / M) * r; const [x, y] = path(u, -half(u)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let i = M; i >= 0; i--) { const u = (i / M) * r; const [x, y] = path(u, half(u)); ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill();
  };
  ctx.save();
  ctx.lineCap = 'round';
  // the loaded core
  ctx.fillStyle = col(0.93 * fade);
  ribbon((u) => width(u) * 0.3 * (1 - 0.5 * clamp((u - 0.55) / 0.4)) + (hash(Math.floor(u * 90)) - 0.5) * 3 * unit, rev, 90);
  ctx.fillStyle = col(0.08 * fade);
  ribbon((u) => width(u) * 0.56, rev, 70);
  // bristles
  const rnd = mulberry(1234);
  const steps = 120;
  for (let k = 0; k < 190; k++) {
    const side = rnd() * 2 - 1;
    const lw = (1.5 + rnd() * 5) * unit;
    const uEnd = 1 - Math.abs(side) * (0.2 + rnd() * 0.5) - rnd() * 0.08;
    const dryStart = 0.15 + rnd() * 0.5;
    ctx.strokeStyle = col((0.65 + rnd() * 0.35) * fade, 0.82 + rnd() * 0.3);
    ctx.lineWidth = lw;
    let on = false;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * Math.min(rev, uEnd);
      const [x, y] = path(u, side * width(u) * 0.5 + (hash(k * 13.1 + i * 0.37) - 0.5) * 2.2 * unit);
      const dry = u > dryStart && hash(k * 7.7 + Math.floor(u * 45)) < (u - dryStart) * 2.6;
      if (dry) { if (on) ctx.stroke(); on = false; ctx.beginPath(); continue; }
      on ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      on = true;
    }
    if (on) ctx.stroke();
  }
  // paper grain through the ink
  ctx.globalCompositeOperation = 'destination-out';
  const r3 = mulberry(31337);
  for (let i = 0; i < 3200; i++) {
    const u = r3() * rev; const [x, y] = path(u, (r3() * 2 - 1) * width(u) * 0.5);
    ctx.fillStyle = `rgba(0,0,0,${0.25 + r3() * 0.6})`;
    ctx.fillRect(x, y, (1 + r3() * 2.5) * unit, (1 + r3() * 2.5) * unit);
  }
  ctx.globalCompositeOperation = 'source-over';
  const r2 = mulberry(99);
  for (let i = 0; i < 90; i++) {
    const u = r2() * rev; const side = r2() < 0.5 ? -1 : 1;
    const [x, y] = path(u, side * (width(u) * 0.5 + 6 * unit + Math.pow(r2(), 2.2) * 140 * unit));
    const r = (1 + Math.pow(r2(), 3) * 10) * unit;
    ctx.fillStyle = col((0.6 + r2() * 0.4) * fade);
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.6 + r2() * 0.5), r2() * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
/** the stroke's point at u (for placing the contact burst) */
export const curveAt = (P0: P2, C: P2, P1: P2, u: number): P2 => {
  const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
  return [a * P0[0] + b * C[0] + c * P1[0], a * P0[1] + b * C[1] + c * P1[1]];
};
