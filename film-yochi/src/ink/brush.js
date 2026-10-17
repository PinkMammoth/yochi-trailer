// The procedural brush: the craft centre of the film.
//
// A stroke is a centreline (control points through a centripetal Catmull-Rom spline), a pressure
// profile along it, and a brush of N bristles. Each bristle rides the centreline at its own lateral
// offset and carries its own ink: centre bristles hold more, edge bristles run dry first, speed
// starves them all. Where a bristle runs out it leaves paper showing through (飛白, dry brush).
// Every bristle's wet runs are worked out once, so drawing a stroke at any moment is only "draw the
// runs up to the head". Splatter and drips are precomputed from the same stroke and keyed to the
// time the brush passes them, so every frame stays a pure function of time.
//
// Colours are always mixed against the void explicitly (opaque) rather than with alpha, so bristle
// runs never double up where they overlap; the shader adds paper and bleed afterwards.
import { clamp, lerp, smooth, rngFrom, noise1, fbm1, E, TAU } from '../core/math.js';

export const VOID = [7, 6, 12];
export const CYAN = [24, 224, 255];
export const WHITE = [245, 243, 255];
export const GREEN = [57, 255, 20];
export const RED = [255, 56, 96];

const DS = 1.6; // centreline sample spacing, stage px

export const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
export const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// ink of colour `col` at density a (0..1) on the void, with `hot` lifting dense ink toward white
export function inkColor(col, a, hot = 0) {
  const c = hot > 0 ? mix3(col, WHITE, clamp(hot)) : col;
  return mix3(VOID, c, clamp(a));
}

// Centripetal Catmull-Rom through pts, resampled by arc length every DS px.
export function samplePath(pts) {
  if (pts.length === 2) pts = [pts[0], [lerp(pts[0][0], pts[1][0], 0.5), lerp(pts[0][1], pts[1][1], 0.5)], pts[1]];
  const P = [[2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]], ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]]];
  const dense = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const d = (a, b) => Math.max(1e-4, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5));
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    const seg = Math.max(8, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2));
    for (let k = 0; k < seg; k++) {
      const t = lerp(t1, t2, k / seg);
      const pt = [0, 1].map((j) => {
        const A1 = ((t1 - t) * p0[j] + (t - t0) * p1[j]) / (t1 - t0);
        const A2 = ((t2 - t) * p1[j] + (t - t1) * p2[j]) / (t2 - t1);
        const A3 = ((t3 - t) * p2[j] + (t - t2) * p3[j]) / (t3 - t2);
        const B1 = ((t2 - t) * A1 + (t - t0) * A2) / (t2 - t0);
        const B2 = ((t3 - t) * A2 + (t - t1) * A3) / (t3 - t1);
        return ((t2 - t) * B1 + (t - t1) * B2) / (t2 - t1);
      });
      dense.push(pt);
    }
  }
  dense.push(pts[pts.length - 1]);
  // resample by arc length: sample i sits at s = i * DS
  const cum = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = cum[cum.length - 1];
  const out = [];
  let j = 1;
  for (let s = 0; s <= total; s += DS) {
    while (j < dense.length - 1 && cum[j] < s) j++;
    const f = clamp((s - cum[j - 1]) / Math.max(1e-6, cum[j] - cum[j - 1]));
    out.push({ x: lerp(dense[j - 1][0], dense[j][0], f), y: lerp(dense[j - 1][1], dense[j][1], f), s });
  }
  if (total - out[out.length - 1].s > 0.3) { const l = dense[dense.length - 1]; out.push({ x: l[0], y: l[1], s: total }); }
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 2)], b = out[Math.min(out.length - 1, i + 2)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    out[i].tx = dx / l; out[i].ty = dy / l; out[i].nx = -dy / l; out[i].ny = dx / l;
  }
  return out;
}

// piecewise-smooth profile [[u, v], ...]
export function profile(ks, u) {
  if (u <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (u <= ks[i][0]) {
      const [u0, v0] = ks[i - 1], [u1, v1] = ks[i];
      return lerp(v0, v1, smooth((u - u0) / Math.max(1e-6, u1 - u0)));
    }
  }
  return ks[ks.length - 1][1];
}

