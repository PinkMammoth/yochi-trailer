// ACT I — THE CALL (0 → 18.955)
// A visor deciding. A rival. Thousands. UP / OR / DOWN. Stakes. The wait. Silence. Green.
import { clamp, lerp, E, smooth, noise1, shake, pulse, env, rgba, keys, hash1 } from '../core/math.js';
import { M, BEAT, BAR, bar, heart } from '../core/music.js';
import { drawHelmet, crowdSilhouette, RGB, C } from '../elements/helmet.js';
import { Cam, drawSky, drawFloor, floorPool, strikeLine, drawCandle, drawCandleBox, dust } from '../elements/world.js';
import { drawCrowd, drawCrowdTop } from '../elements/crowd.js';
import { headline, kicker, money, chatBubble, nameTag, fmtUSDC } from '../elements/type.js';
import { bokeh, stream, shockwave, confetti, speedLines, timerHUD } from '../elements/fx.js';
import { drawDotText, composeFace, drawFaceGrid } from '../elements/led.js';
import { world, price1, hiLo, pickOf, pickTime, ledFor, eyesFor, lookAt, tennis, CAST, CANDLE_Z, PEARL, CS } from './common.js';

const WHITE = RGB.text;
const secsLeft = (t) => M.GAP - t;

// ---------------------------------------------------------------------------
// helpers
function flipEyes(lt) {
  // indecision: flip ▲/▼, accelerating toward the lock at 1.33
  const flips = [0, 0.23, 0.46, 0.63, 0.78, 0.9, 1.0, 1.08, 1.15, 1.2, 1.25, 1.29];
  let n = 0; for (const f of flips) if (lt >= f) n++;
  return n % 2 ? 'up' : 'down';
}
function candleCol(p) { return p > 0.05 ? RGB.green : p < -0.05 ? RGB.red : [235, 245, 255]; }

// Standard reverse angle: behind the crowd, looking at the candle.
function behindCam(t, o = {}) {
  return new Cam({ x: o.x ?? 0.3, y: o.y ?? 3.3, z: CANDLE_Z + (o.d ?? 24), yaw: Math.PI, pitch: o.pitch ?? -0.035, f: o.f ?? 2100, roll: o.roll || 0 });
}
function drawArena(R, cam, t, o = {}) {
  const { crowd, hero } = world();
  const p = o.price ?? price1(t);
  const col = o.candleCol || candleCol(p);
  drawSky(R, cam, { hor: o.hor || [30, 26, 58], band: o.band ?? 1.2 });
  drawFloor(R, cam);
  floorPool(R, cam, 0, CANDLE_Z, 10 + Math.abs(p) * 2, col, (o.poolK ?? 1) * (0.7 + Math.min(1.2, Math.abs(p) * 0.4)));
  strikeLine(R, cam, CANDLE_Z, -60, 60, { phase: t * 0.25, k: o.lineK ?? 1 });
  const [hi, lo] = o.hilo || hiLo(price1, 0, t);
  const cnd = drawCandle(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: (Math.max(hi, p) + 0.12) * CS, lo: (Math.min(lo, p) - 0.12) * CS, w: o.cw ?? 3.0, col, k: o.candleK ?? 1, emit: o.emit ?? 1, flat: o.flat });
  drawCrowd(R, cam, crowd, o.st || ((m) => ({})), {
    back: false, lit: [lerp(col[0], 120, 0.5), lerp(col[1], 140, 0.5), lerp(col[2], 200, 0.5)], key: { x: 0, y: -0.3, col: [lerp(col[0], 255, 0.3), lerp(col[1], 255, 0.3), lerp(col[2], 255, 0.3)], k: 0.6 }, rim: { col: [lerp(col[0], 235, 0.35), lerp(col[1], 245, 0.35), lerp(col[2], 255, 0.35)], k: o.rimK ?? 1.0 },
    fogCol: [22, 19, 42], fogNear: 4, fogFar: 42, near: o.near ?? 1.6, light: [0, CANDLE_Z],
  });
  return cnd;
}
function crowdStateBack(t, extra) {
  return (m) => {
    const pk = t >= pickTime(m) ? pickOf(m) : 0;
    const look = lookAt(t, m);
    const s = { led: ledFor(pk), ledI: pk ? 1 : 0.45, jump: look * 0.05, roll: -look * 0.04 * (m.r2 - 0.5) };
    if (m.hero) Object.assign(s, { shell: PEARL, stripes: 'y', accent: C.cyan, led: RGB.green, ledI: 1 });
    if (m.rival) Object.assign(s, { shell: CAST.exit.shell, stripes: 'one', accent: C.red, led: RGB.red, ledI: 1 });
    return extra ? Object.assign(s, extra(m, s)) : s;
  };
}

