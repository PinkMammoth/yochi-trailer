// Ink in flight: particles that lift ink off one place and carry it to where the brush is writing.
// Each particle knows its source, its target and the moment the target is written, so its whole
// flight is a function of time.
import { rngFrom, clamp, lerp, E, noise1 } from '../core/math.js';
import { css, inkColor, CYAN, WHITE } from './brush.js';

// n random points inside the ink of a stroke (sampled across its width)
export function inkPoints(st, n, seed, col) {
  const rnd = rngFrom('pts', seed);
  const out = [];
  for (let k = 0; k < n; k++) {
    const p = st.smp[Math.floor(rnd() * st.smp.length)];
    const o = (rnd() * 2 - 1) * (p.w ?? 4) * 0.45;
    out.push({ x: p.x + p.nx * o, y: p.y + p.ny * o, col: col || st.S.col });
  }
  return out;
}
// n points along a stroke, each with the time the brush reaches it
export function writePoints(st, n, seed) {
  const rnd = rngFrom('wpts', seed);
  const out = [];
  for (let k = 0; k < n; k++) {
    const u = (k + rnd()) / n;
    const p = st.smp[Math.min(st.smp.length - 1, Math.floor(u * (st.smp.length - 1)))];
    const o = (rnd() * 2 - 1) * (p.w ?? 4) * 0.4;
    out.push({ x: p.x + p.nx * o, y: p.y + p.ny * o, t: st.timeAtU(u) });
  }
  return out;
}

// sources: [{x, y, col}], targets: [{x, y, t}]; o: { seed, flight: [min, max], depart: [a, b], swirl }
export function makeFlow(sources, targets, o = {}) {
  const rnd = rngFrom('flow', o.seed ?? 1);
  const [fMin, fMax] = o.flight ?? [0.35, 0.9];
  const ps = targets.map((tg) => {
    const s = sources[Math.floor(rnd() * sources.length)];
    let td = tg.t - lerp(fMin, fMax, rnd());
    if (o.depart) td = clamp(td, o.depart[0] + rnd() * 0.15, o.depart[1]);
    const ta = Math.max(td + 0.12, tg.t);
    // curved flight: a control point thrown sideways
    const mx = (s.x + tg.x) / 2, my = (s.y + tg.y) / 2;
    const dx = tg.x - s.x, dy = tg.y - s.y;
    const side = (rnd() - 0.5) * (o.swirl ?? 0.8);
    return { s, tg, td, ta, c1: [s.x + dx * 0.15 - dy * side, s.y + dy * 0.15 + dx * side - (o.lift ?? 60) * rnd()],
      c2: [mx - dy * side * 0.6, my + dx * side * 0.6], r: 0.7 + rnd() * rnd() * 2.6, col: s.col, ph: rnd() * 100 };
  });
  return { ps };
}
function bez(p, u) {
  const a = 1 - u;
  return [a * a * a * p.s.x + 3 * a * a * u * p.c1[0] + 3 * a * u * u * p.c2[0] + u * u * u * p.tg.x,
    a * a * a * p.s.y + 3 * a * a * u * p.c1[1] + 3 * a * u * u * p.c2[1] + u * u * u * p.tg.y];
}
export function drawFlow(R, flow, t, o = {}) {
  const { b, g } = R;
  b.lineCap = 'round'; g.lineCap = 'round';
  for (const p of flow.ps) {
    if (t < p.td || t >= p.ta) continue;
    const u = E.inOutCubic((t - p.td) / (p.ta - p.td));
    const u0 = E.inOutCubic(Math.max(0, (t - 0.014 - p.td) / (p.ta - p.td)));
    const [x, y] = bez(p, u), [x0, y0] = bez(p, u0);
    const a = Math.min(1, u * 5, (1 - u) * 8 + 0.3) * (o.a ?? 1);
    // ink in flight turns to plain ink: cyan, white-hot in the bigger drops
    b.fillStyle = css(inkColor(CYAN, 0.9 * a, 0.25 + 0.35 * (p.r / 4)));
    const ang = Math.atan2(y - y0, x - x0), sp = Math.hypot(x - x0, y - y0);
    b.beginPath(); b.ellipse(x, y, p.r + Math.min(sp * 0.5, p.r * 2.5), p.r, ang, 0, Math.PI * 2); b.fill();
    g.fillStyle = css(CYAN.map((v) => v * 0.3 * a));
    g.beginPath(); g.arc(x, y, p.r * 2.5, 0, Math.PI * 2); g.fill();
  }
}