// Brush-pressure presets (u = 0..1 along the stroke)
export const PROFILES = {
  // touch down with a press, carry, stop with a slight press and a rounded end (止め)
  tome: [[0, 0.35], [0.03, 1.08], [0.1, 0.92], [0.8, 0.88], [0.93, 1.02], [0.985, 0.75], [1, 0.3]],
  // press, carry, then a long lifting sweep to a point (払い)
  harai: [[0, 0.4], [0.04, 1.1], [0.14, 0.95], [0.45, 0.85], [0.82, 0.4], [1, 0.02]],
  // dot: a press that swells and lifts (点)
  dot: [[0, 0.25], [0.25, 0.85], [0.7, 1.1], [0.92, 0.8], [1, 0.25]],
  // flat, even line
  even: [[0, 0.45], [0.04, 1], [0.96, 1], [1, 0.5]],
  // a thin stroke that thickens at its end (a candle closing hard)
  slash: [[0, 0.15], [0.12, 0.7], [0.55, 1.0], [0.9, 1.05], [1, 0.55]],
  // hook (跳ね): carry, gather at the turn, then flick to a point; `hookAt` sets the turn
  hane: (at) => [[0, 0.4], [0.04, 1.06], [0.12, 0.92], [at - 0.06, 0.9], [at, 1.08], [at + (1 - at) * 0.35, 0.6], [1, 0.02]],
};