// God's-eye arena: the ring of players around the candle, seen from above.
export function eyeCam(o) {
  const a = o.a ?? 0, D = o.D ?? 16, H = o.H ?? 34;
  const cam = new Cam({ x: Math.sin(a) * D + (o.x || 0), y: H, z: CANDLE_Z + Math.cos(a) * D, yaw: a + Math.PI, pitch: -Math.atan2(H - (o.lookY ?? 0), D), f: o.f ?? 1100, roll: o.roll || 0 });
  return cam;
}
export function drawEye(R, cam, t, o = {}) {
  const { crowd } = world();
  const p = o.price ?? price1(t);
  const col = o.candleCol || candleCol(p);
  const { b, g } = R;
  // floor: dark with the candle's light pool and the strike line
  b.fillStyle = '#08070e'; b.fillRect(0, 0, 1920, 1080);
  floorPool(R, cam, 0, CANDLE_Z, 16 + Math.abs(p) * 3, col, (o.poolK ?? 1.2) * (0.8 + Math.min(1.5, Math.abs(p) * 0.4)));
  floorPool(R, cam, 0, CANDLE_Z, 40, [60, 50, 120], 0.5);
  strikeLine(R, cam, CANDLE_Z, -70, 70, { phase: t * 0.2, width: cam.y > 60 ? 2 : 3, k: (o.lineK ?? 1) * (cam.y > 60 ? 0.55 : 1) });
  drawCrowdTop(R, cam, crowd, o.st || ((m) => ({})), { fogCol: [16, 14, 30], fogNear: 90, fogFar: 300, keyCol: col, keyK: 0.8 + Math.min(1, Math.abs(p) * 0.3), squash: o.squash ?? 0.8 });
  const [hi, lo] = o.hilo || hiLo(price1, 0, t);
  const top = drawCandleBox(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: (Math.max(hi, p) + 0.1) * CS, lo: (Math.min(lo, p) - 0.1) * CS, w: 3.0, col, k: o.candleK ?? 1, flat: o.flat });
  return top;
}
function crowdStateTop(t, extra) {
  return (m) => {
    const pk = t >= pickTime(m) ? pickOf(m) : 0;
    const s = { led: ledFor(pk), ledI: pk ? 1 : 0.35 };
    if (m.hero) Object.assign(s, { pearl: true, stripes: 'y', led: RGB.green, ledI: 1.2 });
    if (m.rival) Object.assign(s, { led: RGB.red, ledI: 1.1 });
    return extra ? Object.assign(s, extra(m, s)) : s;
  };
}

// ---------------------------------------------------------------------------
// 0.00 – 1.50  ECU: a visor deciding. Locks ▲ on the first hit.
function shotECU(t, R, P) {
  const lt = t;
  const locked = t >= M.HIT1;
  const punch = locked ? E.outQuart((t - M.HIT1) / 0.12) : 0;
  const zoom = lerp(1.0, 1.045, E.inOutQuad(t / 1.33)) + punch * 0.06;
  const [sx, sy] = shake(t, M.HIT1, 10, 0.3, 30, 1);
  bokeh(R, t, { n: 46, seed: 3, y0: 120, h: 900, r: 46, a: 0.2, dx: -t * 30 });
  const s = 720 * zoom;
  const eyes = locked ? 'up' : flipEyes(lt);
  const led = locked ? RGB.green : WHITE;
  const flash = locked ? pulse(t, M.HIT1, 0.09) : 0;
  drawHelmet(R, {
    x: 960 + sx - (1 - zoom) * 40, y: 476 + sy - 0.1 * (s - 720), s, type: 'dome', shell: PEARL, accent: C.cyan, stripes: 'y',
    face: { eyes, lookY: locked ? 0 : (eyes === 'up' ? -0.6 : 0.6) }, led, ledI: 1 + flash * 1.5, yaw: -0.06 + noise1(t * 0.7) * 0.02, pitch: 0.02,
    status: locked ? C.green : null, body: 'bust',
    key: { x: -0.55, y: -0.45, col: [175, 215, 255], k: 0.6 }, rim: { x: 0.9, y: -0.35, col: RGB.cyan, k: 1.1 },
  });
  timerHUD(R, secsLeft(t), { y: 70, alpha: 0.95 });
  P.ca = 0.0022 + flash * 0.01; P.flash = flash * 0.18; P.bloom = 0.85 + flash;
  P.vignette = 0.65;
}

// 1.50 – 1.86  Two-shot: a rival locks ▼ beside you. Side-eye.
function shotTwo(t, R, P) {
  const lt = t - M.HIT2;
  const dolly = E.outCubic(lt / 0.36);
  const [sx, sy] = shake(t, M.HIT2, 8, 0.25, 28, 2);
  bokeh(R, t, { n: 70, seed: 5, y0: 160, h: 700, r: 30, a: 0.22 });
  const sc = lerp(1.08, 1.0, dolly);
  const look = E.outBack(clamp((lt - 0.12) / 0.14));
  drawHelmet(R, {
    x: 1300 + sx, y: 520 + sy, s: 205 * sc, type: 'bear', shell: CAST.exit.shell, accent: C.red, stripes: 'one',
    face: { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk', lookX: -look * 1.2 }, led: RGB.red, ledI: 1 + pulse(t, M.HIT2, 0.08), yaw: -0.25 - look * 0.1,
    status: C.red, body: 'bust', key: { x: 0.5, y: -0.4, col: [255, 170, 190], k: 0.35 }, rim: { x: -0.8, y: -0.5, col: RGB.cyan, k: 0.9 },
  });
  drawHelmet(R, {
    x: 610 + sx, y: 560 + sy, s: 225 * sc, type: 'dome', shell: PEARL, accent: C.cyan, stripes: 'y',
    face: { eyes: 'up', lookX: look * 1.6 }, led: RGB.green, yaw: 0.22 + look * 0.1,
    status: C.green, body: 'bust', key: { x: -0.6, y: -0.45, col: [180, 255, 170], k: 0.5 }, rim: { x: 0.9, y: -0.35, col: RGB.cyan, k: 1.1 },
  });
  const ta = clamp((lt - 0.05) / 0.08);
  nameTag(R, 610 + sx, 245 + sy, 'YOU', { alpha: ta, size: 32 });
  nameTag(R, 1300 + sx, 222 + sy, 'EXIT_LIQUIDITY', { alpha: clamp((lt - 0.1) / 0.08), size: 26, col: RGB.red });
  timerHUD(R, secsLeft(t), { y: 70 });
  P.flash = pulse(t, M.HIT2, 0.07) * 0.12; P.ca = 0.003;
}

// 1.86 – 2.40  Pull out: thousands. At 2.22 every head snaps up.
function shotSea(t, R, P) {
  const { crowd, hero, rival } = world();
  const lt = t - M.HIT3;
  const u = E.outCubic(lt / 0.54);
  const cam = new Cam({ x: lerp(0.3, 0.15, u), y: lerp(3.4, 4.7, u), z: lerp(CANDLE_Z + 4.6, CANDLE_Z + 2.4, u), pitch: lerp(-0.27, -0.33, u), f: 1150 });
  const [sx, sy] = shake(t, M.HIT3, 10, 0.3, 26, 3);
  cam.sx = sx; cam.sy = sy;
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.3 });
  drawFloor(R, cam);
  const snap = E.outBack(clamp((t - M.HIT4) / 0.12), 2.2);
  drawCrowd(R, cam, crowd, (m) => {
    const pk = t >= pickTime(m) - 0.5 ? pickOf(m) : 0;
    const d = m.r3 * 0.05;
    const lk = clamp((t - M.HIT4 - d) / 0.1) * 0.9;
    const s = { eyes: eyesFor(pk), led: ledFor(pk), ledI: pk ? 1 : 0.6, status: pk === 1 ? C.green : pk === -1 ? C.red : null, look: lk, jump: lk * 0.04 };
    if (m.hero) Object.assign(s, { eyes: 'up', led: RGB.green, ledI: 1, shell: PEARL, accent: C.cyan, stripes: 'y', status: C.green });
    if (m.rival) Object.assign(s, { eyes: 'down', led: RGB.red, ledI: 1, shell: CAST.exit.shell, accent: C.red, stripes: 'one', status: C.red });
    return s;
  }, { lit: [125, 150, 215], key: { x: 0.0, y: -0.5, col: [210, 232, 255], k: 0.55 }, rim: { x: 0.1, y: -1, col: RGB.cyan, k: 0.75 + snap * 0.2 }, fogCol: [26, 22, 50], fogNear: 3, fogFar: 60 });
  const hp = cam.p(hero.x, hero.h + 0.55, hero.z);
  if (hp) nameTag(R, hp[0], hp[1] - 10, 'YOU', { alpha: clamp(lt / 0.1), size: 18 });
  timerHUD(R, secsLeft(t), { y: 70 });
  P.bloom = 0.75; P.flash = pulse(t, M.HIT3, 0.08) * 0.1;
}

