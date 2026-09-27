// 2.5D world: camera projection, void/horizon, glass floor, strike line, candle.
import { clamp, lerp, rgba, hexToRgb, mixRgb, noise1 } from '../core/math.js';
import { RGB } from './helmet.js';

const TAU = Math.PI * 2;

export class Cam {
  constructor(o = {}) {
    this.x = o.x ?? 0; this.y = o.y ?? 1.7; this.z = o.z ?? -6;
    this.yaw = o.yaw ?? 0; this.pitch = o.pitch ?? 0; this.roll = o.roll ?? 0;
    this.f = o.f ?? 1150; this.cx = o.cx ?? 960; this.cy = o.cy ?? 540;
    this.sx = o.sx ?? 0; this.sy = o.sy ?? 0; // screen shake offset
    this._c();
  }
  _c() {
    this.cyw = Math.cos(this.yaw); this.syw = Math.sin(this.yaw);
    this.cp = Math.cos(this.pitch); this.sp = Math.sin(this.pitch);
    this.cr = Math.cos(this.roll); this.sr = Math.sin(this.roll);
  }
  // returns [sx, sy, depth, scale] or null when behind camera
  p(x, y, z) {
    const dx = x - this.x, dy = y - this.y, dz = z - this.z;
    const x1 = this.cyw * dx - this.syw * dz;
    const z1 = this.syw * dx + this.cyw * dz;
    const y2 = this.cp * dy - this.sp * z1;
    const z2 = this.sp * dy + this.cp * z1;
    if (z2 < 0.05) return null;
    const k = this.f / z2;
    let X = x1 * k, Y = -y2 * k;
    const Xr = X * this.cr - Y * this.sr, Yr = X * this.sr + Y * this.cr;
    return [this.cx + Xr + this.sx, this.cy + Yr + this.sy, z2, k];
  }
  // screen y of the horizon (for pitch only, ignores roll)
  horizonY() { return this.cy - Math.tan(this.pitch) * this.f + this.sy; }
}

// Void + horizon glow ------------------------------------------------------------
export function drawSky(R, cam, o = {}) {
  const { b, g } = R;
  const hy = cam.horizonY();
  const top = o.top || [7, 6, 12];
  const hor = o.hor || [26, 22, 48];
  b.save();
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  b.translate(960, 540); b.rotate(cam.roll); b.translate(-960, -540);
  const gr = b.createLinearGradient(0, hy - 700, 0, hy + 40);
  gr.addColorStop(0, rgba(top)); gr.addColorStop(0.75, rgba(mixRgb(top, hor, 0.55))); gr.addColorStop(1, rgba(hor));
  b.fillStyle = gr; b.fillRect(-600, hy - 2200, 3120, 2240);
  // horizon light band (the world's cyan backlight)
  const bandK = o.band ?? 1;
  if (bandK > 0) {
    const bandCol = o.bandCol || RGB.cyan;
    const hb = b.createLinearGradient(0, hy - 160, 0, hy + 6);
    hb.addColorStop(0, 'rgba(0,0,0,0)'); hb.addColorStop(1, rgba(bandCol, 0.10 * bandK));
    b.fillStyle = hb; b.fillRect(-600, hy - 160, 3120, 166);
    g.save(); g.setTransform(R.S, 0, 0, R.S, 0, 0); g.translate(960, 540); g.rotate(cam.roll); g.translate(-960, -540);
    const gg = g.createLinearGradient(0, hy - 60, 0, hy + 4);
    gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, rgba(bandCol, 0.10 * bandK));
    g.fillStyle = gg; g.fillRect(-600, hy - 60, 3120, 64);
    g.restore();
  }
  b.restore();
}

// Glass floor below the horizon, with light pools.
export function drawFloor(R, cam, o = {}) {
  const { b } = R;
  const hy = cam.horizonY();
  b.save();
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  b.translate(960, 540); b.rotate(cam.roll); b.translate(-960, -540);
  const near = o.near || [9, 8, 15];
  const far = o.far || [20, 17, 36];
  const gr = b.createLinearGradient(0, hy, 0, hy + 700);
  gr.addColorStop(0, rgba(far)); gr.addColorStop(1, rgba(near));
  b.fillStyle = gr; b.fillRect(-600, hy, 3120, 2400);
  b.restore();
}

