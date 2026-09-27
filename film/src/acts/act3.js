// ACT III — THE ROYALE (31.837 → 44.718)
// Eight platforms around one candle. Wrong call: the floor goes. 8 → 5 → 3 → 2 → 1.
import { clamp, lerp, E, noise1, shake, pulse, env, rgba, hash1, fbm1 } from '../core/math.js';
import { M, BEAT, BAR, bar } from '../core/music.js';
import { drawHelmet, RGB, C } from '../elements/helmet.js';
import { drawPlayer, blendPose } from '../elements/body.js';
import { Cam, drawSky, drawFloor, floorPool, strikeLine, drawCandleBox } from '../elements/world.js';
import { drawCrowd, drawCrowdTop } from '../elements/crowd.js';
import { bigWord, F, label, money, chatBubble, nameTag, fmtUSDC } from '../elements/type.js';
import { bokeh, stream, shockwave, confetti, speedLines } from '../elements/fx.js';
import { world, CAST, CANDLE_Z, PEARL, CS } from './common.js';

const WHITE = RGB.text;
export const BR_CAST = [
  { ...CAST.you },
  { ...CAST.oxtom },
  { name: 'DEANO', type: 'horns', shell: [78, 52, 58], accent: C.gold },
  { ...CAST.soup },
  { name: 'MIRA', type: 'cat', shell: [70, 60, 104], accent: C.cyan },
  { name: 'RAJ_HL', type: 'fin', shell: [56, 64, 90], accent: C.faint },
  { ...CAST.cope },
  { name: 'THEO', type: 'frog', shell: [52, 70, 60], accent: C.green },
];
// rounds: pick time, resolve time, outcome, picks per player (by index)
export const ROUNDS = [
  { pick: bar(17) + 0.2, res: bar(18) - 0.46, out: 1, picks: [1, 1, 1, 1, 1, -1, -1, -1] },
  { pick: 34.35, res: bar(19), out: -1, picks: [-1, 1, -1, -1, 1] },
  { pick: bar(20), res: bar(21), out: 1, picks: [1, 0, 1, -1, 0] },
  { pick: bar(22), res: bar(24), out: 1, picks: [1, 0, -1, 0, 0] },
];
// elimination time per player (Infinity = survives)
export function elimTime(i) {
  let alive = true, t = Infinity;
  for (const r of ROUNDS) { if (!alive) break; const p = r.picks[i]; if (p !== undefined && p !== 0 && p !== r.out) { t = r.res; alive = false; } }
  return t;
}
export function aliveAt(t) { let n = 0; for (let i = 0; i < 8; i++) if (t < elimTime(i)) n++; return n; }
function roundAt(t) { for (const r of ROUNDS) if (t < r.res + 0.9) return r; return ROUNDS[ROUNDS.length - 1]; }
export function pickAt(i, t) { const r = roundAt(t); if (t < r.pick + (i * 0.05)) return 0; return r.picks[i] ?? 0; }

export const BR_R = 4.7;           // platform ring radius
const HEX_R = 1.05, PLAT_H = 2.2;
export function platPos(i) { const a = -Math.PI / 2 + (i / 8) * Math.PI * 2 + 0.2; return [Math.cos(a) * BR_R, CANDLE_Z + Math.sin(a) * BR_R, a]; }

export function brPrice(t) {
  const r = roundAt(t);
  const start = r === ROUNDS[0] ? M.DROP2 + 0.9 : ROUNDS[ROUNDS.indexOf(r) - 1].res + 0.2;
  if (t >= r.res) return r.out * (1.6 + 0.4 * E.outExpo((t - r.res) / 0.3));
  const u = clamp((t - start) / (r.res - start));
  return fbm1(t * 2.2 + ROUNDS.indexOf(r) * 7, 3) * 1.4 * (0.4 + u) + r.out * E.inQuad(u) * 0.4;
}