// 2.40 – 5.15  What they're watching. Every tick, every head.
const CHATS = [
  { t: 3.72, who: 'HANNAH_T', msg: 'pump pump pump pump', sx: 1480, sy: 300 },
  { t: 4.25, who: 'RAJ_HL', msg: 'anyone actually on dump or is it all talk', sx: 520, sy: 250 },
];
// 2.40 – 3.66  The reveal: from above, the arena is an eye. The candle is its pupil.
// 3.66 – 5.15  Every tick, every head (tennis).
function shotWatch(t, R, P) {
  if (t < M.CLAP_A) {
    const u = (t - M.BASS_OUT_1) / (M.CLAP_A - M.BASS_OUT_1);
    const cam = eyeCam({ a: lerp(0.12, 0.0, u), D: lerp(34, 20, E.outCubic(u)), H: lerp(92, 46, E.outCubic(u)), f: 1150 });
    const top = drawEye(R, cam, t, { st: crowdStateTop(t) });
    timerHUD(R, secsLeft(t));
    P.bloom = 0.95; P.halo = 0.45;
    return;
  }
  const { crowd } = world();
  const lt = t - M.CLAP_A;
  const tn = tennis(t);
  const cc = tn > 0 ? RGB.green : RGB.red;
  const cam = new Cam({ x: -0.3, y: 2.55, z: CANDLE_Z + 1.2, yaw: 0.06, pitch: -0.16, f: 1700 });
  const [sx, sy] = shake(t, M.CLAP_A, 6, 0.2, 30, 5); cam.sx = sx; cam.sy = sy;
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.0 });
  drawFloor(R, cam);
  tennisCrowd(R, cam, t, cc);
  for (const c of CHATS) {
    const a = env(t, c.t, c.t + 1.2, 0.08, 0.25);
    if (a <= 0) continue;
    chatBubble(R, c.sx, c.sy, c.who, c.msg, { alpha: a, scale: 0.9 + 0.1 * E.outBack(clamp((t - c.t) / 0.2)) });
  }
  timerHUD(R, secsLeft(t));
  P.bloom = 0.85;
}

function tennisCrowd(R, cam, t, cc) {
  const { crowd } = world();
  drawCrowd(R, cam, crowd, (m) => {
    const pk = t >= pickTime(m) ? pickOf(m) : 0;
    const look = tennis(t, 0.015 * m.r3) * 0.95;
    const s = { eyes: eyesFor(pk), led: ledFor(pk), ledI: pk ? 1 : 0.6, status: pk === 1 ? C.green : pk === -1 ? C.red : null, look, jump: look * 0.05, roll: look * 0.04 * (m.r2 - 0.5) };
    if (m.hero) Object.assign(s, { eyes: 'up', led: RGB.green, shell: PEARL, accent: C.cyan, stripes: 'y', status: C.green });
    if (m.rival) Object.assign(s, { eyes: 'down', led: RGB.red, shell: CAST.exit.shell, accent: C.red, stripes: 'one', status: C.red });
    return s;
  }, { lit: [lerp(cc[0], 140, 0.6), lerp(cc[1], 150, 0.6), lerp(cc[2], 210, 0.6)], key: { x: 0, y: -0.4, col: [lerp(cc[0], 255, 0.45), lerp(cc[1], 255, 0.45), lerp(cc[2], 255, 0.45)], k: 0.8 }, rim: { x: 0.1, y: -1, col: RGB.cyan, k: 0.7 }, fogCol: [26, 22, 50], fogNear: 4, fogFar: 40, near: 1.2 });
}