// Build a stroke. spec:
//   pts, width, prof (array or PROFILES key), seed, bristles, load (ink), dry (speed starvation),
//   reach (px a full brush carries), col, hot (white core), wet (underlayer), t0, t1, ease,
//   splatter: { amount, spread, size }, drips: { n, len, width, delay, dur }, glow
export function makeStroke(spec) {
  const S = {
    width: 40, prof: 'tome', seed: 1, bristles: 0, load: 1, dry: 0.4, reach: 0, col: CYAN, hot: 0.35,
    wet: 0.5, t0: 0, t1: 1, ease: E.inOutSine, splatter: null, drips: null, glow: 0.12, jitter: 1,
    startSkew: 0.45,
  };
  for (const k in spec) if (spec[k] !== undefined) S[k] = spec[k];
  const smp = S.samples || samplePath(S.pts);
  const L = smp[smp.length - 1].s || 1;
  const prof = typeof S.prof === 'string' ? PROFILES[S.prof] : S.prof;
  const rnd = rngFrom('stroke', S.seed);
  const nSeed = rnd() * 1000;
  // width along the stroke
  for (const p of smp) {
    const u = p.s / L;
    p.u = u;
    p.w = Math.max(0.4, S.width * profile(prof, u) * (1 + 0.07 * fbm1(p.s / 70 + nSeed, 2)));
  }
  // speed along the stroke (px/s), from the ease
  const dur = Math.max(1e-3, S.t1 - S.t0);
  const N = 240; const speedAtU = new Float32Array(N + 1);
  {
    // invert the ease numerically: for each u bucket, the slope du/dtau there
    let prevU = 0;
    for (let k = 1; k <= 1200; k++) {
      const tau = k / 1200; const u = S.ease(tau);
      const du = (u - prevU) * 1200; prevU = u;
      const b = Math.min(N, Math.floor(u * N));
      speedAtU[b] = Math.max(speedAtU[b], du * L / dur);
    }
    for (let b = 1; b <= N; b++) if (!speedAtU[b]) speedAtU[b] = speedAtU[b - 1];
  }
  const vRef = 2400; // px/s considered "fast"
  for (const p of smp) p.v = speedAtU[Math.min(N, Math.floor(p.u * N))] / vRef;

  const reach = S.reach || 2600 * S.load;
  const nb = S.bristles || Math.round(clamp(S.width * 0.9, 10, 64));
  const bristles = [];
  // bristles clump: neighbours share ink, so a drying brush breaks into streaks of different widths
  const nClumps = Math.max(3, Math.round(nb / 4));
  const clumps = [];
  for (let k = 0; k < nClumps; k++) clumps.push({ seed: rnd() * 1000, cap: 0.85 + rnd() * 0.35 });
  for (let j = 0; j < nb; j++) {
    const o = (j / (nb - 1)) * 2 - 1 + (rnd() - 0.5) * (2 / nb) * 1.4;
    const edge = Math.abs(o);
    const cl = clumps[Math.min(nClumps - 1, Math.floor(((o + 1) / 2) * nClumps + (rnd() - 0.5) * 0.6))] || clumps[0];
    bristles.push({
      o: clamp(o, -1.02, 1.02), cl,
      cap: (1.12 - 0.5 * edge * edge) * cl.cap * (0.92 + rnd() * 0.16),
      thick: 1.5 + rnd() * 0.9,
      tone: 0.72 + rnd() * 0.28,
      seed: rnd() * 1000,
      wob: rnd() * 1000,
      lag: (Math.abs(o) ** 2 * 0.45 + rnd() * 0.2) * S.width,  // the moving front: centre bristles lead
      // ragged, angled entry: bristles touch down at slightly different points
      sIn: S.startSkew * S.width * (0.5 + 0.5 * o) * (0.6 + rnd() * 0.8) + rnd() * 2,
      // rounded end: outer bristles lift a little earlier
      sOut: (1 - Math.sqrt(Math.max(0, 1 - Math.min(1, edge) ** 2))) * S.width * 0.35 + rnd() * 2.5,
    });
  }
  // per bristle: its wet runs, chunked so width and tone can change along it
  const CH = 8;
  for (const b of bristles) {
    b.chunks = [];
    let cur = null;
    for (let i = 0; i < smp.length; i++) {
      const p = smp[i];
      let on = p.s >= b.sIn && p.s <= L - b.sOut;
      let ink = 0;
      if (on) {
        ink = b.cap - (p.s / reach) * (0.45 + 0.8 * b.o * b.o)
          - S.dry * Math.min(1.4, Math.max(0, p.v - 0.15)) * (0.7 + 0.5 * Math.abs(b.o)) * (0.3 + 0.7 * p.u)
          + 0.42 * noise1(p.s / 55 + b.cl.seed) + 0.2 * noise1(p.s / 17 + b.cl.seed * 2.3) + 0.1 * noise1(p.s / 8 + b.seed);
        on = ink > 0.04;
      }
      if (on) {
        if (!cur || i - cur.i0 >= CH) {
          if (cur) b.chunks.push(cur);
          cur = { i0: cur && cur.i1 === i - 1 ? i - 1 : i, i1: i, w: 0, ink: 0, n: 0 };
        }
        cur.i1 = i; cur.w += p.w; cur.ink += ink; cur.n++;
      } else if (cur) { b.chunks.push(cur); cur = null; }
    }
    if (cur) b.chunks.push(cur);
    for (const c of b.chunks) { c.w /= c.n; c.ink /= c.n; }
  }
  // the wet body under the bristles: mean ink along the stroke
  const body = [];
  const bIn = Math.min(smp.length - 2, Math.ceil((S.startSkew * S.width * 0.75 + S.width * 0.15) / DS));
  const bOut = Math.max(bIn + 1, smp.length - 1 - Math.ceil((S.width * 0.25) / DS));
  for (let i0 = bIn; i0 < bOut; i0 += CH) {
    const i1 = Math.min(bOut, i0 + CH);
    let w = 0, ink = 0;
    for (let i = i0; i <= i1; i++) {
      w += smp[i].w;
      ink += 1.05 - smp[i].s / reach * 0.7 - S.dry * Math.min(1.4, Math.max(0, smp[i].v - 0.15)) * 0.55 * (0.3 + 0.7 * smp[i].u);
    }
    const n = i1 - i0 + 1;
    body.push({ i0, i1, w: w / n, ink: clamp(ink / n) });
  }
  const st = { S, smp, L, bristles, body, tAt: null };
  // time at which the brush passes arc length s (inverse of the ease)
  const tab = new Float32Array(401);
  for (let k = 0; k <= 400; k++) tab[k] = S.ease(k / 400);
  st.timeAtU = (u) => {
    let lo = 0, hi = 400;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m] < u) lo = m; else hi = m; }
    const f = (u - tab[lo]) / Math.max(1e-6, tab[hi] - tab[lo]);
    return S.t0 + dur * (lo + clamp(f)) / 400;
  };
  if (S.splatter) st.drops = makeSplatter(st, S.splatter);
  if (S.drips) st.drips = makeDrips(st, S.drips);
  return st;
}