// hex prism platform, glassy with neon edges; y offset for dropping
function drawPlatform(R, cam, x, z, drop, col, o = {}) {
  const { b, g } = R;
  const top = PLAT_H - drop, bot = -drop;
  const pts = (y) => Array.from({ length: 6 }, (_, k) => { const a = k * Math.PI / 3 + (o.rot || 0); return cam.p(x + Math.cos(a) * HEX_R, y, z + Math.sin(a) * HEX_R); });
  const T = pts(top), B = pts(Math.max(bot, -6));
  if (T.some((p) => !p) || B.some((p) => !p)) return null;
  const under = drop > PLAT_H ? clamp((drop - PLAT_H) / 3) : 0;
  const a = (o.k ?? 1) * (1 - under * 0.85);
  const hot = [lerp(col[0], 255, 0.55), lerp(col[1], 255, 0.55), lerp(col[2], 255, 0.55)];
  // side faces facing the camera
  for (let k = 0; k < 6; k++) {
    const k2 = (k + 1) % 6;
    const ang = (k + 0.5) * Math.PI / 3 + (o.rot || 0);
    const nx = Math.cos(ang), nz = Math.sin(ang);
    const vx = cam.x - (x + nx * HEX_R), vz = cam.z - (z + nz * HEX_R);
    if (nx * vx + nz * vz <= 0) continue;
    const f = [T[k], T[k2], B[k2], B[k]];
    b.fillStyle = rgba([col[0] * 0.14 + 10, col[1] * 0.14 + 8, col[2] * 0.14 + 16], 0.96 * a);
    b.beginPath(); f.forEach((p, i) => (i ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1]))); b.closePath(); b.fill();
    b.strokeStyle = rgba(hot, 0.8 * a); b.lineWidth = Math.max(1, 0.03 * T[k][3]); b.stroke();
    g.strokeStyle = rgba(col, 0.6 * a); g.lineWidth = Math.max(2, 0.07 * T[k][3]); g.stroke();
  }
  if (cam.y > top) {
    b.fillStyle = rgba([col[0] * 0.3 + 14, col[1] * 0.3 + 12, col[2] * 0.3 + 22], 0.98 * a);
    b.beginPath(); T.forEach((p, i) => (i ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1]))); b.closePath(); b.fill();
    b.strokeStyle = rgba(hot, a); b.lineWidth = Math.max(1.2, 0.04 * T[0][3]); b.stroke();
    g.strokeStyle = rgba(col, 0.9 * a); g.lineWidth = Math.max(2, 0.1 * T[0][3]); g.stroke();
  }
  return cam.p(x, top, z);
}

// Full BR arena. opts: { t, show: (i)=>bool, crowdK }
export function drawBR(R, cam, t, o = {}) {
  const { crowd } = world();
  const p = o.price ?? brPrice(t);
  const col = p > 0.05 ? RGB.green : p < -0.05 ? RGB.red : [235, 245, 255];
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.1 });
  drawFloor(R, cam);
  floorPool(R, cam, 0, CANDLE_Z, 9 + Math.abs(p) * 2, col, 1.3);
  strikeLine(R, cam, CANDLE_Z, -40, 40, { phase: t * 0.3 });
  if (o.crowd !== false) {
    drawCrowd(R, cam, crowd, (m) => (m.hero || m.rival || m.rad < 8.5 ? { hide: true } : { eyes: 'wide', led: WHITE, ledI: 0.45, look: 0.3 }),
      { lit: [90, 100, 150], fogCol: [24, 20, 46], fogNear: 6, fogFar: 40, near: 3, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.4 } });
  }
  // order platforms far to near
  const order = [...Array(8).keys()].sort((a, c) => {
    const [ax, az] = platPos(a), [cx, cz] = platPos(c);
    return Math.hypot(cx - cam.x, cz - cam.z) - Math.hypot(ax - cam.x, az - cam.z);
  });
  const heads = [];
  let candleDrawn = false;
  const dCandle = Math.hypot(cam.x, cam.z - CANDLE_Z);
  const drawTheCandle = () => { drawCandleBox(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: Math.max(p, 0) * CS, lo: Math.min(p, 0) * CS, w: 2.0, col, k: 1.1, flat: Math.abs(p) < 0.03 }); candleDrawn = true; };
  for (const i of order) {
    const [x, z, a] = platPos(i);
    if (!candleDrawn && Math.hypot(x - cam.x, z - cam.z) < dCandle) drawTheCandle();
    const te = elimTime(i);
    const dt = t - te;
    const drop = dt > 0 ? 0.5 * 14 * dt * dt : 0;
    if (dt > 1.6) continue;
    const pk = pickAt(i, t);
    const pcol = i === 0 ? RGB.cyan : pk === 1 ? RGB.green : pk === -1 ? RGB.red : [140, 130, 190];
    const top = drawPlatform(R, cam, x, z, drop, dt > 0 ? RGB.red : pcol, { rot: a });
    if (!top) continue;
    const c = BR_CAST[i];
    const fall = dt > 0 ? dt : 0;
    const pose = fall > 0.05 ? 'flail' : (t > ROUNDS[0].pick && t < te) ? (pk ? 'brace' : 'idle') : 'idle';
    const won = te === Infinity && t > roundAt(t).res && t < roundAt(t).res + 0.7;
    const face = fall > 0 ? { eyes: 'x', mouth: 'frown' } : won ? { eyes: 'dollar', mouth: 'grin' } : pk ? { eyes: pk === 1 ? 'up' : 'down' } : { eyes: 'dot' };
    const led = fall > 0 ? RGB.red : won ? RGB.green : pk === 1 ? RGB.green : pk === -1 ? RGB.red : WHITE;
    const lift = fall * 2.5 - 0.5 * 9.8 * fall * fall * 0.3;
    const q = cam.p(x, PLAT_H - drop + Math.max(0, lift * 0.3), z);
    if (!q) continue;
    // face toward the centre (candle): yaw relative to camera
    const fx = -Math.cos(a), fz = -Math.sin(a);
    const vx = cam.x - x, vz = cam.z - z, vl = Math.hypot(vx, vz);
    const dot = (fx * vx + fz * vz) / vl, crs = (fx * vz - fz * vx) / vl;
    const yaw = clamp(Math.atan2(crs, Math.max(0.1, dot)) * 0.8, -1.1, 1.1) * (Math.cos(cam.yaw) >= 0 ? -1 : 1);
    const hd = drawPlayer(R, { x: q[0], y: q[1], s: 0.33 * q[3], pose, cast: c, face, led, yaw: dot < 0 ? 0 : yaw, roll: fall * 4 * (i % 2 ? 1 : -1), rim: { x: 0.2, y: -1, col: RGB.cyan, k: 0.9 }, key: { x: 0, y: -0.7, col: [lerp(col[0], 255, 0.5), lerp(col[1], 255, 0.5), lerp(col[2], 255, 0.5)], k: 0.7 } });
    heads.push({ i, x: hd.hx, y: hd.hy, s: 0.33 * q[3], fall, name: c.name });
  }
  if (!candleDrawn) drawTheCandle();
  return heads;
}