// 5.15 / 5.495 / 5.84   UP  /  OR  /  DOWN
function shotUpDown(t, R, P) {
  const { b, g } = R;
  // one word per kick (the 3-3-2 figure): UP, OR, DOWN. The camera drops a notch on each of the
  // last two, landing on the whole choice, which then holds through the groove's first beat.
  const tU = M.HIT_A, tO = M.HIT_B, tD = M.HIT_C;
  const k1 = E.outExpo((t - tU) / 0.16), k2 = E.outExpo((t - tO) / 0.16), k3 = E.outExpo((t - tD) / 0.16);
  let lineY = 930;
  lineY = lerp(lineY, 760, t >= tO ? k2 : 0);
  lineY = lerp(lineY, 562, t >= tD ? k3 : 0);
  if (t >= tD) lineY += 14 * E.inOutQuad(clamp((t - tD - 0.2) / (M.BACK_IT - tD - 0.2)));  // a slow settle while it breathes
  const vel = (t >= tD ? (1 - k3) : t >= tO ? (1 - k2) : (1 - k1));
  const whipDir = t >= tO ? -1 : 1;
  // background
  const bg = b.createLinearGradient(0, lineY - 900, 0, lineY + 900);
  bg.addColorStop(0, '#07060c'); bg.addColorStop(0.5, '#171430'); bg.addColorStop(0.5, '#0a0913'); bg.addColorStop(1, '#040308');
  b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
  // words first: giant letters stand on / hang from the strike line, behind the players
  const slam = (t0) => 1 + 0.16 * (1 - E.outQuart((t - t0) / 0.2));
  if (t >= tU) {
    headline(R, 'UP', { x: 960, y: lineY - 14, size: 600, scale: slam(tU), col: [170, 255, 150], glow: 0.7, glowCol: RGB.green, halo: 0.6, weight: 0.035 });
  }
  if (t >= tD) {
    const sD = slam(tD), capH = 0.7 * 480;
    headline(R, 'DOWN', { x: 960, y: lineY + 18 + capH * sD, size: 480, scale: sD, col: [255, 120, 146], glow: 0.7, glowCol: RGB.red, halo: 0.6, weight: 0.035 });
  }
  // the players standing on the line (and their reflections in the glass); they step out of OR's way
  const orOn = t >= tO, gap = 80;
  for (let i = 0; i < 64; i++) {
    const x = (i + 0.5) * 30 + (hash1(i) - 0.5) * 10;
    if (orOn && Math.abs(x - 960) < gap) continue;
    const r = 7.5 + hash1(i * 3.1) * 1.2;
    const pk = hash1(i * 7.3) < 0.52 ? 1 : -1;
    for (const [sy, al] of [[1, 1], [-1, 0.3]]) {
      b.save(); b.translate(x, lineY - sy * r * 2.4); b.scale(r, sy * r);
      b.fillStyle = `rgba(22,20,38,${al})`; crowdSilhouette(b, ['dome', 'bear', 'horns', 'cat', 'frog'][i % 5]); b.fill();
      b.restore();
    }
    const c = pk === 1 ? RGB.green : RGB.red;
    const ey = lineY - r * 2.4 + r * 0.05;
    g.fillStyle = rgba(c, 0.9); g.fillRect(x - 5, ey - 2, 3, 3); g.fillRect(x + 2, ey - 2, 3, 3);
    b.fillStyle = rgba(c); b.fillRect(x - 5, ey - 2, 3, 3); b.fillRect(x + 2, ey - 2, 3, 3);
  }
  // strike line, parting for OR
  b.fillStyle = rgba(RGB.cyan); g.fillStyle = rgba(RGB.cyan, 0.9);
  for (let x = -20; x < 1940; x += 34) { if (orOn && x + 20 > 960 - gap && x < 960 + gap) continue; b.fillRect(x, lineY - 2, 20, 4); g.fillRect(x, lineY - 4, 20, 8); }
  if (orOn) kicker(R, 'OR', 960, lineY + 2, { size: 76 * slam(tO), col: [245, 243, 255], align: 'center', track: 0.18, glow: 0.45, halo: true });
  // HUD
  timerHUD(R, secsLeft(t), { y: 70, alpha: 0.9 });
  P.blurVec = [0, vel * 0.09 * whipDir]; P.bloom = 1.0;
  P.flash = (pulse(t, tU, 0.06) + pulse(t, tO, 0.06) + pulse(t, tD, 0.06)) * 0.15 + pulse(t, M.GROOVE, 0.08) * 0.06;
  P.ca = 0.003 + vel * 0.01;
}

// 6.76 – 7.68  BACK IT. Stakes stream inward like spokes; the pot climbs.
function shotBackIt(t, R, P) {
  const lt = t - M.BACK_IT;
  const cam = eyeCam({ a: lerp(0.22, 0.12, lt / 0.92), D: 13, H: lerp(38, 35, lt / 0.92), f: 1100 });
  const top = drawEye(R, cam, t, { st: crowdStateTop(t) });
  const { crowd } = world();
  const c0 = cam.p(0, 0.6, CANDLE_Z);
  let n = 0;
  for (const m of crowd) {
    if (m.r2 > 0.018 || m.rad > 26) continue;
    const t0 = M.BACK_IT - 0.15 + m.r3 * 0.75;
    const u = (t - t0) / 0.5;
    if (u < 0 || u > 1.2) continue;
    const p = cam.p(m.x, m.h, m.z); if (!p || !c0) continue;
    const pk = pickOf(m);
    stream(R, p[0], p[1], c0[0], c0[1], u, { col: pk === 1 ? RGB.green : pk === -1 ? RGB.red : RGB.cyan, w: 2.5, lift: 30, len: 0.3, label: n++ % 3 === 0 ? '+' + [25, 50, 10, 100, 5][m.id % 5] : null, labelSize: 18 });
  }
  const pot = 1208 + E.outCubic(clamp(lt / 0.9)) * 11200;
  if (top) {
    kicker(R, 'MONSTER POT', top[0], top[1] - 120, { align: 'center', size: 16, col: RGB.cyan });
    money(R, '$' + fmtUSDC(pot, 0), top[0], top[1] - 62, { size: 58, col: RGB.cyan, glow: 0.7 });
  }
  headline(R, 'BACK IT.', { x: 960, y: 262, size: 210, inT: lt, outT: M.BACK_IT + BAR / 2 - t, glow: 0.22, rule: { col: RGB.cyan } });
  timerHUD(R, secsLeft(t));
  P.bloom = 0.95; P.halo = 0.45; P.flash = pulse(t, M.BACK_IT, 0.07) * 0.12;
}