// Light pool on the floor around a point (e.g. candle base).
export function floorPool(R, cam, x, z, radius, col, k) {
  const { b, g } = R;
  const c = cam.p(x, 0, z); if (!c) return;
  const e = cam.p(x + radius, 0, z); const n = cam.p(x, 0, z - radius); const fz = cam.p(x, 0, z + radius);
  if (!e) return;
  const rx = Math.abs(e[0] - c[0]);
  const ry = Math.max(4, Math.abs(((n ? n[1] : c[1] + rx * 0.2) - (fz ? fz[1] : c[1] - rx * 0.05))) / 2);
  for (const [ctx, a] of [[b, 0.22], [g, 0.10]]) {
    ctx.save();
    ctx.translate(c[0], c[1]); ctx.scale(1, ry / rx);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, rgba(col, a * k)); gr.addColorStop(0.4, rgba(col, a * k * 0.35)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

// Strike line: dashed cyan line on the floor at depth z, spanning x0..x1.
export function strikeLine(R, cam, z, x0, x1, o = {}) {
  const { b, g } = R;
  const col = o.col || RGB.cyan;
  const k = o.k ?? 1;
  const N = 90;
  const dash = o.dash ?? 0.55;
  const phase = o.phase || 0;
  const pts = [];
  for (let i = 0; i <= N; i++) { const x = lerp(x0, x1, i / N); const p = cam.p(x, o.y || 0, z); pts.push(p); }
  const w = o.width || 3;
  for (const [ctx, a, lw] of [[b, 0.95, w], [g, 0.8, w * 2.2]]) {
    ctx.strokeStyle = rgba(col, a * k); ctx.lineWidth = lw; ctx.lineCap = 'butt';
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const u = ((i / N) * (x1 - x0) * 0.7 + phase) % 1;
      if (u > dash) continue;
      const p0 = pts[i], p1 = pts[i + 1];
      if (!p0 || !p1) continue;
      ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
    }
    ctx.stroke();
  }
}

// Candle: an LED segment meter standing on the strike line (the floor).
// Up candles stack segments out of the floor; down candles sink through the glass.
// o: { x, z, close (world units, +up), hi, lo, w, col, k, emit, seg (pitch), reflect, flat }
export function drawCandle(R, cam, o) {
  const { b, g } = R;
  const w = o.w ?? 2.6;
  const col = typeof o.col === 'string' ? hexToRgb(o.col) : (o.col || [240, 250, 255]);
  const k = o.k ?? 1;
  const pitch = o.seg ?? 0.42, gap = pitch * 0.2;
  const p = o.close;
  const hot = [lerp(col[0], 255, 0.6), lerp(col[1], 255, 0.6), lerp(col[2], 255, 0.6)];
  const pF = cam.p(o.x, 0, o.z);
  if (!pF) return null;
  const sc = pF[3];
  const hw = (w / 2) * sc;
  const X = pF[0];
  const Yat = (y) => { const q = cam.p(o.x, y, o.z); return q ? q[1] : pF[1] - y * sc; };
  // wicks: dotted
  const hi = o.hi ?? Math.max(0, p), lo = o.lo ?? Math.min(0, p);
  const dotS = Math.max(1.6, 0.075 * sc);
  const drawDots = (y0, y1) => {
    const n = Math.floor(Math.abs(y1 - y0) / (pitch * 0.5));
    for (let i = 0; i <= n; i++) {
      const yy = Yat(lerp(y0, y1, n ? i / n : 0));
      const under = (lerp(y0, y1, n ? i / n : 0)) < 0;
      const al = (under ? 0.45 : 0.85) * k;
      b.fillStyle = rgba(hot, al); b.fillRect(X - dotS / 2, yy - dotS / 2, dotS, dotS);
      g.fillStyle = rgba(col, al * 0.8); g.fillRect(X - dotS, yy - dotS, dotS * 2, dotS * 2);
    }
  };
  if (hi > Math.max(0, p) + 0.05) drawDots(Math.max(0, p) + pitch * 0.3, hi);
  if (lo < Math.min(0, p) - 0.05) drawDots(Math.min(0, p) - pitch * 0.3, lo);
  // segments
  const n = Math.abs(p) / pitch;
  const full = Math.floor(n), frac = n - full;
  const dir = p >= 0 ? 1 : -1;
  const segs = full + (frac > 0.02 ? 1 : 0);
  let topY = pF[1], botY = pF[1];
  for (let i = 0; i < segs; i++) {
    const y0 = dir * (i * pitch + gap / 2), y1 = dir * ((i + 1) * pitch - gap / 2);
    const a = i < full ? 1 : frac;
    const under = dir < 0;
    const Y0 = Yat(y0), Y1 = Yat(y1);
    const top = Math.min(Y0, Y1), h = Math.abs(Y1 - Y0);
    topY = Math.min(topY, top); botY = Math.max(botY, top + h);
    const al = a * k * (under ? 0.62 : 1);
    const gr = b.createLinearGradient(X - hw, 0, X + hw, 0);
    gr.addColorStop(0, rgba(col, 0.85 * al)); gr.addColorStop(0.5, rgba(hot, al)); gr.addColorStop(1, rgba(col, 0.85 * al));
    b.fillStyle = gr; b.fillRect(X - hw, top, hw * 2, h);
    g.fillStyle = rgba(col, 0.9 * al); g.fillRect(X - hw * 1.06, top - h * 0.06, hw * 2.12, h * 1.12);
  }
  // flat: the body collapses onto the line as a single bright slit
  if (o.flat) {
    const fh = Math.max(2, 0.06 * sc);
    b.fillStyle = rgba(hot, k); b.fillRect(X - hw, pF[1] - fh, hw * 2, fh * 2);
    g.fillStyle = rgba(col, k); g.fillRect(X - hw * 1.1, pF[1] - fh * 2, hw * 2.2, fh * 4);
  }
  // soft emission column
  const e = o.emit ?? 1;
  if (e > 0 && segs > 0) {
    const eg = g.createLinearGradient(X - hw * 5, 0, X + hw * 5, 0);
    eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(0.5, rgba(col, 0.2 * k * e)); eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg; g.fillRect(X - hw * 5, topY - hw, hw * 10, botY - topY + hw * 2);
  }
  // reflection of the up-body in the glass floor
  if (p > 0 && o.reflect !== false) {
    const hAbove = pF[1] - topY;
    const rg = b.createLinearGradient(0, pF[1], 0, pF[1] + hAbove * 0.8);
    rg.addColorStop(0, rgba(col, 0.28 * k)); rg.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = rg; b.fillRect(X - hw, pF[1] + 2, hw * 2, hAbove * 0.8);
    const rg2 = g.createLinearGradient(0, pF[1], 0, pF[1] + hAbove * 0.5);
    rg2.addColorStop(0, rgba(col, 0.22 * k)); rg2.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg2; g.fillRect(X - hw * 1.4, pF[1] + 2, hw * 2.8, hAbove * 0.5);
  }
  return { x: X, top: Math.min(topY, Yat(hi)), bot: botY, base: pF[1], hw, sc };
}

// Soft light shaft / beam (additive, glow layer).
export function beam(R, x0, y0, x1, y1, w0, w1, col, a) {
  const { g } = R;
  const dx = x1 - x0, dy = y1 - y0; const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(x0 + nx * w0, y0 + ny * w0); g.lineTo(x1 + nx * w1, y1 + ny * w1);
  g.lineTo(x1 - nx * w1, y1 - ny * w1); g.lineTo(x0 - nx * w0, y0 - ny * w0);
  g.closePath(); g.fill();
}

// Floating dust motes in a volume (deterministic).
export function dust(R, cam, t, o = {}) {
  const { b, g } = R;
  const n = o.n || 160;
  const col = o.col || [170, 200, 255];
  for (let i = 0; i < n; i++) {
    const h = (i * 0.618034) % 1, h2 = (i * 0.414214) % 1, h3 = (i * 0.732051) % 1;
    const x = (h - 0.5) * (o.w || 30) + (o.cx || 0) + noise1(i * 3.1 + t * 0.15) * 0.8;
    const z = (o.z0 || 2) + h2 * (o.d || 30);
    const y = 0.2 + h3 * (o.h || 5) + (o.vy ?? 0.05) * t + noise1(i * 7.7 + t * 0.2) * 0.4;
    const p = cam.p(x, y % (o.h || 5), z);
    if (!p) continue;
    const r = Math.max(0.6, 0.018 * p[3]);
    const a = clamp(0.5 - p[2] / 80, 0.05, 0.5) * (o.k ?? 1);
    b.fillStyle = rgba(col, a * 0.7); b.beginPath(); b.arc(p[0], p[1], r, 0, TAU); b.fill();
    if (r > 1.2) { g.fillStyle = rgba(col, a * 0.4); g.beginPath(); g.arc(p[0], p[1], r * 2, 0, TAU); g.fill(); }
  }
}

// 3D LED-segment candle (a square column of stacked segments), readable from any angle.
// o: { x, z, close (world, +up), hi, lo, w, col, k, seg, flat }
export function drawCandleBox(R, cam, o) {
  const { b, g } = R;
  const w = o.w ?? 3.0, hw = w / 2;
  const col = typeof o.col === 'string' ? hexToRgb(o.col) : (o.col || [240, 250, 255]);
  const k = o.k ?? 1;
  const pitch = o.seg ?? 0.5, gap = pitch * 0.18;
  const p = o.close;
  const hot = [lerp(col[0], 255, 0.62), lerp(col[1], 255, 0.62), lerp(col[2], 255, 0.62)];
  const dim = [col[0] * 0.55, col[1] * 0.55, col[2] * 0.55];
  const X = o.x, Z = o.z;
  const quad = (c, pts, style) => {
    if (pts.some((q) => !q)) return;
    c.fillStyle = style; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath(); c.fill();
  };
  const faces = (y0, y1, al, under) => {
    const P = (x, y, z) => cam.p(x, y, z);
    const vis = [];
    if (cam.x > X + hw) vis.push(['+x', [P(X + hw, y0, Z - hw), P(X + hw, y0, Z + hw), P(X + hw, y1, Z + hw), P(X + hw, y1, Z - hw)], 0.8]);
    if (cam.x < X - hw) vis.push(['-x', [P(X - hw, y0, Z + hw), P(X - hw, y0, Z - hw), P(X - hw, y1, Z - hw), P(X - hw, y1, Z + hw)], 0.8]);
    if (cam.z > Z + hw) vis.push(['+z', [P(X - hw, y0, Z + hw), P(X + hw, y0, Z + hw), P(X + hw, y1, Z + hw), P(X - hw, y1, Z + hw)], 1.0]);
    if (cam.z < Z - hw) vis.push(['-z', [P(X + hw, y0, Z - hw), P(X - hw, y0, Z - hw), P(X - hw, y1, Z - hw), P(X + hw, y1, Z - hw)], 1.0]);
    const topY = Math.max(y0, y1), botY = Math.min(y0, y1);
    const u = under ? 0.55 : 1;
    for (const [, pts, sh] of vis) {
      quad(b, pts, rgba([lerp(dim[0], hot[0], sh * 0.8), lerp(dim[1], hot[1], sh * 0.8), lerp(dim[2], hot[2], sh * 0.8)], al * u));
      quad(g, pts, rgba(col, al * 0.8 * u));
    }
    if (cam.y > topY) {
      const pts = [P(X - hw, topY, Z - hw), P(X + hw, topY, Z - hw), P(X + hw, topY, Z + hw), P(X - hw, topY, Z + hw)];
      quad(b, pts, rgba(hot, al * u)); quad(g, pts, rgba(col, al * u));
    } else if (cam.y < botY) {
      const pts = [P(X - hw, botY, Z - hw), P(X + hw, botY, Z - hw), P(X + hw, botY, Z + hw), P(X - hw, botY, Z + hw)];
      quad(b, pts, rgba(hot, al * u)); quad(g, pts, rgba(col, al * u));
    }
  };
  // wicks (dotted), drawn first
  const hi = o.hi ?? Math.max(0, p), lo = o.lo ?? Math.min(0, p);
  const dot = (y) => { const q = cam.p(X, y, Z); if (!q) return; const s = Math.max(1.5, 0.1 * q[3]); b.fillStyle = rgba(hot, 0.85 * k * (y < 0 ? 0.5 : 1)); b.fillRect(q[0] - s / 2, q[1] - s / 2, s, s); g.fillStyle = rgba(col, 0.7 * k); g.fillRect(q[0] - s, q[1] - s, s * 2, s * 2); };
  for (let y = Math.max(0, p) + pitch * 0.4; y < hi; y += pitch * 0.5) dot(y);
  for (let y = Math.min(0, p) - pitch * 0.4; y > lo; y -= pitch * 0.5) dot(y);
  const n = Math.abs(p) / pitch, full = Math.floor(n), frac = n - full;
  const dir = p >= 0 ? 1 : -1;
  const segs = full + (frac > 0.02 ? 1 : 0);
  // draw far-to-near: for up candles seen from above, bottom first
  for (let i = 0; i < segs; i++) {
    const y0 = dir * (i * pitch + gap / 2), y1 = dir * ((i + 1) * pitch - gap / 2);
    faces(y0, y1, (i < full ? 1 : frac) * k, dir < 0);
  }
  if (o.flat || segs === 0) {
    faces(-0.04, 0.04, k * (o.flat ? 1 : 0.6), false);
  }
  return cam.p(X, Math.max(0, p), Z);
}