function expo(r) { return -Math.log(1 - r * 0.999); }

function makeSplatter(st, o) {
  const { smp, S } = st;
  const rnd = rngFrom('splat', S.seed);
  const drops = [];
  const amount = o.amount ?? 1, spread = o.spread ?? 1, size = o.size ?? 1;
  for (let i = 0; i < smp.length; i += 4) {
    const p = smp[i];
    const v = p.v * (o.boost ?? 1);
    // curvature: throw to the outside of turns
    const a = smp[Math.max(0, i - 12)], c = smp[Math.min(smp.length - 1, i + 12)];
    const turn = a.tx * c.ty - a.ty * c.tx;
    const prob = amount * Math.max(0, v - 0.3) * 0.12 + amount * Math.abs(turn) * 0.35 * v;
    if (rnd() > prob) continue;
    let side = Math.abs(turn) > 0.08 ? -Math.sign(turn) : (rnd() < 0.5 ? -1 : 1);
    if (rnd() < 0.25) side = -side;
    const k = 1 + Math.floor(rnd() * 2);
    for (let q = 0; q < k; q++) {
      const dist = p.w * 0.45 + expo(rnd()) * (14 + 90 * v) * spread;
      const fwd = (rnd() * 1.4 - 0.2) * (30 + 110 * v) * spread;
      const dx = p.nx * side * dist + p.tx * fwd, dy = p.ny * side * dist + p.ty * fwd;
      const r = (0.5 + 5.5 * Math.pow(rnd(), 5) * (0.6 + v)) * size;
      drops.push({
        x: p.x + dx, y: p.y + dy, r,
        ang: Math.atan2(dy, dx), el: 1 + Math.min(2.2, (0.3 + 1.2 * v) * rnd() * (r < 2.5 ? 1.4 : 0.5)),
        t: st.timeAtU(p.u) + 0.03 + dist / 1400, t0: st.timeAtU(p.u), ox: p.x + p.nx * side * p.w * 0.4, oy: p.y + p.ny * side * p.w * 0.4,
        hot: rnd(), sat: r > 2.2 ? Math.floor(rnd() * 4) : 0, ss: rnd() * 100,
      });
    }
  }
  // touch-down spray at the start of a hard stroke
  if (o.impact) {
    const p = smp[Math.min(smp.length - 1, 6)];
    for (let q = 0; q < o.impact; q++) {
      const ang = rnd() * TAU; const dist = p.w * 0.5 + expo(rnd()) * 40 * spread;
      const r = (0.6 + 4.5 * Math.pow(rnd(), 4)) * size;
      drops.push({ x: p.x + Math.cos(ang) * dist, y: p.y + Math.sin(ang) * dist, r, ang, el: 1 + rnd() * 1.5,
        t: S.t0 + 0.01 + dist / 4000, hot: rnd(), sat: 0, ss: rnd() * 100 });
    }
  }
  // keep type clear: no drops land inside the avoid rects
  if (o.avoid) return drops.filter((d) => !o.avoid.some(([x0, y0, x1, y1]) => d.x > x0 && d.x < x1 && d.y > y0 && d.y < y1));
  return drops;
}

function makeDrips(st, o) {
  const { smp, S } = st;
  const rnd = rngFrom('drip', S.seed);
  const out = [];
  const n = o.n ?? 5;
  const lo = o.from ?? 0.15, hi = o.to ?? 0.95;
  for (let k = 0; k < n; k++) {
    const u = lerp(lo, hi, (k + 0.2 + rnd() * 0.6) / n);
    const i = Math.min(smp.length - 1, Math.floor(u * (smp.length - 1)));
    const p = smp[i];
    // leave from the lower edge of the stroke
    const side = p.ny >= 0 ? 1 : -1;
    const across = (rnd() * 0.8 - 0.1);
    out.push({
      x: p.x + p.nx * side * p.w * 0.5 * across, y: p.y + p.ny * side * p.w * 0.5 * across,
      w: (o.width ?? 6) * (0.45 + rnd() * 0.8),
      len: (o.len ?? 160) * (0.3 + Math.pow(rnd(), 0.7) * 0.9),
      t: st.timeAtU(p.u) + (o.delay ?? 0.08) + rnd() * 0.25,
      dur: (o.dur ?? 1.1) * (0.6 + rnd() * 0.8), seed: rnd() * 100,
    });
  }
  return out;
}