// Portrait: a player puts money on it.
function portrait(t, R, P, o) {
  const lt = t - o.t0;
  const { b } = R;
  const pk = o.pick;
  const col = pk === 1 ? RGB.green : RGB.red;
  bokeh(R, t, { n: 50, seed: o.seed, y0: 80, h: 900, r: 44, a: 0.16, cols: [col, col, WHITE, RGB.cyan], dx: -lt * 60 });
  const slide = E.outCubic(lt / 0.3);
  const cx = lerp(560, 600, slide);
  drawHelmet(R, {
    x: cx, y: 520, s: 250, type: o.c.type, shell: o.c.shell, accent: o.c.accent, stripes: o.c.stripes,
    face: o.face(lt), led: col, yaw: 0.28 - slide * 0.06, pitch: 0.02, status: col, body: 'bust',
    key: { x: 0.6, y: -0.4, col: pk === 1 ? [190, 255, 180] : [255, 190, 200], k: 0.55 }, rim: { x: -0.85, y: -0.4, col: RGB.cyan, k: 1.0 },
  });
  // name + stake
  const na = clamp((lt - 0.06) / 0.1);
  const tx = lerp(1030, 990, slide);
  headline(R, o.c.name, { x: tx, y: 480, size: o.nameSize || 110, align: 'left', inT: lt - 0.06, glow: 0.1, kicker: { text: o.tagline, col: [190, 184, 222], size: 23 } });
  const sa = clamp((lt - 0.16) / 0.08);
  const stakeTxt = (pk === 1 ? '▲ ' : '▼ ') + o.stake + ' USDC';
  money(R, stakeTxt, tx, 600, { size: 76, col, align: 'left', alpha: sa, scale: 1 + 0.2 * (1 - E.outQuart((lt - 0.16) / 0.18)) });
  // stake flies off to the pot (right edge)
  if (o.clan) kicker(R, 'CLAN · ' + o.clan, tx, 662, { size: 17, col: [141, 135, 176], alpha: clamp((lt - 0.3) / 0.1), glow: 0 });
  if (lt > 0.36) stream(R, tx + 330, 575, 2100, 380, (lt - 0.36) / 0.33, { col, w: 5, lift: 90, len: 0.5 });
  timerHUD(R, secsLeft(t), { y: 70 });
  P.flash = pulse(t, o.t0, 0.06) * 0.12; P.bloom = 0.9;
}
// three quick stakes, 3 eighths each, from the clap after BACK IT. to the pre-drop (bar 5)
const PORTRAIT_LEN = 1.5 * BEAT;
const PORTRAITS = [
  { t0: M.BACK_IT + BAR / 2, c: CAST.oxtom, pick: 1, stake: 25, seed: 11, tagline: 'CALLS IT', clan: 'FROGS', face: (lt) => ({ eyes: 'up', mouth: 'smile' }) },
  { t0: M.BACK_IT + BAR / 2 + PORTRAIT_LEN, c: CAST.exit, pick: -1, stake: 100, seed: 12, tagline: 'FADES THE CROWD', nameSize: 96, clan: 'BEAR CARTEL', face: (lt) => ({ eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk' }) },
  { t0: M.BACK_IT + BAR / 2 + 2 * PORTRAIT_LEN, c: CAST.soup, pick: 1, stake: 5, seed: 13, tagline: 'SENDS IT', clan: 'SOUP KITCHEN', face: (lt) => ({ eyeL: 'gtL', eyeR: 'ltR', mouth: 'wobble', lookY: Math.sin(lt * 40) * 0.5 }) },
];

// 9.75 – 11.59  The wait. Descending on the pupil while the wick whips.
function shotWait(t, R, P) {
  const lt = t - M.PREDROP;
  const u = E.inQuad(lt / 0.92);
  const cam = eyeCam({ a: lerp(-0.3, -0.05, lt / 0.92), D: lerp(17, 11, u), H: lerp(30, 13, u), f: 1150, lookY: 2 });
  const top = drawEye(R, cam, t, { st: crowdStateTop(t) });
  const pot = 12408 + lt * 180;
  if (top) {
    kicker(R, 'MONSTER POT', top[0], top[1] - 130, { align: 'center', size: 16, col: RGB.cyan });
    money(R, '$' + fmtUSDC(pot, 0), top[0], top[1] - 72, { size: 58, col: RGB.cyan, glow: 0.7 });
  }
  const chats = [
    { t: M.PREDROP + 0.12, who: 'DEVON', msg: 'im holding this dump til the close', x: 1420, y: 820 },
    { t: M.PREDROP + 0.8, who: 'COPE_DEALER', msg: '25 usdc dump. put up or shut up', x: 470, y: 760 },
  ];
  for (const c of chats) {
    const a = env(t, c.t, c.t + 1.0, 0.06, 0.2);
    if (a > 0) chatBubble(R, c.x, c.y, c.who, c.msg, { alpha: a });
  }
  timerHUD(R, secsLeft(t));
  P.bloom = 1.0; P.halo = 0.45;
}

// 10.67 – 11.595  Callback: every head, every 8th note. Faster.
function shotTennisFast(t, R, P) {
  const tn = tennis(t);
  const cc = tn > 0 ? RGB.green : RGB.red;
  const lt = t - 10.67;
  const cam = new Cam({ x: 1.1, y: 2.6, z: CANDLE_Z + 0.8 + lt * 0.6, yaw: -0.12, pitch: -0.17, f: 1750 });
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.0 });
  drawFloor(R, cam);
  tennisCrowd(R, cam, t, cc);
  timerHUD(R, secsLeft(t));
  P.bloom = 0.9; P.flash = 0.03;
}

// 11.595 – 13.435  The roll: faces and the wick, cut on the beat.
function shotRoll(t, R, P) {
  const i = Math.floor((t - M.ROLL) / BEAT);
  const lt = t - (M.ROLL + i * BEAT);
  const col = [RGB.red, RGB.green, RGB.red, RGB.green][i % 4];
  if (i % 2 === 0) {
    // faces
    const who = [CAST.soup, CAST.exit, CAST.oxtom, CAST.cope][i / 2 % 4 | 0];
    const pk = who === CAST.exit || who === CAST.cope ? -1 : 1;
    const c = pk === 1 ? RGB.green : RGB.red;
    bokeh(R, t, { n: 40, seed: 20 + i, y0: 100, h: 900, r: 50, a: 0.18, cols: [c, WHITE, RGB.cyan] });
    const face = who === CAST.soup ? { eyeL: 'gtL', eyeR: 'ltR', mouth: 'wobble' } : who === CAST.exit ? { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk' } : { eyes: 'wide', mouth: 'o' };
    const z = 1 + lt * 0.12;
    drawHelmet(R, {
      x: 960 + (i % 4 === 0 ? -80 : 80), y: 520, s: 470 * z, type: who.type, shell: who.shell, accent: who.accent, stripes: who.stripes,
      face, led: c, yaw: i % 4 === 0 ? 0.18 : -0.18, status: c, body: 'bust',
      key: { x: 0.2, y: -0.5, col: pk === 1 ? [190, 255, 180] : [255, 190, 200], k: 0.55 }, rim: { x: -0.85, y: -0.4, col: RGB.cyan, k: 1.0 },
    });
    if (who === CAST.soup) {
      // pixel sweat drop
      const dy = (lt * 900) % 260;
      drawDotText(R, '•', 960 - 80 + 250 * z, 330 * z + dy, 14, RGB.cyan, { rows: 9 });
    }
  } else {
    // the wick, close
    const cam = new Cam({ x: 0, y: 1.6, z: CANDLE_Z + 10, yaw: Math.PI, pitch: 0.06, f: 1150 });
    drawSky(R, cam, { hor: [28, 24, 54], band: 0.8 });
    drawFloor(R, cam);
    const p = price1(t);
    const cc = candleCol(p);
    floorPool(R, cam, 0, CANDLE_Z, 5, cc, 1);
    strikeLine(R, cam, CANDLE_Z, -30, 30, { phase: t * 0.3, width: 4 });
    const [hi, lo] = hiLo(price1, 0, t);
    drawCandle(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: (hi + 0.12) * CS, lo: (lo - 0.12) * CS, w: 2.6, col: cc, k: 1.1, emit: 1.3 });
    speedLines(R, t, { vertical: true, n: 40, alpha: 0.12, col: cc });
  }
  timerHUD(R, secsLeft(t), { y: 70 });
  P.flash = pulse(t, M.ROLL + i * BEAT, 0.05) * 0.08; P.ca = 0.004; P.bloom = 1.0;
}

// 13.435 – 14.50  YOU, waiting. The candle flickers in your visor.
function shotHeroWait(t, R, P) {
  const lt = t - bar(7);
  const z = lerp(1.0, 1.25, E.inQuad(lt / 1.07));
  const p = price1(t);
  const cc = candleCol(p);
  bokeh(R, t, { n: 40, seed: 31, y0: 100, h: 900, r: 50, a: 0.14 });
  const v = drawHelmet(R, {
    x: 960, y: 470 + (z - 1) * 60, s: 560 * z, type: 'dome', shell: PEARL, accent: C.cyan, stripes: 'y',
    face: { eyes: 'up', lookY: -clamp(p, -1, 1) * 0.8 }, led: RGB.green, yaw: 0.04, status: C.green, body: 'bust',
    key: { x: 0, y: -0.3, col: [lerp(cc[0], 255, 0.3), lerp(cc[1], 255, 0.3), lerp(cc[2], 255, 0.3)], k: 0.7 }, rim: { x: 0.9, y: -0.35, col: RGB.cyan, k: 1.1 },
  });
  // the candle reflected in the visor glass
  const { b, g } = R;
  const vx = 960 + 0.33 * 560 * z, vy = 470 + (z - 1) * 60 + 0.05 * 560 * z;
  const hgt = clamp(Math.abs(p) * 90, 6, 200) * z;
  b.fillStyle = rgba(cc, 0.28); b.fillRect(vx - 6 * z, p > 0 ? vy - hgt : vy, 12 * z, hgt);
  g.fillStyle = rgba(cc, 0.35); g.fillRect(vx - 9 * z, p > 0 ? vy - hgt : vy, 18 * z, hgt);
  timerHUD(R, secsLeft(t), { y: 70, pop: pulse(t, M.GAP - 1, 0.2) });
  P.vignette = 0.75; P.bloom = 0.9;
}

// 14.50 – 15.275  SILENCE. The eye holds still. One twitch at 14.81.
function shotFreeze(t, R, P) {
  const cam = eyeCam({ a: -0.02, D: 11, H: 24, f: 1150, lookY: 1 });
  const frozenT = 14.46;
  const tw = t - M.STAB;
  const twitch = tw > 0 && tw < 0.14 ? 0.1 * (1 - tw / 0.14) : 0;
  drawEye(R, cam, frozenT, { price: twitch, st: crowdStateTop(frozenT), hilo: hiLo(price1, 0, frozenT), candleCol: twitch > 0 ? RGB.green : [235, 245, 255], poolK: 0.7, flat: twitch <= 0 });
  timerHUD(R, 0, { col: RGB.red });
  P.satBase = 0.0; P.satGlow = twitch > 0 ? 1 : 0.12; P.monoTint = 0.3; P.bloom = 0.6; P.grain = 0.065; P.vignette = 0.85;
  P.exposure = 0.9;
}

// 15.275 – 15.735  Triple take: the candle erupts, three angles on three stabs.
function shotErupt(t, R, P) {
  const p = price1(t);
  if (t < M.STAB2) {
    const lt = t - M.DROP1;
    const cam = new Cam({ x: 0, y: 0.7, z: CANDLE_Z + 7, yaw: Math.PI, pitch: 0.34, f: 1000 });
    drawSky(R, cam, { hor: [20, 60, 30], band: 0.5, bandCol: RGB.green });
    drawFloor(R, cam);
    floorPool(R, cam, 0, CANDLE_Z, 8, RGB.green, 2);
    strikeLine(R, cam, CANDLE_Z, -30, 30, { width: 5 });
    drawCandle(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: (p + 0.3) * CS, lo: -0.3 * CS, w: 2.6, col: RGB.green, k: 1.4, emit: 2 });
    speedLines(R, t, { vertical: true, n: 70, alpha: 0.35, col: RGB.green, glow: true });
    P.invert = lt < 0.034 ? 1 : 0; if (lt < 0.034) { P.satBase = 0; P.satGlow = 0; } P.blurVec = [0, 0.05]; P.flash = 0.2;
  } else if (t < M.STAB3) {
    const lt = t - M.STAB2;
    bokeh(R, t, { n: 50, seed: 41, y0: 100, h: 900, r: 44, a: 0.25, cols: [RGB.green, RGB.green, WHITE] });
    const up = E.outQuart(lt / 0.1);
    drawHelmet(R, {
      x: 1310, y: 540, s: 210, type: 'bear', shell: CAST.exit.shell, accent: C.red, stripes: 'one',
      face: { eyes: 'x', mouth: 'frown' }, led: RGB.red, yaw: -0.25, pitch: -0.3 * up, status: C.red, body: 'bust',
      key: { x: 0, y: -1, col: [120, 255, 100], k: 0.9 }, rim: { x: -0.8, y: -0.5, col: RGB.cyan, k: 0.9 },
    });
    drawHelmet(R, {
      x: 620, y: 560, s: 235, type: 'dome', shell: PEARL, accent: C.cyan, stripes: 'y',
      face: { eyes: 'dollar', mouth: 'grin' }, led: RGB.green, ledI: 1.4, yaw: 0.2, pitch: -0.3 * up, status: C.green, body: 'bust',
      key: { x: 0, y: -1, col: [140, 255, 120], k: 1.0 }, rim: { x: 0.9, y: -0.35, col: RGB.cyan, k: 1.1 },
    });
    P.flash = 0.25 * (1 - lt / 0.115); P.ca = 0.01;
    winTitle(R, t);
  } else {
    shotWin(t, R, P);
    return;
  }
  P.bloom = 1.3; P.ca = Math.max(P.ca, 0.008);
}

