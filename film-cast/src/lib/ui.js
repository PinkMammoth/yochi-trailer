// Game UI rebuilt from the reference screens at full resolution: the versus band, the HYPE chart, the arcade
// timer, the UP / DOWN pick buttons, the ink flood that turns paper into sumi.
import { SUMI, PAPER, F } from './brand.js';
import { clamp, lerp, E, mulberry32, noise1 } from '../core/math.js';
import { text, label, measure, seal, stampSeal } from './draw.js';

// ------------------------------------------------------------------------------------------ ink flood
// A drop falls to (cx, cy) by t0, then floods outward with a ragged, wet edge. p = time since impact.
export function inkFlood(c, R, cx, cy, t, t0, o = {}) {
  const col = o.color || SUMI.bg;
  const fall = 0.16;
  if (t < t0 - fall) return 0;
  c.save(); c.fillStyle = col;
  if (t < t0) {
    const u = E.inQuad((t - (t0 - fall)) / fall);
    const y = lerp(-80, cy, u);
    c.beginPath(); c.ellipse(cx, y, 22, 22 + 40 * u, 0, 0, Math.PI * 2); c.fill();
    c.restore(); return 0;
  }
  const p = t - t0;
  const maxR = Math.hypot(R.VW, R.VH) * 1.05;
  const r = maxR * E.outExpo(clamp(p / (o.dur || 0.42))) + 30;
  c.beginPath();
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const n = noise1(a * 5 + 3.1) * 0.08 + noise1(a * 17 + 9.7) * 0.035 + noise1(a * 41) * 0.012;
    const rr = r * (1 + n * (1 - clamp(p / 0.6) * 0.5));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath(); c.fill();
  // flung drops ahead of the edge
  const rnd = mulberry32(o.seed || 21);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = r * (1.08 + rnd() * 0.35), s = 4 + rnd() * 16;
    c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  return clamp(r / maxR);
}

// ------------------------------------------------------------------------------------------ candles
export function makeCandles(seed, n, start = 41.6, vol = 0.035, drift = 0.004) {
  const rnd = mulberry32(seed); const out = []; let p = start;
  for (let i = 0; i < n; i++) {
    const o = p; const ch = (rnd() - 0.5) * 2 * vol + drift; const cl = o + ch;
    const hi = Math.max(o, cl) + rnd() * vol * 0.6, lo = Math.min(o, cl) - rnd() * vol * 0.6;
    out.push({ o, c: cl, h: hi, l: lo }); p = cl;
  }
  return out;
}
// HYPE chart panel. live: { o, c, h, l } for the candle in progress (or null). strike: price.
export function chart(c, x, y, w, h, o) {
  const G = o.ground === 'paper' ? PAPER : SUMI;
  c.save();
  c.fillStyle = G.s1; c.fillRect(x, y, w, h);
  c.strokeStyle = G.line; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  const pad = 40;
  text(c, 'HYPE', x + pad, y + 70, { font: F.dela(40), color: G.ink });
  const hw = measure(c, 'HYPE', F.dela(40)) + 22;
  text(c, o.price.toFixed(2), x + pad + hw, y + 70, { font: F.mono(42, 700), color: G.ink });
  const d = o.price - o.strike;
  text(c, (d >= 0 ? '+' : '') + d.toFixed(2), x + pad + hw + measure(c, o.price.toFixed(2), F.mono(42, 700)) + 18, y + 70, { font: F.mono(26, 700), color: d >= 0 ? G.up : G.down });
  label(c, o.caption || '1-MINUTE CANDLES · HYPERCORE ORACLE', x + w - pad, y + 64, { size: 18, color: G.muted, align: 'right' });
  const cx0 = x + pad, cx1 = x + w - pad - 110, cy0 = y + 120, cy1 = y + h - 50;
  const all = o.live ? [...o.candles, o.live] : o.candles;
  let lo = Infinity, hi = -Infinity;
  for (const k of all) { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); }
  lo = Math.min(lo, o.strike) - 0.02; hi = Math.max(hi, o.strike) + 0.02;
  if (o.range) { lo = o.range[0]; hi = o.range[1]; }
  const Y = (p) => lerp(cy1, cy0, (p - lo) / (hi - lo));
  // grid
  c.strokeStyle = G.line; c.lineWidth = 1;
  for (let i = 0; i < 4; i++) { const yy = lerp(cy0, cy1, i / 3); c.beginPath(); c.moveTo(cx0, yy); c.lineTo(x + w - pad, yy); c.stroke(); }
  const n = o.slots || all.length + 1;
  const step = (cx1 - cx0) / n, bw = step * 0.56;
  all.forEach((k, i) => {
    const xx = cx0 + step * (i + 0.5);
    const up = k.c >= k.o; c.fillStyle = up ? G.up : G.down; c.strokeStyle = c.fillStyle; c.lineWidth = Math.max(2, step * 0.09);
    c.beginPath(); c.moveTo(xx, Y(k.h)); c.lineTo(xx, Y(k.l)); c.stroke();
    const y0 = Y(Math.max(k.o, k.c)), y1 = Y(Math.min(k.o, k.c));
    c.fillRect(xx - bw / 2, y0, bw, Math.max(3, y1 - y0));
  });
  // strike line and tag
  const sy = Y(o.strike);
  c.strokeStyle = G.ink; c.globalAlpha = 0.75; c.lineWidth = 2.5; c.setLineDash([10, 8]);
  c.beginPath(); c.moveTo(cx0, sy); c.lineTo(x + w - pad - 100, sy); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  c.fillStyle = G.ink; c.fillRect(x + w - pad - 96, sy - 20, 96, 40);
  text(c, o.strike.toFixed(2), x + w - pad - 48, sy + 9, { font: F.mono(22, 700), color: G.bg, align: 'center' });
  if (o.live && o.liveBox !== false) {
    const xx = cx0 + step * (all.length - 0.5);
    c.strokeStyle = G.ink; c.globalAlpha = 0.5; c.setLineDash([6, 6]); c.lineWidth = 2;
    c.strokeRect(xx - step * 0.6, cy0 - 10, step * 1.2, cy1 - cy0 + 20); c.setLineDash([]); c.globalAlpha = 1;
    label(c, 'NEXT', xx, cy1 + 36, { size: 16, color: G.muted, align: 'center' });
  }
  c.restore();
  return { Y, cx0, step, sy };
}