function aliveHUD(R, t) {
  const n = aliveAt(t);
  const last = [...ROUNDS].reverse().find((r) => t >= r.res);
  const pop = last ? pulse(t, last.res, 0.25) : 0;
  label(R, 'ALIVE', 92, 60, { size: 15, col: [168, 162, 200], tracking: 6 });
  money(R, `${n}`, 92, 150, { size: 96, col: n <= 2 ? RGB.red : RGB.cyan, align: 'left', scale: 1 + pop * 0.3 });
  money(R, '/ 8', 92 + (n >= 10 ? 130 : 70), 150, { size: 40, col: [168, 162, 200], align: 'left', glow: 0.1 });
  label(R, 'WINNER NET', 1828, 60, { size: 15, col: [168, 162, 200], tracking: 6, align: 'right' });
  money(R, '190 USDC', 1828, 120, { size: 44, col: RGB.cyan, align: 'right' });
}

// 31.837 – 33.216  BATTLE ROYALE. 8 in, 1 out.
function shotBRIntro(t, R, P) {
  const lt = t - M.BR;
  const a = lerp(0.9, 0.55, E.inOutCubic(lt / 1.38));
  const D = lerp(13, 11, lt / 1.38), H = lerp(9, 7, lt / 1.38);
  const cam = new Cam({ x: Math.sin(a) * D, y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - 1.2, D), f: 1250 });
  const heads = drawBR(R, cam, t);
  for (const h of heads) if (h.fall === 0) nameTag(R, h.x, h.y - h.s * 1.9, h.name, { size: 16, col: h.i === 0 ? RGB.cyan : [168, 162, 200], alpha: clamp((lt - 0.15 - h.i * 0.04) / 0.1) });
  const ta = env(t, M.BR, M.BR + 1.3, 0.05, 0.1);
  bigWord(R, 'BATTLE ROYALE', { x: 960, y: 190, size: 130, alpha: ta, scale: 1 + 0.12 * (1 - E.outQuart(lt / 0.25)), fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2, extrude: { dx: 0, dy: 6, n: 6, col: [40, 36, 70], col2: [10, 9, 20] } });
  label(R, '8 IN.  1 OUT.', 960, 262, { size: 26, weight: 700, col: RGB.cyan, tracking: 12, align: 'center', alpha: clamp((lt - 0.3) / 0.1) });
  aliveHUD(R, t);
  P.flash = pulse(t, M.BR, 0.08) * 0.12; P.bloom = 0.95;
}