// progress (0..1 of arc length) of a stroke at time t
export function strokeU(st, t) {
  const { S } = st;
  if (t <= S.t0) return 0;
  if (t >= S.t1) return 1;
  return clamp(S.ease((t - S.t0) / (S.t1 - S.t0)));
}

// Draw a stroke at time t into the base (b) and glow (g) contexts.
// o: { fade (0..1 multiplies ink density), uMax (cut the stroke at this progress), col override }
export function drawStroke(R, st, t, o = {}) {
  const { b, g } = R;
  const { S, smp, bristles, body } = st;
  const u = o.u ?? strokeU(st, t);
  if (u <= 0) return;
  const fade = o.fade ?? 1;
  if (fade <= 0.002) return;
  const col = o.col || S.col;
  const sHead = u * st.L;
  const iHead = Math.min(smp.length - 1, Math.floor(sHead / DS));
  const iTail = Math.floor(((o.u0 ?? 0) * st.L) / DS);   // retracting: ink before this is gone
  if (iTail >= iHead) return;
  const hot = S.hot * (o.hotK ?? 1);
  b.lineJoin = 'round'; b.lineCap = 'butt';
  // wet body under the bristles
  if (S.wet > 0) {
    for (const c of body) {
      if (c.i0 > iHead) break;
      if (c.i1 < iTail) continue;
      const i1 = Math.min(c.i1, iHead);
      if (i1 <= c.i0) continue;
      const wd = S.wet * clamp(c.ink * 1.6 - 0.6) * 0.6 * fade;
      if (wd < 0.01) continue;
      b.strokeStyle = css(inkColor(col, wd, hot * 0.2));
      b.lineWidth = c.w * 0.9;
      b.beginPath(); b.moveTo(smp[c.i0].x, smp[c.i0].y);
      for (let i = c.i0 + 1; i <= i1; i++) b.lineTo(smp[i].x, smp[i].y);
      b.stroke();
    }
  }
  // bristles (round ends, so dry streaks taper off instead of stopping square)
  b.lineCap = 'round';
  for (const br of bristles) {
    const iH = u < 1 ? Math.max(0, iHead - Math.round(br.lag * clamp(smp[iHead].w / S.width) / DS)) : iHead;
    for (const c of br.chunks) {
      if (c.i0 > iH) break;
      if (c.i1 < iTail) continue;
      const i1 = Math.min(c.i1, iH);
      if (i1 <= c.i0) continue;
      const dens = clamp(0.38 + 0.75 * c.ink) * br.tone * fade;
      b.strokeStyle = css(inkColor(col, dens, hot * clamp((c.ink - 0.55) * 1.8) * (1 - 0.7 * br.o * br.o)));
      b.lineWidth = Math.max(0.7, (c.w / bristles.length) * br.thick);
      b.beginPath();
      for (let i = c.i0; i <= i1; i++) {
        const p = smp[i];
        const off = (br.o + 0.035 * noise1(p.s / 50 + br.wob) + br.o * br.o * 0.06 * noise1(p.s / 6 + br.wob * 2)) * p.w * 0.5;
        const x = p.x + p.nx * off, y = p.y + p.ny * off;
        if (i === c.i0) b.moveTo(x, y); else b.lineTo(x, y);
      }
      b.stroke();
    }
  }
  // the loaded head while the brush is moving
  if (u < 1 && (o.head ?? true) && smp[iHead].v < 0.6) {
    const p = smp[iHead];
    const r = p.w * 0.5;
    b.fillStyle = css(inkColor(col, fade * 0.95, hot * 0.9));
    b.beginPath(); b.ellipse(p.x - p.tx * r * 0.15, p.y - p.ty * r * 0.15, r * 0.62, r * 0.98, Math.atan2(p.ty, p.tx), 0, TAU); b.fill();
  }
  // glow: a soft emissive core for bloom (restrained)
  if (S.glow > 0 && g) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const c of body) {
      if (c.i0 > iHead) break;
      if (c.i1 < iTail) continue;
      const i1 = Math.min(c.i1, iHead);
      if (i1 <= c.i0) continue;
      g.strokeStyle = css(col.map((v) => v * S.glow * c.ink * fade));
      g.lineWidth = c.w * 0.7;
      g.beginPath(); g.moveTo(smp[c.i0].x, smp[c.i0].y);
      for (let i = c.i0 + 1; i <= i1; i++) g.lineTo(smp[i].x, smp[i].y);
      g.stroke();
    }
  }
  if (st.drops) drawDrops(R, st, t, col, fade * (1 - (o.u0 ?? 0)), o.dropFade ?? 1);
  if (st.drips) drawDrips(R, st, t, col, fade);
}

