// The loaded brush: ink on washi. A stroke is a centreline, a pressure profile along it, and a brush of bristles.
// Each bristle rides the centreline at its own lateral offset with its own load: centre bristles hold more ink,
// edge bristles run dry first, and speed starves them all, so the stroke breaks into dry-brush streaks (paper
// showing through) as it goes. Every bristle's wet runs are worked out once, when the stroke is made; a frame only
// draws the runs behind the head, so every frame stays a pure function of time. Splatter is keyed to the moment
// the head passes it. (The approach follows the v1 予知 film's brush, rebuilt for ink on paper.)
import { clamp, lerp, smooth, mulberry32, noise1, E } from '../core/math.js';
import { PAPER } from './brand.js';

const DS = 3; // centreline sample spacing, stage px

function sample(pts) {
  // polyline through pts, Chaikin-smoothed twice, resampled every DS px
  let P = pts.map((p) => [p[0], p[1]]);
  for (let k = 0; k < 2; k++) {
    const Q = [P[0]];
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1];
      Q.push([lerp(a[0], b[0], 0.25), lerp(a[1], b[1], 0.25)], [lerp(a[0], b[0], 0.75), lerp(a[1], b[1], 0.75)]);
    }
    Q.push(P[P.length - 1]); P = Q;
  }
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = cum[cum.length - 1], out = [];
  let j = 1;
  for (let s = 0; s <= L; s += DS) {
    while (j < P.length - 1 && cum[j] < s) j++;
    const f = clamp((s - cum[j - 1]) / Math.max(1e-6, cum[j] - cum[j - 1]));
    out.push({ x: lerp(P[j - 1][0], P[j][0], f), y: lerp(P[j - 1][1], P[j][1], f), s });
  }
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 3)], b = out[Math.min(out.length - 1, i + 3)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    out[i].nx = -dy / l; out[i].ny = dx / l;
  }
  return out;
}

// pressure along the stroke (u 0..1): press in hard, carry, lift toward the tail
const PRESS = (u, lift) => {
  const inP = smooth(u / 0.06) * 0.45 + 0.6;
  const body = u < 0.06 ? inP : 1.05 - 0.15 * smooth((u - 0.06) / 0.5);
  return body * (1 - smooth((u - (1 - lift)) / lift) * 0.85);
};

// spec: pts, width, t0, dur, seed, bristles, load (how far a full brush carries, in stroke lengths), dry
// (0..1, how much speed starves the edges), lift (fraction of the stroke spent lifting), ease, col, splat
export function makeStroke(spec) {
  const S = { width: 400, t0: 0, dur: 0.3, seed: 1, bristles: 64, load: 1.3, dry: 0.55, lift: 0.3, ease: E.outCubic, col: PAPER.ink, splat: 16, ...spec };
  const smp = sample(S.pts);
  const n = smp.length, L = smp[n - 1].s || 1;
  const rnd = mulberry32(S.seed * 977 + 13);
  const wid = smp.map((p) => S.width * PRESS(p.s / L, S.lift) * (1 + noise1(p.s * 0.004 + S.seed) * 0.06));
  const br = [];
  for (let k = 0; k < S.bristles; k++) {
    const o = (k / (S.bristles - 1)) * 2 - 1 + (rnd() - 0.5) * (2 / S.bristles);
    const cap = (1 - 0.6 * Math.pow(Math.abs(o), 1.6)) * (0.8 + rnd() * 0.4);
    const ph = rnd() * 100, fr = 0.006 + rnd() * 0.02;
    // the wet runs: ink left = cap - spent; spent grows along the stroke, faster at the edges and with speed
    const runs = []; let on = false, a0 = 0;
    const dens = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = smp[i].s / L;
      const edge = Math.pow(Math.abs(o), 2.2);
      const spent = u / S.load * (1 + S.dry * edge * 2.2) + S.dry * 0.5 * u * u * (0.4 + edge);
      // noise breaks the bristle up: barely in the wet core, more at the edges and toward the tail
      const ink = cap - spent + noise1(smp[i].s * fr + ph) * (0.08 + 0.3 * edge + 0.25 * u) + (u < 0.05 ? 0.4 : 0);
      dens[i] = clamp(ink * 1.6, 0, 1);
      const wet = ink > 0.06;
      if (wet && !on) { on = true; a0 = i; }
      if (!wet && on) { on = false; if (i - a0 > 1) runs.push([a0, i]); }
    }
    if (on) runs.push([a0, n - 1]);
    br.push({ o, ph, runs, dens, lw: (2.9 / S.bristles) * (0.6 + rnd() * 0.8) * (1 - 0.45 * Math.pow(Math.abs(o), 2)) });
  }
  const splat = [];
  for (let i = 0; i < S.splat; i++) {
    const at = 0.15 + rnd() * 0.85, side = rnd() < 0.5 ? -1 : 1;
    splat.push({ at, side, d: 0.55 + rnd() * 0.9, along: (rnd() - 0.3) * 60, r: 2 + rnd() * rnd() * 16 });
  }
  return { S, smp, n, L, wid, br, splat, cache: null };
}