// Round resolution: high angle, the floor goes.
function shotResolve(t, R, P, r, o = {}) {
  const lt = t - (r.res - 0.5);
  const a = o.a ?? 0.3;
  const D = o.D ?? 9.5, H = o.H ?? 10.5;
  const cam = new Cam({ x: Math.sin(a) * D, y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - 0.5, D), f: o.f ?? 1150 });
  const [sx, sy] = shake(t, r.res, 16, 0.5, 22, 11);
  cam.sx = sx; cam.sy = sy;
  const heads = drawBR(R, cam, t);
  // SO CLOSE. over the fallen
  for (const h of heads) {
    if (h.fall > 0 && h.fall < 1.2) {
      const aa = clamp(h.fall / 0.1) * clamp((1.2 - h.fall) / 0.3);
      label(R, 'SO CLOSE.', h.x, h.y - h.s * 2.2 - h.fall * 40, { size: 20, weight: 700, col: RGB.red, tracking: 3, align: 'center', alpha: aa });
    }
  }
  shockwave(R, cam, 0, CANDLE_Z, t - r.res, { r: 16, col: r.out === 1 ? RGB.green : RGB.red, dur: 0.8 });
  aliveHUD(R, t);
  P.flash = pulse(t, r.res, 0.07) * 0.2; P.bloom = 1.0;
  P.invert = t - r.res >= 0 && t - r.res < 0.034 ? 1 : 0; if (P.invert) { P.satBase = 0; P.satGlow = 0; }
}

// 33.5 – 34.35  Bass gap: survivors look at each other.
function shotGlance(t, R, P) {
  const lt = t - 33.5;
  const i = Math.floor(lt / 0.21) % 4;
  const who = [BR_CAST[1], BR_CAST[3], BR_CAST[2], BR_CAST[4]][i];
  bokeh(R, t, { n: 40, seed: 90 + i, y0: 100, h: 900, r: 44, a: 0.16, cols: [RGB.cyan, WHITE, RGB.red] });
  const face = i === 1 ? { eyeL: 'gtL', eyeR: 'ltR', mouth: 'wobble' } : { eyeL: 'side', eyeR: 'side', lookX: i % 2 ? -2 : 2 };
  drawHelmet(R, { x: 960, y: 520, s: 330, type: who.type, shell: who.shell, accent: who.accent, stripes: who.stripes, face, led: WHITE, yaw: (i % 2 ? -1 : 1) * 0.3, body: 'bust', key: { x: 0, y: -0.5, col: [200, 220, 255], k: 0.5 }, rim: { x: 0.9, y: -0.3, col: RGB.cyan, k: 1 } });
  nameTag(R, 960, 150, who.name, { size: 22, col: [168, 162, 200] });
  aliveHUD(R, t);
  P.bloom = 0.9;
}

// The wait inside a round: orbiting mid shot, picks visible, wick whipping.
function shotRoundWait(t, R, P, r, o = {}) {
  const lt = t - (o.t0 ?? r.pick);
  const a = (o.a0 ?? -0.6) + lt * (o.spin ?? 0.35);
  const D = o.D ?? 8.5, H = o.H ?? 4.2;
  const cam = new Cam({ x: Math.sin(a) * D, y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - 1.8, D), f: o.f ?? 1200 });
  const heads = drawBR(R, cam, t);
  for (const h of heads) if (h.fall === 0 && (h.i === 0)) nameTag(R, h.x, h.y - h.s * 1.9, 'YOU', { size: 16 });
  aliveHUD(R, t);
  P.bloom = 0.95;
}

// Chaos: chat spam over the royale.
const SPAM = [
  { t: 35.6, who: 'RAJ_HL', msg: 'see ya', x: 520, y: 330 }, { t: 35.85, who: 'DEANO', msg: 'send it down', x: 1400, y: 420 },
  { t: 36.1, who: '0XTOM', msg: 'dead', x: 760, y: 760 }, { t: 36.35, who: 'COPE_DEALER', msg: 'new blood', x: 1250, y: 820 },
  { t: 36.6, who: 'THEO', msg: 'ez clap', x: 430, y: 610 }, { t: 36.85, who: 'MIRA', msg: 'rip me', x: 1500, y: 240 },
];

// 40.0 – 41.04  The final two, across the candle.
function shotFaceoff(t, R, P) {
  const lt = t - (ROUNDS[2].res + 0.8);
  const a = lerp(1.05, 1.2, lt);
  const D = 8, H = 3.6;
  const cam = new Cam({ x: Math.sin(a) * D, y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - 2.0, D), f: 1250 });
  const heads = drawBR(R, cam, t);
  for (const h of heads) if (h.fall === 0) nameTag(R, h.x, h.y - h.s * 1.9, h.name, { size: 18, col: h.i === 0 ? RGB.cyan : RGB.gold });
  const fa = clamp(lt / 0.08);
  bigWord(R, 'FINAL TWO', { x: 960, y: 1000, size: 110, alpha: fa, scale: 1 + 0.12 * (1 - E.outQuart(lt / 0.2)), fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2, extrude: { dx: 0, dy: 5, n: 5, col: [40, 36, 70], col2: [10, 9, 20] } });
  aliveHUD(R, t);
  P.flash = pulse(t, ROUNDS[2].res + 0.8, 0.06) * 0.1; P.bloom = 0.95;
}