// A drop of ink: a blob with a ragged rim, a tail in the direction it was travelling and, for the
// bigger ones, a line of satellites thrown on beyond it.
function blob(b, x, y, r, ang, el, ss, tail) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const nv = 10 + Math.min(14, Math.floor(r * 2));
  b.beginPath();
  for (let k = 0; k <= nv; k++) {
    const th = (k / nv) * TAU;
    let rr = r * (1 + 0.3 * noise1(ss + k * 0.9) + 0.16 * noise1(ss * 2 + k * 2.7));
    // the tail: the rim pulled out to a point ahead of the drop
    const ahead = Math.max(0, Math.cos(th));
    rr *= 1 + tail * Math.pow(ahead, 6);
    const lx = Math.cos(th) * rr * el, ly = Math.sin(th) * rr * (1 - 0.6 * Math.pow(ahead, 3) * Math.min(1, tail));
    const px = x + lx * ca - ly * sa, py = y + lx * sa + ly * ca;
    if (k) b.lineTo(px, py); else b.moveTo(px, py);
  }
  b.closePath(); b.fill();
}
function drawDrops(R, st, t, col, fade, dropFade) {
  const { b } = R;
  for (const d of st.drops) {
    if (d.t0 !== undefined && t >= d.t0 && t < d.t) {
      // in flight: a tadpole leaving the brush, its tail pointing back the way it came
      const f = (t - d.t0) / (d.t - d.t0);
      const x = d.ox + (d.x - d.ox) * f, y = d.oy + (d.y - d.oy) * f;
      b.fillStyle = css(inkColor(col, 0.85 * fade * dropFade, 0.4));
      blob(b, x, y, d.r * 0.8, d.ang + Math.PI, 1, d.ss, 2.5 + 3 * (1 - f));
      continue;
    }
    if (t < d.t) continue;
    const age = t - d.t;
    const soak = 0.8 + 0.2 * smooth(age / 0.12);
    const r = d.r * soak;
    const dens = clamp(0.55 + d.r * 0.12) * fade * dropFade;
    b.fillStyle = css(inkColor(col, dens, d.hot * 0.5 * clamp(d.r / 4)));
    if (r < 1.2) { b.beginPath(); b.arc(d.x, d.y, r, 0, TAU); b.fill(); }
    else blob(b, d.x, d.y, r, d.ang, Math.min(1.5, d.el), d.ss, (d.el - 1) * 1.6);
    for (let k = 1; k <= d.sat; k++) {
      const dd = r * d.el * (1.8 + k * 1.5 + Math.sin(d.ss + k) * 0.6);
      const rr = r * (0.38 - k * 0.07);
      if (rr <= 0.3) break;
      b.beginPath(); b.arc(d.x + Math.cos(d.ang) * dd, d.y + Math.sin(d.ang) * dd, rr, 0, TAU); b.fill();
    }
  }
}