// ------------------------------------------------------------------------------------------ timer
export function timer(c, x, y, w, h, sec, drain, o = {}) {
  const G = SUMI;
  c.save();
  c.fillStyle = G.s1; c.fillRect(x, y, w, h);
  c.strokeStyle = G.line; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  label(c, 'PICKS LOCK IN', x + 34, y + 52, { size: 20, color: G.muted });
  text(c, `0:${String(sec).padStart(2, '0')}`, x + 30, y + h - 62, { font: F.dela(o.size || 150), color: G.ink, track: 4 });
  c.fillStyle = 'rgba(239,231,216,0.12)'; c.fillRect(x + 34, y + h - 40, w - 68, 12);
  c.fillStyle = G.red; c.fillRect(x + 34, y + h - 40, (w - 68) * clamp(drain), 12);
  c.restore();
}

// ------------------------------------------------------------------------------------------ pick buttons
// side: 'UP' or 'DOWN' picked (by you). lockT: when the 決 stamps.
export function pickButtons(c, x, y, w, h, t, picked, lockT) {
  const G = SUMI; const gap = 22; const bw = (w - gap) / 2;
  const sel = picked && t >= lockT;
  [['UP', G.up, '▲'], ['DOWN', G.down, '▼']].forEach(([nm, col, arrow], i) => {
    const bx = x + i * (bw + gap);
    const on = sel && picked === nm;
    c.save();
    if (on) { c.fillStyle = G.red; c.fillRect(bx + 8, y + 10, bw, h); }
    c.fillStyle = on ? G.band : G.bg; c.fillRect(bx, y, bw, h);
    c.strokeStyle = on ? G.band : G.ink; c.lineWidth = 3; c.strokeRect(bx + 1.5, y + 1.5, bw - 3, h - 3);
    // arrow triangle
    c.fillStyle = col; c.beginPath();
    const ax = bx + bw / 2, ay = y + h * 0.32, s = h * 0.13;
    if (nm === 'UP') { c.moveTo(ax - s, ay + s * 0.8); c.lineTo(ax + s, ay + s * 0.8); c.lineTo(ax, ay - s * 0.8); }
    else { c.moveTo(ax - s, ay - s * 0.8); c.lineTo(ax + s, ay - s * 0.8); c.lineTo(ax, ay + s * 0.8); }
    c.fill();
    text(c, nm, ax, y + h * 0.8, { font: F.dela(h * 0.3), color: on ? PAPER.ink : G.ink, align: 'center', maxW: bw - 30 });
    c.restore();
  });
  if (picked) {
    const i = picked === 'UP' ? 0 : 1; const bx = x + i * (bw + gap);
    stampSeal(c, '決', bx + bw - 14, y + 8, 96, t, lockT, { tone: 'red', rest: 8, seed: 9 });
  }
}

// ------------------------------------------------------------------------------------------ versus band
// The paper band across the frame, the vermilion slash (the scene's one skew) in the middle carrying 対.
// The fighters are drawn by the caller (they break the band's top edge).
export function versusBand(c, R, y, h, o) {
  const { VW } = R;
  const G = SUMI;
  c.save();
  c.fillStyle = G.band; c.fillRect(0, y, VW, h);
  // slash
  const cx = VW / 2 + (o.slashX || 0), sw = o.slashW || 250, sk = h * 0.42;
  c.fillStyle = G.red;
  c.beginPath(); c.moveTo(cx - sw / 2 + sk, y); c.lineTo(cx + sw / 2 + sk, y); c.lineTo(cx + sw / 2 - sk, y + h); c.lineTo(cx - sw / 2 - sk, y + h); c.closePath(); c.fill();
  if (o.glyph !== false) text(c, '対', cx, y + h * 0.5 + h * 0.2, { font: F.glyph(h * 0.58), color: G.onRed, align: 'center' });
  if (o.round) label(c, o.round, cx, y + h * 0.17, { size: Math.round(h * 0.075), color: G.onRed, align: 'center', track: 6 });
  if (o.score) label(c, o.score, cx, y + h * 0.92, { size: Math.round(h * 0.07), color: G.onRed, align: 'center', track: 6 });
  c.restore();
}