// WIN USDC. lands on the second stab and holds, fully up, through the rest of the triple take until
// the cut to the payout.
function winTitle(R, t) {
  headline(R, 'WIN USDC.', { x: 960, y: 990, size: 190, inT: t - M.STAB2, inDur: 0.12, col: [250, 250, 255], glow: 0.25, glowCol: RGB.green, halo: 1.6, rule: { col: RGB.green } });
}

// 15.505 – 16.43  The candle erupts toward us; the pot pays outward.
function shotWin(t, R, P) {
  const { crowd } = world();
  const lt = t - M.STAB3;
  const cam = eyeCam({ a: lerp(0.05, 0.16, lt / 1.5), D: lerp(9, 11, E.outCubic(lt)), H: lerp(40, 44, lt / 1.5), f: 1000 });
  const [sx, sy] = shake(t, M.STAB3, 18, 0.7, 20, 4);
  cam.sx = sx; cam.sy = sy;
  drawEye(R, cam, t, {
    hilo: [price1(t), -0.2], candleCol: RGB.green, poolK: 2.2,
    st: crowdStateTop(t, (m, s) => {
      const pk = pickOf(m);
      if (pk === 1 || m.hero) return { led: RGB.green, ledI: 1.4 + 0.4 * Math.sin((t - M.STAB3) * 10 + m.ph), jump: Math.abs(Math.sin((t - M.STAB3) * 9 + m.ph)) * 0.35 };
      if (pk === -1) return { ledI: 0.25 };
      return {};
    }),
  });
  shockwave(R, cam, 0, CANDLE_Z, t - M.STAB3, { r: 34, col: RGB.green, dur: 1.2, k: 1.4 });
  const c0 = cam.p(0, 2, CANDLE_Z);
  let n = 0;
  for (const m of crowd) {
    if ((pickOf(m) !== 1 && !m.hero) || m.rad > 26 || (m.r2 > 0.07 && !m.hero)) continue;
    const t0 = M.STAB4 + m.r3 * 0.45;
    const u = (t - t0) / 0.45;
    const p = cam.p(m.x, m.h, m.z); if (!p || !c0) continue;
    stream(R, c0[0], c0[1], p[0], p[1], u, { col: RGB.green, w: 3, lift: 60, len: 0.4 });
    if (u > 1 && u < 3.2 && (n++ % 3 === 0 || m.hero)) {
      const amt = m.hero ? 247 : 10 + (m.id * 37 % 90);
      money(R, '+' + fmtUSDC(amt), p[0], p[1] - 18 - (u - 1) * 12, { size: m.hero ? 30 : 17, col: RGB.green, alpha: clamp((3.2 - u) / 0.8), weight: 700 });
    }
  }
  confetti(R, 960, 540, t - M.STAB4, { n: 140, speed: 1700, seed: 3, spread: 6.2 });
  winTitle(R, t);
  P.bloom = 1.2; P.halo = 0.55; P.ca = 0.004;
  P.flash = pulse(t, M.STAB3, 0.08) * 0.25;
}

