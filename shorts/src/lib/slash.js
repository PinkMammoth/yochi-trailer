// One sumi brush slash, drawn bristle by bristle: ported from the 2.5D demo (demo-2p5d/remotion/src/shared/slash.ts)
// and parameterised. The method is the same: a bowed centreline, a broad press thinning into a dry tail, 150 bristles
// that run dry from the edges, a dense core, paper grain knocked through the ink, and splatter where it hit hardest.
// Pure function of `rev` (0..1, how much of the stroke is laid down). Stage space.
import { clamp, mulberry32, hash1 } from '../core/math.js';

const hash = (x) => hash1(Math.floor(x * 1000));

// o: { p0:[x,y], p1:[x,y], width, bow, color:[r,g,b], fade (0..1 ink soaked in), seed }
export function drawSlash(ctx, rev, o) {
  if (rev <= 0) return;
  const [x0, y0] = o.p0, [x1, y1] = o.p1;
  const INK = o.color || [255, 84, 54];
  const fade = 1 - 0.35 * clamp(o.fade || 0);
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const bowA = o.bow ?? 38;
  const path = (u, off) => {
    const bow = Math.sin(u * Math.PI) * bowA + Math.sin(u * Math.PI * 2) * bowA * 0.26;
    return [x0 + dx * u + nx * (bow + off), y0 + dy * u + ny * (bow + off)];
  };
  const maxW = o.width || 170;
  const width = (u) => maxW * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, 0.15 + u * 1.5))) * (1 - 0.8 * Math.pow(u, 1.6)) * (0.6 + 0.4 * clamp(u / 0.05));
  const rnd = mulberry32(o.seed || 1234);
  const N = 150, steps = 110;
  const rgba = (k, a) => `rgba(${Math.round(INK[0] * k)},${Math.round(INK[1] * k)},${Math.round(INK[2] * k)},${a})`;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.07 * fade; ctx.fillStyle = rgba(1, 1);
  ribbon(ctx, path, (u) => width(u) * 0.56, rev, 70);
  ctx.globalAlpha = 1;
  for (let k = 0; k < N; k++) {
    const side = rnd() * 2 - 1, lw = 1.5 + rnd() * 4.5;
    const uEnd = 1 - Math.abs(side) * (0.25 + rnd() * 0.5) - rnd() * 0.1;
    const dryStart = 0.12 + rnd() * 0.5, shade = 0.82 + rnd() * 0.3, a0 = (0.65 + rnd() * 0.35) * fade;
    ctx.strokeStyle = rgba(shade, a0); ctx.lineWidth = lw;
    let drawing = false; ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * Math.min(rev, uEnd);
      const w = width(u), jitter = (hash(k * 13.1 + i * 0.37) - 0.5) * 2.2;
      const [x, y] = path(u, side * w * 0.5 + jitter);
      const dry = u > dryStart && hash(k * 7.7 + Math.floor(u * 45)) < (u - dryStart) * 2.6;
      if (dry) { if (drawing) ctx.stroke(); drawing = false; ctx.beginPath(); continue; }
      if (!drawing) { ctx.moveTo(x, y); drawing = true; } else ctx.lineTo(x, y);
    }
    if (drawing) ctx.stroke();
  }
  ctx.fillStyle = rgba(1, 0.92 * fade);
  ribbon(ctx, path, (u) => width(u) * 0.2 * (1 - clamp((u - 0.35) / 0.3)), Math.min(rev, 0.7), 60);
  // paper grain through the ink. destination-out would punch through everything already on this canvas, so the
  // grain is drawn in the ground colour instead
  const r3 = mulberry32(31337);
  ctx.fillStyle = o.ground || '#0f0d0b';
  for (let i = 0; i < 2600; i++) {
    const u = r3() * rev; const [x, y] = path(u, (r3() * 2 - 1) * width(u) * 0.5);
    ctx.globalAlpha = (0.25 + r3() * 0.6) * 0.55; ctx.fillRect(x, y, 1 + r3() * 2.5, 1 + r3() * 2.5);
  }
  ctx.globalAlpha = 1;
  const r2 = mulberry32(99);
  for (let i = 0; i < 70; i++) {
    const u = r2() * rev, side = r2() < 0.5 ? -1 : 1;
    const d = width(u) * 0.5 + 6 + Math.pow(r2(), 2.2) * 120;
    const [x, y] = path(u, side * d); const r = 1 + Math.pow(r2(), 3) * 9;
    ctx.fillStyle = rgba(1, (0.6 + r2() * 0.4) * fade);
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.6 + r2() * 0.5), r2() * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  return path;
}

function ribbon(ctx, path, half, rev, M) {
  ctx.beginPath();
  for (let i = 0; i <= M; i++) { const u = (i / M) * rev; const [x, y] = path(u, -half(u)); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  for (let i = M; i >= 0; i--) { const u = (i / M) * rev; const [x, y] = path(u, half(u)); ctx.lineTo(x, y); }
  ctx.closePath(); ctx.fill();
}

// The manga impact frame from the demo's shader, on the canvas: a paper-tinted ink negative of the whole frame.
// Bright becomes ink, dark becomes paper (smoothstep 0.42..0.52 on luma).
export function inkNegative(ctx, W, H) {
  const im = ctx.getImageData(0, 0, W, H), d = im.data;
  const P = [241, 236, 224], K = [22, 19, 15];
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    let t = clamp((l - 0.42) / 0.1); t = t * t * (3 - 2 * t);
    d[i] = P[0] + (K[0] - P[0]) * t; d[i + 1] = P[1] + (K[1] - P[1]) * t; d[i + 2] = P[2] + (K[2] - P[2]) * t;
  }
  ctx.putImageData(im, 0, 0);
}
