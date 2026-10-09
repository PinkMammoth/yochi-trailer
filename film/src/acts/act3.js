// ACT III — THE ROYALE (31.837 → 44.718)
// Eight platforms around one candle. Wrong call: the floor goes. 8 → 5 → 3 → 2 → 1.
import { clamp, lerp, E, noise1, shake, pulse, env, rgba, hash1, fbm1 } from '../core/math.js';
import { M, BEAT, BAR, bar } from '../core/music.js';
import { drawHelmet, RGB, C } from '../elements/helmet.js';
import { drawPlayer, blendPose, mirrorPose } from '../elements/body.js';
import { Cam, drawSky, drawFloor, floorPool, strikeLine, drawCandleBox } from '../elements/world.js';
import { drawCrowd, drawCrowdTop } from '../elements/crowd.js';
import { headline, kicker, worldTitle, money, chatBubble, nameTag, fmtUSDC } from '../elements/type.js';
import { bokeh, stream, shockwave, confetti, speedLines, timerHUD } from '../elements/fx.js';
import { world, CAST, CANDLE_Z, YOU_SHELL, CS, canonBust } from './common.js';

const WHITE = RGB.text;
export const BR_CAST = [
  { ...CAST.you },
  { ...CAST.oxtom },
  { name: 'DEANO', type: 'horns', shell: [78, 52, 58], accent: C.gold, canon: 'bull' },
  { ...CAST.soup },
  { name: 'MIRA', type: 'cat', shell: [70, 60, 104], accent: C.cyan, canon: 'rogue' },
  { name: 'RAJ_HL', type: 'fin', shell: [56, 64, 90], accent: C.faint, canon: 'bear' },
  { ...CAST.cope },
  { name: 'THEO', type: 'frog', shell: [52, 70, 60], accent: C.green, canon: 'bull' },
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
const BRACE_M = mirrorPose('brace');
export function platPos(i) { const a = -Math.PI / 2 + (i / 8) * Math.PI * 2 + 0.2; return [Math.cos(a) * BR_R, CANDLE_Z + Math.sin(a) * BR_R, a]; }

export function brPrice(t) {
  const r = roundAt(t);
  const start = r === ROUNDS[0] ? M.DROP2 + 0.9 : ROUNDS[ROUNDS.indexOf(r) - 1].res + 0.2;
  if (t >= r.res) return r.out * (1.6 + 0.4 * E.outExpo((t - r.res) / 0.3));
  const u = clamp((t - start) / (r.res - start));
  const fin = r === ROUNDS[3] ? 1.6 : 1;
  return fbm1(t * 2.2 * fin + ROUNDS.indexOf(r) * 7, 3) * 1.4 * fin * (0.45 + u) + r.out * E.inQuad(u) * 0.4;
}

// Hex podium: a machined satin plinth with a chamfered top and a recessed kick at its foot, lit by
// the candle; the player's pick lives in an LED strip just under the chamfer and a glow in the top
// pad (not neon on every edge). y offset for dropping.
const BEV = 0.09, KICK = 0.16, STRIP = [0.07, 0.17];
const mixc = (a, b2, t) => [lerp(a[0], b2[0], t), lerp(a[1], b2[1], t), lerp(a[2], b2[2], t)];
const sclc = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];
function drawPlatform(R, cam, x, z, drop, col, o = {}) {
  const { b, g } = R;
  const top = PLAT_H - drop, bot = -drop, rot = o.rot || 0;
  const ring = (y, r) => Array.from({ length: 6 }, (_, k) => { const a = k * Math.PI / 3 + rot; return cam.p(x + Math.cos(a) * r, y, z + Math.sin(a) * r); });
  const yb = Math.max(bot, -6);
  const T = ring(top, HEX_R - BEV), E1 = ring(top - BEV, HEX_R), K = ring(yb + KICK, HEX_R);
  const S0 = ring(top - BEV - STRIP[0], HEX_R), S1 = ring(top - BEV - STRIP[1], HEX_R);
  const B1 = ring(yb + KICK, HEX_R - 0.06), B0 = ring(yb, HEX_R - 0.06);
  if ([T, E1, K, S0, S1, B1, B0].some((P) => P.some((p) => !p))) return null;
  const under = drop > PLAT_H ? clamp((drop - PLAT_H) / 3) : 0;
  const a = (o.k ?? 1) * (1 - under * 0.85);
  const hot = mixc(col, [255, 255, 255], 0.45);
  const lc = o.light || [235, 245, 255];                  // the candle's light
  const base = [18, 17, 29];
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const lx = -x, lz = CANDLE_Z - z, ll = Math.hypot(lx, lz) || 1;
  const px = T[0][3];                                       // pixels per world unit here
  const faces = [];
  for (let k = 0; k < 6; k++) {
    const ang = (k + 0.5) * Math.PI / 3 + rot, nx = Math.cos(ang), nz = Math.sin(ang);
    const fx = x + nx * HEX_R * 0.87, fz = z + nz * HEX_R * 0.87;
    const side = nx * (cam.x - fx) + nz * (cam.z - fz) > 0;
    const cham = 0.707 * (nx * (cam.x - fx) + nz * (cam.z - fz)) + 0.707 * (cam.y - (top - BEV / 2)) > 0;
    faces.push({ k, k2: (k + 1) % 6, side, cham, dif: Math.max(0, (nx * lx + nz * lz) / ll) });
  }
  // the kick: a dark recess at the foot, so the plinth sits on the floor rather than in it
  for (const f of faces) if (f.side) { b.fillStyle = rgba(sclc(base, 0.4), a); poly(b, [B1[f.k], B1[f.k2], B0[f.k2], B0[f.k]]); b.fill(); }
  // satin sides: lighter toward the chamfer, the candle's light on the faces turned to it
  for (const f of faces) {
    if (!f.side) continue;
    const { k, k2, dif } = f;
    const hi = mixc(sclc(base, 1.25 + dif * 0.9), lc, 0.05 + 0.2 * dif), lo = mixc(sclc(base, 0.62), lc, 0.03 * dif);
    const gr = b.createLinearGradient(E1[k][0], E1[k][1], K[k][0], K[k][1]);
    gr.addColorStop(0, rgba(hi, a)); gr.addColorStop(0.35, rgba(mixc(hi, lo, 0.55), a)); gr.addColorStop(1, rgba(lo, a));
    b.fillStyle = gr; poly(b, [E1[k], E1[k2], K[k2], K[k]]); b.fill();
    // a soft sheen down the face nearest the light
    if (dif > 0.5) {
      const sh = b.createLinearGradient(E1[k][0], E1[k][1], E1[k2][0], E1[k2][1]);
      sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.5, rgba(lc, 0.07 * (dif - 0.5) * 2 * a)); sh.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = sh; poly(b, [E1[k], E1[k2], K[k2], K[k]]); b.fill();
    }
  }
  // vertical edges: machined, a hairline of light where two faces meet
  b.lineWidth = Math.max(0.8, 0.012 * px);
  for (const f of faces) {
    if (!f.side) continue;
    const other = faces[(f.k + 5) % 6];
    if (!other.side) continue;
    b.strokeStyle = rgba(mixc(lc, [255, 255, 255], 0.4), (0.08 + 0.22 * Math.max(f.dif, other.dif)) * a);
    b.beginPath(); b.moveTo(E1[f.k][0], E1[f.k][1]); b.lineTo(K[f.k][0], K[f.k][1]); b.stroke();
  }
  // the status strip: an LED band set into the sides just under the chamfer
  for (const f of faces) {
    if (!f.side) continue;
    const q = [S0[f.k], S0[f.k2], S1[f.k2], S1[f.k]];
    b.fillStyle = rgba(hot, 0.95 * a); poly(b, q); b.fill();
    g.fillStyle = rgba(col, 0.85 * a); poly(g, q); g.fill();
  }
  g.lineWidth = Math.max(2, 0.12 * px); g.lineJoin = 'round';
  for (const f of faces) {
    if (!f.side) continue;
    g.strokeStyle = rgba(col, 0.28 * a);
    g.beginPath(); g.moveTo((S0[f.k][0] + S1[f.k][0]) / 2, (S0[f.k][1] + S1[f.k][1]) / 2); g.lineTo((S0[f.k2][0] + S1[f.k2][0]) / 2, (S0[f.k2][1] + S1[f.k2][1]) / 2); g.stroke();
  }
  // the chamfer catches the light from above: a crisp bright band round the top
  for (const f of faces) {
    if (!f.cham) continue;
    const { k, k2, dif } = f;
    b.fillStyle = rgba(mixc(sclc(base, 2.3 + dif * 0.8), lc, 0.12 + 0.22 * dif), a); poly(b, [E1[k], E1[k2], T[k2], T[k]]); b.fill();
  }
  b.lineWidth = Math.max(0.8, 0.014 * px);
  for (const f of faces) {
    if (!f.side) continue;
    b.strokeStyle = rgba(mixc(lc, [255, 255, 255], 0.5), (0.3 + 0.4 * f.dif) * a);
    b.beginPath(); b.moveTo(E1[f.k][0], E1[f.k][1]); b.lineTo(E1[f.k2][0], E1[f.k2][1]); b.stroke();
  }
  if (cam.y > top) {
    // the top: dark satin, brighter on the candle's side, with an inset pad that glows with the pick
    const cN = cam.p(x + lx / ll * HEX_R, top, z + lz / ll * HEX_R), cF = cam.p(x - lx / ll * HEX_R, top, z - lz / ll * HEX_R);
    const tg = cN && cF ? b.createLinearGradient(cN[0], cN[1], cF[0], cF[1]) : null;
    if (tg) { tg.addColorStop(0, rgba(mixc(sclc(base, 1.7), lc, 0.12), a)); tg.addColorStop(1, rgba(sclc(base, 1.05), a)); }
    b.fillStyle = tg || rgba(sclc(base, 1.3), a); poly(b, T); b.fill();
    const P = ring(top, (HEX_R - BEV) * 0.72);
    if (!P.some((p) => !p)) {
      b.fillStyle = rgba(mixc(sclc(base, 1.25), col, 0.12), a); poly(b, P); b.fill();
      b.strokeStyle = rgba(sclc(base, 0.45), a); b.lineWidth = Math.max(1, 0.03 * px); poly(b, P); b.stroke();
      b.strokeStyle = rgba(hot, 0.55 * a); b.lineWidth = Math.max(0.8, 0.012 * px); poly(b, P); b.stroke();
      g.fillStyle = rgba(col, 0.16 * a); poly(g, P); g.fill();
      g.strokeStyle = rgba(col, 0.5 * a); g.lineWidth = Math.max(1.5, 0.05 * px); poly(g, P); g.stroke();
    }
    // the player's contact shadow on the pad
    const C0 = cam.p(x, top, z);
    const circ = Array.from({ length: 18 }, (_, i) => { const t2 = i / 18 * Math.PI * 2; return cam.p(x + Math.cos(t2) * 0.5, top, z + Math.sin(t2) * 0.5); });
    if (C0 && !circ.some((p) => !p)) {
      const rr = Math.max(...circ.map((p) => Math.hypot(p[0] - C0[0], p[1] - C0[1])));
      const sg = b.createRadialGradient(C0[0], C0[1], 0, C0[0], C0[1], rr);
      sg.addColorStop(0, `rgba(0,0,0,${0.5 * a})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = sg; poly(b, circ); b.fill();
    }
  }
  return cam.p(x, top, z);
}

// Full BR arena. opts: { price, crowd (false: no crowd), ground (false: no sky or floor), beforePlatforms,
//   canon (the standing players wear their canonical heads: for shots close enough to read them; YOU always
//   wears the painted rig) }
export function drawBR(R, cam, t, o = {}) {
  const { crowd } = world();
  const p = o.price ?? brPrice(t);
  const col = p > 0.05 ? RGB.green : p < -0.05 ? RGB.red : [235, 245, 255];
  // (ground: false when the arena is laid over a view that has drawn its own floor)
  if (o.ground !== false) { drawSky(R, cam, { hor: [30, 26, 58], band: 1.1 }); drawFloor(R, cam); }
  floorPool(R, cam, 0, CANDLE_Z, 9 + Math.abs(p) * 2, col, 1.3);
  // each podium darkens the floor at its foot and spills its pick colour round it
  for (let i = 0; i < 8 && o.ground !== false; i++) {
    const dt = t - elimTime(i);
    if (dt > 0.35) continue;
    const [x, z] = platPos(i), pk = pickAt(i, t);
    const pcol = dt > 0 ? RGB.red : i === 0 ? RGB.cyan : pk === 1 ? RGB.green : pk === -1 ? RGB.red : [140, 130, 190];
    const fade = 1 - clamp(dt / 0.35);
    floorPool(R, cam, x, z, 1.55, [3, 2, 7], 1.7 * fade);
    floorPool(R, cam, x, z, 2.3, pcol, 0.5 * fade);
  }
  strikeLine(R, cam, CANDLE_Z, -40, 40, { phase: t * 0.3 });
  if (o.crowd !== false) {
    drawCrowd(R, cam, crowd, (m) => (m.hero || m.rival || m.rad < 8.5 ? { hide: true } : { eyes: 'wide', led: WHITE, ledI: 0.45, look: 0.3 }),
      { lit: [90, 100, 150], fogCol: [24, 20, 46], fogNear: 6, fogFar: 40, near: 3, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.4 } });
  }
  if (o.beforePlatforms) o.beforePlatforms();
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
    const top = drawPlatform(R, cam, x, z, drop, dt > 0 ? RGB.red : pcol, { rot: a, light: col });
    if (!top) continue;
    const c = BR_CAST[i];
    const fall = dt > 0 ? dt : 0;
    const pose = fall > 0.05 ? 'flail' : (t > ROUNDS[0].pick && t < te) ? (pk ? (i % 2 ? BRACE_M : 'brace') : 'idle') : 'idle';
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
    const hd = drawPlayer(R, { x: q[0], y: q[1], s: 0.33 * q[3], pose, cast: c, canon: (o.canon || i === 0) && fall === 0, face, led, visorGlow: { w: Math.max(2, 0.08 * q[3]), a: led === WHITE ? 0.35 : 0.85 }, yaw: dot < 0 ? 0 : yaw, roll: fall * 4 * (i % 2 ? 1 : -1), rim: { x: 0.2, y: -1, col: RGB.cyan, k: 0.9 }, key: { x: 0, y: -0.7, col: [lerp(col[0], 255, 0.5), lerp(col[1], 255, 0.5), lerp(col[2], 255, 0.5)], k: 0.7 } });
    heads.push({ i, x: hd.hx, y: hd.hy, s: 0.33 * q[3], hs: hd.hs, fall, name: c.name, fx: q[0], fy: q[1] });
  }
  if (!candleDrawn) drawTheCandle();
  return heads;
}

function aliveHUD(R, t) {
  const n = aliveAt(t);
  const last = [...ROUNDS].reverse().find((r) => t >= r.res);
  const pop = last ? pulse(t, last.res, 0.25) : 0;
  kicker(R, 'ALIVE', 92, 60, { size: 16, col: [168, 162, 200], glow: 0 });
  money(R, `${n}`, 92, 150, { size: 96, col: n <= 2 ? RGB.red : RGB.cyan, align: 'left', scale: 1 + pop * 0.3 });
  money(R, '/ 8', 92 + (n >= 10 ? 130 : 70), 150, { size: 40, col: [168, 162, 200], align: 'left', glow: 0.1 });
  kicker(R, 'WINNER NET', 1828, 60, { size: 16, col: [168, 162, 200], align: 'right', glow: 0 });
  money(R, '190 USDC', 1828, 120, { size: 44, col: RGB.cyan, align: 'right' });
}

// 31.837 – 33.216  BATTLE ROYALE. 8 in, 1 out.
function shotBRIntro(t, R, P) {
  const lt = t - M.BR;
  const a = lerp(0.9, 0.55, E.inOutCubic(lt / 1.38));
  const D = lerp(13, 11, lt / 1.38), H = lerp(9, 7, lt / 1.38);
  const cam = new Cam({ x: Math.sin(a) * D, y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - 1.2, D), f: 1250 });
  // the title hangs in the air behind the ring: the far crowd sits behind it, every player stands in front of it
  const heads = drawBR(R, cam, t, {
    beforePlatforms: () => {
      worldTitle(R, cam, 'BATTLE ROYALE', 0, 4.8, CANDLE_Z, 1.5, { inT: lt, outT: M.BR + 1.3 - t, glow: 0.2, halo: 1.1, rule: { col: RGB.cyan },
        kicker: { text: '8 IN.  1 OUT.', col: RGB.cyan, size: 24 } });
    },
  });
  // names sit on the podium lips (below the feet), leaving the air above the ring to the title
  for (const h of heads) if (h.fall === 0) nameTag(R, h.fx, h.fy + 21 + h.s * 0.3, h.name, { size: 16, col: h.i === 0 ? RGB.cyan : [168, 162, 200], alpha: clamp((lt - 0.15 - h.i * 0.04) / 0.1) });
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
      kicker(R, 'SO CLOSE.', h.x, h.y - h.s * 2.4 - h.fall * 40, { size: 20, col: RGB.red, align: 'center', alpha: aa, halo: true, track: 0.18 });
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
  // (the two bulls, 0XTOM and DEANO, face opposite ways; so do the two rogues)
  canonBust(R, who, { x: 960, y: 520, s: 330, face, led: WHITE, flip: [false, true, true, false][i], key: { x: 0, y: -0.5, col: [200, 220, 255], k: 0.5 }, rim: { x: 0.9, y: -0.3, col: RGB.cyan, k: 1 } });
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
  for (const h of heads) if (h.fall === 0 && (h.i === 0)) nameTag(R, h.x, h.y - h.hs * 1.7, 'YOU', { size: 16 });
  aliveHUD(R, t);
  P.bloom = 0.95;
}

// Lineup: the survivors, side by side, locking in their calls.
function shotLineup(t, R, P, r, idxs, o = {}) {
  const { b } = R;
  const lt = t - (o.t0 ?? r.pick);
  bokeh(R, t, { n: 50, seed: 300 + idxs.length, y0: 60, h: 960, r: 46, a: 0.14, cols: [RGB.cyan, WHITE, [140, 130, 190]] });
  const n = idxs.length;
  const gap = Math.min(380, 1700 / n);
  const x0 = 960 - gap * (n - 1) / 2;
  const sz = Math.min(170, gap * 0.46);
  const labels = [];
  idxs.forEach((i, k) => {
    const c = BR_CAST[i];
    const pk = pickAt(i, t);
    const pop = pk ? E.outBack(clamp((t - (r.pick + i * 0.05)) / 0.12)) : 0;
    const face = pk ? { eyes: pk === 1 ? 'up' : 'down' } : (i === 3 ? { eyeL: 'gtL', eyeR: 'ltR', mouth: 'wobble' } : { eyes: 'dot', lookX: k < n / 2 ? 1 : -1 });
    const led = pk === 1 ? RGB.green : pk === -1 ? RGB.red : WHITE;
    const x = x0 + k * gap, y = 600 + Math.sin(lt * 2 + k) * 4;
    const v = canonBust(R, c, { x, y, s: sz * (1 + lt * 0.04), face, led, ledI: 1 + pop * 0.5,
      yaw: (960 - x) / 1800, key: { x: 0, y: -0.6, col: [220, 230, 255], k: 0.5 }, rim: { x: 0.2, y: -1, col: i === 0 ? RGB.cyan : [140, 130, 190], k: 1 } });
    labels.push(() => {
      nameTag(R, x, v.vy - v.hw * 2.45, c.name, { size: 18, col: i === 0 ? RGB.cyan : [168, 162, 200] });
      if (pk) kicker(R, pk === 1 ? '▲ PUMP' : '▼ DUMP', x, y + sz * 1.55, { size: 22, col: led, align: 'center', alpha: pop, glow: 0.5 });
    });
  });
  labels.forEach((f) => f());
  timerHUD(R, r.res - t, { label: 'ROUND CLOSES IN', urgentAt: 2, x: 960, y: 70, align: 'center' });
  aliveHUD(R, t);
  P.bloom = 0.95;
}

// Chaos: chat spam over the royale.
const SPAM = [
  { t: 35.6, who: 'RAJ_HL', msg: 'see ya', x: 470, y: 340 }, { t: 35.83, who: 'DEANO', msg: 'send it down', x: 1440, y: 430 },
  { t: 36.06, who: '0XTOM', msg: 'dead', x: 760, y: 800 }, { t: 36.29, who: 'COPE_DEALER', msg: 'new blood', x: 1290, y: 860 },
  { t: 36.52, who: 'THEO', msg: 'ez clap', x: 400, y: 640 }, { t: 36.75, who: 'MIRA', msg: 'rip me', x: 1520, y: 250 },
];

// 40.0 – 41.04  The final two, across the candle.
function shotFaceoff(t, R, P) {
  const lt = t - (ROUNDS[2].res + 0.8);
  const a = lerp(1.05, 1.2, lt);
  const D = 8, H = 3.6;
  const cam = new Cam({ x: Math.sin(a) * D, y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - 2.0, D), f: 1250 });
  const heads = drawBR(R, cam, t, { canon: true });
  for (const h of heads) if (h.fall === 0) nameTag(R, h.x, Math.max(56, h.y - h.hs * 1.8), h.name, { size: 18, col: h.i === 0 ? RGB.cyan : RGB.gold });
  aliveHUD(R, t);
  P.flash = pulse(t, ROUNDS[2].res + 0.8, 0.06) * 0.1; P.bloom = 0.95;
}

// 41.04 – 44.718  FINAL: YOU vs DEANO. Candle, faces, faster, to the close.
function finalFace(t, R, you, k, lt) {
  const who = you ? BR_CAST[0] : BR_CAST[2];
  const pk = you ? 1 : -1;
  bokeh(R, t, { n: 40, seed: 120 + k, y0: 100, h: 900, r: 50, a: 0.18, cols: you ? [RGB.cyan, WHITE] : [RGB.gold, RGB.red] });
  const z = 1 + lt * 0.18;
  canonBust(R, who, { x: you ? 880 : 1040, y: 520, s: 430 * z, face: { eyes: pk === 1 ? 'up' : 'down' }, led: pk === 1 ? RGB.green : RGB.red, yaw: you ? 0.25 : -0.25, key: { x: 0, y: -0.5, col: [220, 230, 255], k: 0.55 }, rim: { x: you ? 0.9 : -0.9, y: -0.3, col: you ? RGB.cyan : RGB.gold, k: 1.1 } });
  nameTag(R, 960, 130, you ? 'YOU' : 'DEANO', { size: 24, col: you ? RGB.cyan : RGB.gold });
}
function finalCandle(t, R, P) {
  const cam = new Cam({ x: 0.4, y: 1.3, z: CANDLE_Z + 7.0, yaw: Math.PI - 0.05, pitch: 0.12, f: 1250 });
  drawSky(R, cam, { hor: [28, 24, 54], band: 0.9 });
  drawFloor(R, cam);
  const p = brPrice(t);
  const col = p > 0.05 ? RGB.green : p < -0.05 ? RGB.red : [235, 245, 255];
  floorPool(R, cam, 0, CANDLE_Z, 6, col, 1.2);
  strikeLine(R, cam, CANDLE_Z, -30, 30, { phase: t * 0.3, width: 4 });
  drawCandleBox(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: Math.max(p, 0) * CS + 0.3, lo: Math.min(p, 0) * CS - 0.3, w: 2.4, col, k: 1.2 });
  speedLines(R, t, { vertical: true, n: 40, alpha: 0.12, col: WHITE });
}
function shotFinal(t, R, P) {
  const r = ROUNDS[3];
  const lt = t - r.pick;
  let k = 0, ll = 0;
  if (lt < BAR / 2) { finalCandle(t, R, P); }
  else if (lt < BAR) { ll = lt - BAR / 2; finalFace(t, R, true, 1, ll); }
  else if (lt < BAR * 1.5) { ll = lt - BAR; finalFace(t, R, false, 2, ll); }
  else {
    const q = lt - BAR * 1.5;
    k = Math.floor(q / (BEAT / 2));
    ll = q - k * BEAT / 2;
    const m = k % 3;
    if (m === 0) finalFace(t, R, true, 10 + k, ll);
    else if (m === 1) finalFace(t, R, false, 10 + k, ll);
    else finalCandle(t, R, P);
    P.flash = pulse(ll, 0, 0.04) * 0.08;
  }
  timerHUD(R, r.res - t, { label: 'FINAL CANDLE', urgentAt: 3, x: 960, y: 70, align: 'center' });
  aliveHUD(R, t);
  P.bloom = 1.0; P.ca = 0.004 + clamp((lt - 2.5) / 1.2) * 0.006;
}

export const ACT3 = [
  { t0: M.BR, t1: ROUNDS[0].res - 0.5, fn: shotBRIntro },
  { t0: ROUNDS[0].res - 0.5, t1: 33.5, fn: (t, R, P) => shotResolve(t, R, P, ROUNDS[0], { a: 0.4 }) },
  { t0: 33.5, t1: 34.35, fn: shotGlance },
  { t0: 34.35, t1: ROUNDS[1].res - 0.5, fn: (t, R, P) => shotLineup(t, R, P, ROUNDS[1], [1, 4, 0, 2, 3]) },
  { t0: ROUNDS[1].res - 0.5, t1: ROUNDS[1].res + 0.9, fn: (t, R, P) => shotResolve(t, R, P, ROUNDS[1], { a: -0.5, D: 8.5, H: 11 }) },
  { t0: ROUNDS[1].res + 0.9, t1: ROUNDS[2].pick, fn: (t, R, P) => { shotResolve(t, R, P, ROUNDS[1], { a: -0.5 + (t - ROUNDS[1].res) * 0.25, D: 9.5, H: 12 }); for (const c of SPAM) { const a = env(t, c.t, c.t + 0.9, 0.05, 0.2); if (a > 0) chatBubble(R, c.x, c.y, c.who, c.msg, { alpha: a, scale: 1.55 * (0.85 + 0.15 * E.outBack(clamp((t - c.t) / 0.15))) }); } } },
  { t0: ROUNDS[2].pick, t1: ROUNDS[2].res - 0.5, fn: (t, R, P) => shotLineup(t, R, P, ROUNDS[2], [2, 0, 3], { t0: ROUNDS[2].pick }) },
  { t0: ROUNDS[2].res - 0.5, t1: ROUNDS[2].res + 0.8, fn: (t, R, P) => shotResolve(t, R, P, ROUNDS[2], { a: 2.9, D: 9, H: 8 }) },
  { t0: ROUNDS[2].res + 0.8, t1: ROUNDS[3].pick, fn: shotFaceoff },
  { t0: ROUNDS[3].pick, t1: ROUNDS[3].res, fn: shotFinal },
];