// 16.43 – 17.0  YOU: +247.00 USDC.
function shotPayoff(t, R, P) {
  const lt = t - 16.43;
  bokeh(R, t, { n: 50, seed: 44, y0: 100, h: 900, r: 44, a: 0.24, cols: [RGB.green, RGB.green, WHITE, RGB.cyan] });
  const z = 1 + lt * 0.12;
  drawHelmet(R, { x: 620, y: 560, s: 330 * z, type: 'dome', shell: PEARL, accent: C.cyan, stripes: 'y',
    face: { eyes: 'dollar', mouth: 'grin' }, led: RGB.green, ledI: 1.3, yaw: 0.22, status: C.green, body: 'bust',
    key: { x: 0.3, y: -0.8, col: [150, 255, 130], k: 0.9 }, rim: { x: 0.9, y: -0.35, col: RGB.cyan, k: 1.1 } });
  const cnt = 247 * E.outExpo(clamp(lt / 0.35));
  kicker(R, 'YOU', 1300, 330, { size: 24, col: RGB.cyan, align: 'center' });
  money(R, '+' + fmtUSDC(cnt), 1300, 470, { size: 150, col: RGB.green, glow: 0.8, scale: 1 + 0.15 * (1 - E.outQuart(lt / 0.2)) });
  kicker(R, 'USDC', 1300, 540, { size: 30, col: [245, 243, 255], align: 'center', track: 0.4, glow: 0 });
  kicker(R, 'CALLED IT · ▲ PUMP · 2.47X', 1300, 612, { size: 18, col: [168, 162, 200], align: 'center', alpha: clamp((lt - 0.15) / 0.1), glow: 0 });
  confetti(R, 620, 300, lt + 0.3, { n: 70, speed: 1100, seed: 7, spread: 2.4 });
  P.bloom = 1.1; P.flash = pulse(t, 16.43, 0.06) * 0.12;
}