function drawDrips(R, st, t, col, fade) {
  const { b } = R;
  for (const d of st.drips) {
    if (t < d.t) continue;
    const k = 1 - Math.exp(-(t - d.t) / (d.dur * 0.45));
    const len = d.len * k;
    if (len < 1) continue;
    const steps = Math.max(4, Math.ceil(len / 10));
    b.fillStyle = css(inkColor(col, 0.92 * fade, 0.15));
    b.beginPath();
    const L = [], Rt = [];
    for (let s = 0; s <= steps; s++) {
      const f = s / steps; const y = d.y + f * len;
      const x = d.x + noise1(d.seed + f * len / 40) * 2.5 * f;
      const w = d.w * (1 - 0.45 * f) * 0.5;
      L.push([x - w, y]); Rt.push([x + w, y]);
    }
    b.moveTo(L[0][0] - d.w * 0.3, L[0][1] - d.w * 0.5);
    for (const p of L) b.lineTo(p[0], p[1]);
    for (let s = Rt.length - 1; s >= 0; s--) b.lineTo(Rt[s][0], Rt[s][1]);
    b.lineTo(Rt[0][0] + d.w * 0.3, Rt[0][1] - d.w * 0.5);
    b.closePath(); b.fill();
    // the bead at the end, swelling as it slows
    const end = L[L.length - 1];
    const bx = (end[0] + Rt[Rt.length - 1][0]) / 2;
    b.beginPath(); b.ellipse(bx, end[1] + d.w * 0.25, d.w * (0.42 + 0.12 * k), d.w * (0.5 + 0.2 * k), 0, 0, TAU); b.fill();
  }
}

// The ghost: the future, drawn thin and faint, barely touching the paper.
export function drawGhost(R, smp, u0, u1, o = {}) {
  const { b, g } = R;
  if (u1 <= u0) return;
  const L = smp[smp.length - 1].s;
  const i0 = Math.floor((u0 * L) / DS), i1 = Math.min(smp.length - 1, Math.floor((u1 * L) / DS));
  if (i1 <= i0) return;
  const a = o.alpha ?? 1;
  const col = o.col || WHITE;
  const path = () => { const c = new Path2D(); c.moveTo(smp[i0].x, smp[i0].y); for (let i = i0 + 1; i <= i1; i++) c.lineTo(smp[i].x, smp[i].y); return c; };
  const p = path();
  b.lineJoin = 'round'; b.lineCap = 'round';
  b.strokeStyle = css(inkColor(CYAN, 0.16 * a)); b.lineWidth = o.aura ?? 14; b.stroke(p);
  b.strokeStyle = css(inkColor(col, 0.62 * a)); b.lineWidth = o.width ?? 2.6; b.stroke(p);
  // a fine broken second hair beside it, so it reads as a brush hair rather than a vector line
  b.strokeStyle = css(inkColor(CYAN, 0.45 * a)); b.lineWidth = 1.1;
  b.beginPath();
  let pen = false;
  for (let i = i0; i <= i1; i++) {
    const q = smp[i];
    const on = noise1(q.s / 18 + 4.2) > -0.25;
    const off = 3.2 + 1.5 * noise1(q.s / 60);
    const x = q.x + q.nx * off, y = q.y + q.ny * off;
    if (on && !pen) { b.moveTo(x, y); pen = true; } else if (on) b.lineTo(x, y); else pen = false;
  }
  b.stroke();
  if (g) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = css(CYAN.map((v) => v * 0.5 * a)); g.lineWidth = 6; g.stroke(p);
  }
  // the moving tip glints
  if (o.tip !== false && u1 < 0.999) {
    const q = smp[i1];
    b.fillStyle = css(inkColor(WHITE, 0.9 * a));
    b.beginPath(); b.arc(q.x, q.y, 3.4, 0, TAU); b.fill();
    if (g) { g.fillStyle = css(CYAN.map((v) => v * 0.9 * a)); g.beginPath(); g.arc(q.x, q.y, 9, 0, TAU); g.fill(); }
  }
}

// point on a sampled path at progress u
export function pointAt(smp, u) {
  const L = smp[smp.length - 1].s;
  const i = Math.min(smp.length - 1, Math.max(0, Math.floor((clamp(u) * L) / DS)));
  return smp[i];
}