// 41.04 – 44.718  FINAL: YOU vs DEANO. Tighter and tighter.
function shotFinal(t, R, P) {
  const r = ROUNDS[3];
  const lt = t - r.pick;
  const beatI = Math.floor(lt / (BEAT));
  const late = lt > 2.3;
  const period = late ? BEAT / 2 : BEAT;
  const k = Math.floor(lt / period);
  if (lt < 1.84 || (late && k % 3 === 2)) {
    // wide two-shot across the candle
    const a = lerp(1.2, 1.35, lt / 3.7);
    const D = lerp(9, 7.2, E.inQuad(lt / 3.7)), H = lerp(3.8, 3.2, lt / 3.7);
    const cam = new Cam({ x: Math.sin(a) * D, y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - 2.0, D), f: 1250 });
    drawBR(R, cam, t);
  } else {
    const you = k % 2 === 0;
    const who = you ? BR_CAST[0] : BR_CAST[2];
    const pk = you ? 1 : -1;
    bokeh(R, t, { n: 40, seed: 120 + k, y0: 100, h: 900, r: 50, a: 0.18, cols: you ? [RGB.cyan, WHITE] : [RGB.gold, RGB.red] });
    const z = 1 + (lt % period) * 0.4;
    drawHelmet(R, { x: you ? 880 : 1040, y: 520, s: 420 * z, type: who.type, shell: who.shell, accent: who.accent, stripes: who.stripes, face: { eyes: pk === 1 ? 'up' : 'down' }, led: pk === 1 ? RGB.green : RGB.red, yaw: you ? 0.25 : -0.25, status: pk === 1 ? C.green : C.red, body: 'bust', key: { x: 0, y: -0.5, col: [220, 230, 255], k: 0.55 }, rim: { x: you ? 0.9 : -0.9, y: -0.3, col: you ? RGB.cyan : RGB.gold, k: 1.1 } });
    nameTag(R, 960, 130, you ? 'YOU' : 'DEANO', { size: 24, col: you ? RGB.cyan : RGB.gold });
  }
  aliveHUD(R, t);
  P.flash = pulse(t, r.pick + k * period, 0.04) * 0.07; P.bloom = 1.0; P.ca = 0.004;
}

export const ACT3 = [
  { t0: M.BR, t1: ROUNDS[0].res - 0.5, fn: shotBRIntro },
  { t0: ROUNDS[0].res - 0.5, t1: 33.5, fn: (t, R, P) => shotResolve(t, R, P, ROUNDS[0], { a: 0.4 }) },
  { t0: 33.5, t1: 34.35, fn: shotGlance },
  { t0: 34.35, t1: ROUNDS[1].res - 0.5, fn: (t, R, P) => shotRoundWait(t, R, P, ROUNDS[1], { a0: -0.9, spin: 0.5 }) },
  { t0: ROUNDS[1].res - 0.5, t1: ROUNDS[1].res + 0.9, fn: (t, R, P) => shotResolve(t, R, P, ROUNDS[1], { a: -0.5, D: 8.5, H: 11 }) },
  { t0: ROUNDS[1].res + 0.9, t1: ROUNDS[2].pick, fn: (t, R, P) => { shotRoundWait(t, R, P, ROUNDS[2], { t0: ROUNDS[1].res + 0.9, a0: 1.6, spin: -0.4, D: 10, H: 7 }); for (const c of SPAM) { const a = env(t, c.t, c.t + 0.9, 0.05, 0.2); if (a > 0) chatBubble(R, c.x, c.y, c.who, c.msg, { alpha: a, scale: 1.1 }); } } },
  { t0: ROUNDS[2].pick, t1: ROUNDS[2].res - 0.5, fn: (t, R, P) => shotRoundWait(t, R, P, ROUNDS[2], { a0: 2.4, spin: 0.3, D: 7.5, H: 3.6 }) },
  { t0: ROUNDS[2].res - 0.5, t1: ROUNDS[2].res + 0.8, fn: (t, R, P) => shotResolve(t, R, P, ROUNDS[2], { a: 2.9, D: 9, H: 8 }) },
  { t0: ROUNDS[2].res + 0.8, t1: ROUNDS[3].pick, fn: shotFaceoff },
  { t0: ROUNDS[3].pick, t1: ROUNDS[3].res, fn: shotFinal },
];