// 17.0 – 18.955  The other side. POST THE L.
function shotL(t, R, P) {
  const lt = t - bar(9);
  bokeh(R, t, { n: 40, seed: 51, y0: 100, h: 900, r: 44, a: 0.12, cols: [RGB.red, WHITE, RGB.green] });
  const sag = E.inOutQuad(clamp(lt / 1.2));
  const face = lt < 0.5 ? { eyes: 'x', mouth: 'frown' } : { eyes: 'cry', mouth: 'frown' };
  drawHelmet(R, {
    x: 700, y: 520 + sag * 40, s: 300, type: 'bear', shell: CAST.exit.shell, accent: C.red, stripes: 'one',
    face, led: RGB.red, ledI: 0.9, yaw: 0.15, pitch: 0.25 * sag, roll: 0.06 * sag, status: C.red, body: 'bust',
    key: { x: 0.4, y: -0.6, col: [140, 150, 200], k: 0.35 }, rim: { x: -0.8, y: -0.5, col: RGB.cyan, k: 0.7 },
  });
  // tears (pixels)
  if (lt > 0.5) for (let i = 0; i < 2; i++) {
    const tt = ((lt - 0.5) * 1.6 + i * 0.5) % 1;
    drawDotText(R, '•', 700 + (i ? 105 : -95), 530 + tt * 160, 10, RGB.red, { rows: 9, intensity: 1 - tt });
  }
  // the L, posted
  const la = clamp((lt - 0.35) / 0.1);
  kicker(R, 'EXIT_LIQUIDITY', 1080, 382, { size: 20, col: RGB.red, alpha: la });
  money(R, '-100.00 USDC', 1080, 470, { size: 72, col: RGB.red, align: 'left', alpha: la, glow: 0.5 });
  headline(R, 'POST THE L', { x: 1080, y: 612, size: 100, align: 'left', inT: lt - 0.8, glow: 0.1, rule: { col: RGB.red, gap: 0.2 } });
  chatBubble(R, 1420, 790, 'THEO', 'watching exit_liquidity bottle it in real time', { alpha: env(t, 17.5, 18.8, 0.08, 0.2), nameCol: RGB.cyan });
  P.bloom = 0.8; P.satBase = 0.85;
}

export const ACT1 = [
  { t0: 0, t1: M.HIT2, fn: shotECU },
  { t0: M.HIT2, t1: M.HIT3, fn: shotTwo },
  { t0: M.HIT3, t1: M.BASS_OUT_1, fn: shotSea },
  { t0: M.BASS_OUT_1, t1: M.HIT_A, fn: shotWatch },
  { t0: M.HIT_A, t1: M.BACK_IT, fn: shotUpDown },
  { t0: M.BACK_IT, t1: PORTRAITS[0].t0, fn: shotBackIt },
  ...PORTRAITS.map((p, i) => ({ t0: p.t0, t1: i < PORTRAITS.length - 1 ? PORTRAITS[i + 1].t0 : M.PREDROP, fn: (t, R, P) => portrait(t, R, P, p) })),
  { t0: M.PREDROP, t1: 10.67, fn: shotWait },
  { t0: 10.67, t1: M.ROLL, fn: shotTennisFast },
  { t0: M.ROLL, t1: bar(7), fn: shotRoll },
  { t0: bar(7), t1: 14.50, fn: shotHeroWait },
  { t0: 14.50, t1: M.DROP1, fn: shotFreeze },
  { t0: M.DROP1, t1: 16.43, fn: shotErupt },
  { t0: 16.43, t1: bar(9), fn: shotPayoff },
  { t0: bar(9), t1: bar(10), fn: shotL },
];
