// The vermilion slash: the brand's one skewed element (once per scene). A procedural loaded-brush stroke:
// bristles that run dry toward the tail, a dense core, paper grain through the ink, splatter. It's revealed over
// a few frames ending on the hit, then the ink soaks in (lighter, never gone). Output space.
import { PAPER, SUMI, rgb, type Ground } from './brand';
import { clamp, easeOut, hash, mulberry, type SlashSpec } from './shot';

export function slashPoints(spec: SlashSpec, W: number, H: number) {
  return { P0: { x: spec.from[0] * W, y: spec.from[1] * H }, P1: { x: spec.to[0] * W, y: spec.to[1] * H } };
}
export const slashCenter = (spec: SlashSpec): [number, number] => [(spec.from[0] + spec.to[0]) / 2, (spec.from[1] + spec.to[1]) / 2];

export function drawSlash(ctx: CanvasRenderingContext2D, spec: SlashSpec, f: number, hitFrame: number, W: number, H: number, ground: Ground) {
  const reveal = spec.reveal ?? 4;
  const rev = easeOut((f - (hitFrame - reveal + 2)) / reveal);
  if (rev <= 0) return;
  const unit = Math.min(W, H) / 1080;
  const INK = rgb(spec.tone === 'ink' ? (ground === 'paper' ? PAPER.ink : SUMI.ink) : ground === 'paper' ? PAPER.red : SUMI.red);
  const age = Math.max(0, (f - hitFrame) / 30);
  const fade = 1 - 0.35 * clamp(age / 1.4);
  const { P0, P1 } = slashPoints(spec, W, H);
  const dx = P1.x - P0.x, dy = P1.y - P0.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const bowK = len / 1270;
  const path = (u: number, off: number) => {
    const bow = (Math.sin(u * Math.PI) * 38 + Math.sin(u * Math.PI * 2) * 10) * bowK;
    return [P0.x + dx * u + nx * (bow + off), P0.y + dy * u + ny * (bow + off)];
  };
  const maxW = (spec.width ?? 170) * unit;
  const width = (u: number) =>
    maxW * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, 0.15 + u * 1.5))) * (1 - 0.8 * Math.pow(u, 1.6)) * (0.6 + 0.4 * clamp(u / 0.05));
  const col = (a: number, k = 1) => `rgba(${Math.round(INK[0] * k)},${Math.round(INK[1] * k)},${Math.round(INK[2] * k)},${a})`;
  const ribbon = (half: (u: number) => number, r: number, M: number) => {
    ctx.beginPath();
    for (let i = 0; i <= M; i++) {
      const [x, y] = path((i / M) * r, -half((i / M) * r));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    for (let i = M; i >= 0; i--) {
      const [x, y] = path((i / M) * r, half((i / M) * r));
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.fillStyle = col(0.07 * fade);
  ribbon((u) => width(u) * 0.56, rev, 70);
  const rnd = mulberry(1234);
  const steps = 110;
  for (let k = 0; k < 150; k++) {
    const side = rnd() * 2 - 1;
    const lw = (1.5 + rnd() * 4.5) * unit;
    const uEnd = 1 - Math.abs(side) * (0.25 + rnd() * 0.5) - rnd() * 0.1;
    const dryStart = 0.12 + rnd() * 0.5;
    const shade = 0.82 + rnd() * 0.3;
    ctx.strokeStyle = col((0.65 + rnd() * 0.35) * fade, shade);
    ctx.lineWidth = lw;
    let drawing = false;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * Math.min(rev, uEnd);
      const [x, y] = path(u, side * width(u) * 0.5 + (hash(k * 13.1 + i * 0.37) - 0.5) * 2.2 * unit);
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
  ctx.fillStyle = col(0.92 * fade);
  ribbon((u) => width(u) * 0.2 * (1 - clamp((u - 0.35) / 0.3)), Math.min(rev, 0.7), 60);
  ctx.globalCompositeOperation = 'destination-out';
  const r3 = mulberry(31337);
  for (let i = 0; i < 2600; i++) {
    const u = r3() * rev;
    const [x, y] = path(u, (r3() * 2 - 1) * width(u) * 0.5);
    ctx.fillStyle = `rgba(0,0,0,${0.25 + r3() * 0.6})`;
    ctx.fillRect(x, y, (1 + r3() * 2.5) * unit, (1 + r3() * 2.5) * unit);
  }
  ctx.globalCompositeOperation = 'source-over';
  const r2 = mulberry(99);
  for (let i = 0; i < 70; i++) {
    const u = r2() * rev;
    const side = r2() < 0.5 ? -1 : 1;
    const [x, y] = path(u, side * (width(u) * 0.5 + 6 * unit + Math.pow(r2(), 2.2) * 120 * unit));
    const r = (1 + Math.pow(r2(), 3) * 9) * unit;
    ctx.fillStyle = col((0.6 + r2() * 0.4) * fade);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + r2() * 0.5), r2() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