// how far along the stroke the head is at time t (0..1)
export const headU = (st, t) => st.S.ease(clamp((t - st.S.t0) / st.S.dur));

export function drawStroke(c, st, t, o = {}) {
  const u = headU(st, t);
  if (u <= 0) return;
  const done = u >= 1;
  if (done && st.cache && !o.noCache) { c.drawImage(st.cache.cv, st.cache.x, st.cache.y); return; }
  const h = Math.max(1, Math.floor(u * (st.n - 1)));
  const { smp, wid, S } = st;
  const target = done && !o.noCache ? cacheCanvas(st) : null;
  const g = target ? target.ctx : c;
  g.save();
  if (target) g.translate(-target.x, -target.y);
  g.lineCap = 'butt'; g.lineJoin = 'round';
  // bleed: a soft, low halo where the brush was wettest (the first two thirds)
  g.strokeStyle = S.col; g.globalAlpha = 0.035;
  for (const k of [1.06, 1.02]) {
    g.lineWidth = 0; g.beginPath();
    for (let i = 0; i <= Math.min(h, Math.floor(st.n * 0.7)); i += 2) {
      const p = smp[i]; i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y);
    }
    g.lineWidth = S.width * k * 0.92; g.stroke();
  }
  // bristles
  for (const b of st.br) {
    for (const [a, z] of b.runs) {
      if (a > h) break;
      const e = Math.min(z, h);
      if (z - a < 5 && Math.abs(b.o) > 0.5) continue; // no stubby bricks at the dry edges
      // a run's density varies; draw it in two or three chunks so pigment varies along it
      const step = Math.max(4, Math.floor((e - a) / 5));
      for (let s0 = a; s0 < e; s0 += step) {
        const s1 = Math.min(e, s0 + step);
        const mid = (s0 + s1) >> 1;
        // a run thins and fades at both ends: the bristle touching down and lifting off
        const endK = Math.min(1, (s0 - a) / 10 + 0.45, (z - s1) / 10 + 0.45);
        g.globalAlpha = (0.42 + 0.58 * b.dens[mid] * (0.85 + 0.15 * noise1(mid * 0.05 + b.ph))) * (0.5 + 0.5 * endK);
        g.lineWidth = Math.max(1, wid[mid] * b.lw * (0.5 + 0.5 * endK));
        g.beginPath();
        for (let i = s0; i <= s1; i++) {
          const p = smp[i], w = wid[i] / 2;
          const oo = b.o + noise1(p.s * 0.0025 + b.ph) * 0.012; // bristles wander, they're not rails
          const x = p.x + p.nx * oo * w, y = p.y + p.ny * oo * w;
          i === s0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
    }
  }
  // the loaded head: a full, round press where the brush is now (only while moving)
  // (no drawn head: the bristles' own leading edge is the head)
  // splatter, flung as the head passes
  g.fillStyle = S.col;
  for (const d of st.splat) {
    if (d.at > u) continue;
    const i = Math.floor(d.at * (st.n - 1)), p = smp[i], w = wid[i] / 2;
    g.globalAlpha = 0.9;
    g.beginPath(); g.arc(p.x + p.nx * d.side * w * (1 + d.d) + (smp[Math.min(st.n - 1, i + 3)].x - p.x) * d.along / 9, p.y + p.ny * d.side * w * (1 + d.d), d.r, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  if (target) { st.cache = target; c.drawImage(target.cv, target.x, target.y); }
}

function cacheCanvas(st) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  st.smp.forEach((p, i) => { const w = st.wid[i] * 1.4 + 40; x0 = Math.min(x0, p.x - w); y0 = Math.min(y0, p.y - w); x1 = Math.max(x1, p.x + w); y1 = Math.max(y1, p.y + w); });
  x0 = Math.floor(x0); y0 = Math.floor(y0);
  const cv = document.createElement('canvas'); cv.width = Math.ceil(x1 - x0); cv.height = Math.ceil(y1 - y0);
  return { cv, ctx: cv.getContext('2d'), x: x0, y: y0 };
}
