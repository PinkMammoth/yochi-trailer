// ACT IV & V — KNOWN / YOUR CALL (44.718 → 62.0)
// Last one standing. The crowd spells your name. A world of arenas. Your call. The Y.
import { clamp, lerp, E, noise1, shake, pulse, env, rgba, hash1, hash2, rngFrom, smooth } from '../core/math.js';
import { M, BEAT, BAR, bar, heart } from '../core/music.js';
import { drawHelmet, RGB, C } from '../elements/helmet.js';
import { drawPlayer } from '../elements/body.js';
import { Cam, drawSky, drawFloor, floorPool, strikeLine, drawCandleBox } from '../elements/world.js';
import { drawCrowd, drawCrowdTop } from '../elements/crowd.js';
import { bigWord, F, label, money, fmtUSDC } from '../elements/type.js';
import { bokeh, stream, shockwave, confetti, speedLines } from '../elements/fx.js';
import { dotMatrix, EYES, drawDotText } from '../elements/led.js';
import { drawLogo, LOGO_POLY, logoPath } from '../elements/logo.js';
import { world, CAST, CANDLE_Z, PEARL, CS, pickOf, ledFor } from './common.js';
import { drawBR, BR_CAST, ROUNDS, platPos } from './act3.js';
import { eyeCam } from './act1.js';

const WHITE = RGB.text;

// 44.718 – 46.558  LAST ONE STANDING. Payout on the 45.89 impact.
function shotLast(t, R, P) {
  const lt = t - M.LAST;
  const payT = M.IMPACT_45;
  const [sx, sy] = shake(t, M.LAST, 16, 0.6, 20, 21);
  const [px, pz] = platPos(0);
  // camera below and in front of YOU, looking up; the arena crowd behind
  const toC = Math.atan2(-px, CANDLE_Z - pz);
  const a = toC + 0.25 + lt * 0.05;
  const D = lerp(2.9, 2.5, E.outCubic(lt / 1.84));
  const cx = px + Math.sin(a) * D, cz = pz + Math.cos(a) * D;
  const cam = new Cam({ x: cx, y: 2.3, z: cz, yaw: Math.atan2(px - cx, pz - cz), pitch: 0.32, f: 950 });
  cam.sx = sx; cam.sy = sy;
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.4 });
  drawFloor(R, cam);
  const { crowd } = world();
  // the crowd around, all eyes on YOU
  drawCrowd(R, cam, crowd, (m) => (m.hero || m.rival || m.rad < 8.5 ? { hide: true } : { eyes: t > payT ? 'happy' : 'wide', led: t > payT ? RGB.cyan : WHITE, ledI: 0.6, look: 0.6 }),
    { lit: [90, 100, 150], fogCol: [24, 20, 46], fogNear: 6, fogFar: 40, near: 3, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.4 } });
  const top = cam.p(px, 2.2, pz);
  if (top) {
    // platform top edge
    const pose = t > payT ? 'cheer' : 'fist';
    const hop = t > payT ? Math.abs(Math.sin((t - payT) * 8)) * 0.12 : 0;
    drawPlayer(R, { x: top[0], y: top[1] - hop * top[3], s: 0.33 * top[3], pose, cast: CAST.you, face: t > payT ? { eyes: 'dollar', mouth: 'grin' } : { eyeL: 'smugL', eyeR: 'smugL', mouth: 'smirk' }, led: t > payT ? RGB.green : RGB.cyan, yaw: 0.1, pitch: 0.2,
      key: { x: 0, y: -0.2, col: [170, 255, 160], k: 0.7 }, rim: { x: 0.6, y: -0.8, col: RGB.cyan, k: 1.2 } });
  }
  if (t > payT) {
    const pa = clamp((t - payT) / 0.06);
    confetti(R, 960, 360, t - payT, { n: 160, speed: 1600, seed: 9, spread: 3.2 });
    money(R, '+190.00', 960, 200, { size: 150, col: RGB.green, scale: 1 + 0.3 * (1 - E.outQuart((t - payT) / 0.25)), alpha: pa, glow: 0.8 });
    label(R, 'USDC · BATTLE ROYALE WON', 960, 250, { size: 20, col: [245, 243, 255], tracking: 8, align: 'center', alpha: pa });
  }
  const la = clamp((lt - 0.08) / 0.1) * (t < payT ? 1 : clamp(1 - (t - payT) / 0.1));
  bigWord(R, 'LAST ONE', { x: 960, y: 140, size: 110, alpha: la, fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2, extrude: { dx: 0, dy: 6, n: 6, col: [40, 36, 70], col2: [10, 9, 20] } });
  bigWord(R, 'STANDING.', { x: 960, y: 250, size: 110, alpha: la, fill: [[180, 250, 255], [24, 224, 255]], glow: 0.35, glowCol: RGB.cyan, extrude: { dx: 0, dy: 6, n: 6, col: [10, 50, 70], col2: [4, 12, 20] } });
  P.flash = pulse(t, M.LAST, 0.08) * 0.2 + pulse(t, payT, 0.1) * 0.25; P.bloom = 1.05;
  P.invert = lt < 0.034 ? 1 : 0; if (P.invert) { P.satBase = 0; P.satGlow = 0; }
}

// Card stunt: the crowd's visors spell a word across the arena.
let _yGrid = null;
function wordMask(word) {
  if (_yGrid && _yGrid.word === word) return _yGrid;
  const dm = dotMatrix(word, 11);
  const set = new Set(dm.cells.map(([x, y]) => x + ',' + y));
  _yGrid = { word, w: dm.w, h: dm.h, set };
  return _yGrid;
}
function inWord(m, mask, cell) {
  // world x -> column (screen-left is +x from this camera), world z -> row
  const u = Math.floor(-m.x / cell + mask.w / 2);
  const v = Math.floor((m.z - CANDLE_Z) / (cell * 1.0) + mask.h / 2);
  return mask.set.has(u + ',' + v);
}

// 46.558 – 50.24  KNOWN. Crane up from the winner; the crowd spells YOU; rank up.
function shotKnown(t, R, P) {
  const lt = t - M.KNOWN;
  const u = E.inOutCubic(clamp(lt / 2.3));
  const cam = eyeCam({ a: lerp(0.55, 0.06, u) + lt * 0.015, D: lerp(9, 17, u), H: lerp(11, 50, u), f: 1150, lookY: lerp(2.0, 0, u) });
  const { crowd } = world();
  const mask = wordMask('YOU');
  const cell = 2.35;
  const { b } = R;
  b.fillStyle = '#08070e'; b.fillRect(0, 0, 1920, 1080);
  floorPool(R, cam, 0, CANDLE_Z, 30, [24, 224, 255], 0.5);
  strikeLine(R, cam, CANDLE_Z, -70, 70, { phase: t * 0.2, width: 3, k: 0.6 });
  drawCrowdTop(R, cam, crowd, (m) => {
    const d = Math.hypot(m.x, m.z - CANDLE_Z);
    const wave = clamp((lt - 0.25 - d * 0.028) / 0.25);
    const on = inWord(m, mask, cell);
    if (on) return { led: [lerp(245, 24, wave * 0.35), lerp(243, 224, wave * 0.35), 255], ledI: lerp(0.4, 1.8, wave) };
    return { led: pickOf(m) === 1 ? RGB.green : RGB.red, ledI: lerp(0.5, 0.08, wave) };
  }, { fogCol: [16, 14, 30], fogNear: 80, fogFar: 260, keyCol: [200, 240, 255], keyK: 0.6, squash: 0.85 });
  drawBR(R, cam, M.LAST + 1.5, { crowd: false, price: 0.7 });
  const rt = bar(26);
  const ra = clamp((t - rt) / 0.12);
  if (ra > 0) {
    b.fillStyle = `rgba(7,6,12,${0.6 * ra})`; b.fillRect(0, 880, 1920, 200);
    label(R, 'RANK UP', 960, 920, { size: 16, col: RGB.gold, tracking: 8, align: 'center', alpha: ra });
    bigWord(R, 'PROPHET', { x: 960, y: 1010, size: 96, alpha: ra, scale: 1 + 0.12 * (1 - E.outQuart((t - rt) / 0.2)), fill: [[255, 240, 200], [255, 194, 58]], glow: 0.4, glowCol: RGB.gold });
    label(R, '#1 THIS WEEK', 1430, 985, { size: 20, weight: 700, col: [245, 243, 255], tracking: 6, align: 'center', alpha: clamp((t - rt - 0.25) / 0.1) });
    label(R, '+1,284.60 USDC', 490, 985, { size: 20, weight: 700, col: RGB.green, tracking: 4, align: 'center', alpha: clamp((t - rt - 0.35) / 0.1) });
  }
  P.bloom = 1.0; P.halo = 0.55; P.flash = pulse(t, rt, 0.08) * 0.1;
}

// ---- A world of arenas --------------------------------------------------------------
let _arenaSprites = null;
function arenaSprites() {
  if (_arenaSprites) return _arenaSprites;
  _arenaSprites = [];
  for (let v = 0; v < 4; v++) {
    const S = 256;
    const mk = () => { const c = document.createElement('canvas'); c.width = S; c.height = S; return c; };
    const cb = mk(), cg = mk();
    const bx = cb.getContext('2d'), gx = cg.getContext('2d');
    const rnd = rngFrom('arena', v);
    const up = 0.35 + v * 0.1;
    for (let i = 0; i < 1400; i++) {
      const rr = 18 + Math.sqrt(rnd()) * 104, a = rnd() * Math.PI * 2;
      const x = S / 2 + Math.cos(a) * rr, y = S / 2 + Math.sin(a) * rr;
      const q = rnd();
      const col = q < 0.62 ? (rnd() < 0.7 ? [210, 225, 255] : [24, 224, 255]) : (rnd() < up + 0.1 ? [57, 255, 20] : [255, 56, 96]);
      const al = 0.55 + rnd() * 0.45;
      bx.fillStyle = rgba([col[0] * 0.6 + 60, col[1] * 0.6 + 60, col[2] * 0.6 + 60], al * 0.9); bx.fillRect(x - 1, y - 1, 2, 2);
      gx.fillStyle = rgba(col, al * 0.35); gx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
    }
    _arenaSprites.push({ b: cb, g: cg, S });
  }
  return _arenaSprites;
}
const ARENAS = (() => {
  const rnd = rngFrom('world', 3);
  const out = [];
  for (let gx = -9; gx <= 9; gx++) for (let gz = -3; gz <= 22; gz++) {
    if (gx === 0 && gz === 0) { out.push({ x: 0, z: 0, v: 1, ph: 0, home: true }); continue; }
    if (rnd() < 0.18) continue;
    out.push({ x: gx * 110 + (rnd() - 0.5) * 60, z: gz * 110 + (rnd() - 0.5) * 60, v: (rnd() * 4) | 0, ph: rnd() * 8, kind: rnd() });
  }
  return out;
})();
function drawWorld(R, cam, t, o = {}) {
  const { b, g } = R;
  const sp = arenaSprites();
  const hy = cam.horizonY();
  const sky = b.createLinearGradient(0, hy - 500, 0, hy + 30);
  sky.addColorStop(0, '#07060c'); sky.addColorStop(1, '#1b1738');
  b.fillStyle = sky; b.fillRect(0, 0, 1920, 1080);
  const list = [];
  for (const a of ARENAS) {
    const p = cam.p(a.x, 0, a.z + (o.oz || 0));
    if (!p) continue;
    const r = 58 * p[3];
    if (r < 0.8 || p[0] < -r * 1.2 || p[0] > 1920 + r * 1.2 || p[1] < -r || p[1] > 1080 + r) continue;
    list.push([p, r, a]);
  }
  list.sort((x, y) => y[0][2] - x[0][2]);
  for (const [p, r, a] of list) {
    const sq = clamp((cam.y) / Math.hypot(cam.y, p[2]) * 1.05, 0.08, 1);
    const fog = clamp(p[2] / 2600);
    const s = sp[a.v];
    const al = (1 - fog * 0.85);
    b.globalAlpha = al; g.globalAlpha = al * 0.6;
    b.drawImage(s.b, p[0] - r, p[1] - r * sq, r * 2, r * 2 * sq);
    g.drawImage(s.g, p[0] - r, p[1] - r * sq, r * 2, r * 2 * sq);
    b.globalAlpha = 1; g.globalAlpha = 1;
    // the candle at the centre bursts on the beat, per arena
    const beatN = Math.floor((t - 0.5533) / (BEAT)) + ((a.ph * 3) | 0);
    let burst = pulse(((t - 0.5533) % BEAT + BEAT) % BEAT, 0, 0.18) * (hash1(beatN * 13.1 + a.ph) < 0.35 ? 1 : 0.25);
    if (o.wave !== undefined) {
      const dist = Math.hypot(a.x, a.z) / 110;
      const ring = o.wave * 4.5 - dist;
      burst = Math.max(burst, ring > 0 && ring < 0.6 ? 1 - ring / 0.6 : 0);
    }
    const cc = hash1(beatN * 7.7 + a.ph * 3) < 0.55 ? RGB.green : RGB.red;
    const cr = Math.max(1.2, r * 0.13) * (1 + burst * 1.2);
    g.fillStyle = rgba(cc, 0.5 + burst * 0.5); g.beginPath(); g.ellipse(p[0], p[1], cr * 1.6, cr * 1.6 * sq, 0, 0, 6.2832); g.fill();
    b.fillStyle = rgba([lerp(cc[0], 255, 0.6), lerp(cc[1], 255, 0.6), lerp(cc[2], 255, 0.6)], 0.9);
    b.fillRect(p[0] - cr * 0.4, p[1] - cr * (1.5 + burst * 3) * (1 - sq * 0.6), cr * 0.8, cr * (1.5 + burst * 3) * (1 - sq * 0.6) + 1);
    if (a.home && o.homeMark) {
      const al2 = o.homeMark;
      b.strokeStyle = rgba(RGB.cyan, al2); b.lineWidth = 2;
      b.beginPath(); b.ellipse(p[0], p[1], r * 1.15, r * 1.15 * sq, 0, 0, 6.2832); b.stroke();
    }
  }
}

// 50.24 – 53.92  The world: thousands of games, right now. Arenas fire outward from ours.
function shotWorld(t, R, P) {
  const lt = t - M.BUILD;
  const u = clamp(lt / 3.68);
  const H = lerp(150, 105, E.inOutQuad(u));
  const z = lerp(-40, 520, E.inCubic(u));
  const cam = new Cam({ x: lerp(0, 60, u), y: H, z: z - 300, yaw: lerp(0.0, 0.1, u), pitch: lerp(-0.62, -0.3, E.inOutQuad(u)), f: 1100, roll: lerp(0, -0.05, u) });
  drawWorld(R, cam, t, { homeMark: clamp(1 - lt / 1.2), wave: lt });
  const a1 = clamp((t - bar(28)) / 0.08);
  bigWord(R, 'THE MARKET', { x: 960, y: 470, size: 150, alpha: a1, scale: 1 + 0.12 * (1 - E.outQuart((t - bar(28)) / 0.22)), fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2, extrude: { dx: 0, dy: 6, n: 6, col: [40, 36, 70], col2: [10, 9, 20] } });
  const t2 = bar(28) + BAR / 2;
  const a2 = clamp((t - t2) / 0.08);
  bigWord(R, 'IS MULTIPLAYER.', { x: 960, y: 620, size: 150, alpha: a2, scale: 1 + 0.12 * (1 - E.outQuart((t - t2) / 0.22)), fill: [[180, 250, 255], [24, 224, 255]], glow: 0.4, glowCol: RGB.cyan, extrude: { dx: 0, dy: 6, n: 6, col: [10, 50, 70], col2: [4, 12, 20] } });
  P.bloom = 1.1; P.halo = 0.6;
  P.flash = (pulse(t, bar(28), 0.08) + pulse(t, t2, 0.08)) * 0.12;
}

// 53.92 – 55.76  Everyone, everywhere: new faces on every 8th note.
const INSERTS = [
  { c: { name: 'MIRA', type: 'cat', shell: [70, 60, 104], accent: '#18e0ff' }, face: { eyes: 'up' }, led: [57, 255, 20], tag: 'MIRA  ▲ LOCKED IN' },
  { c: { name: 'RAJ_HL', type: 'fin', shell: [56, 64, 90], accent: '#8d87b0' }, face: { eyes: 'dollar', mouth: 'grin' }, led: [57, 255, 20], tag: '+38.20 USDC' },
  { c: { name: 'COPE_DEALER', type: 'cat', shell: [62, 52, 80], accent: '#8d87b0' }, face: { eyes: 'cry', mouth: 'frown' }, led: [255, 56, 96], tag: 'COPE_DEALER  -25 USDC' },
  { c: { name: 'THEO', type: 'frog', shell: [52, 70, 60], accent: '#39ff14' }, face: { eyes: 'down' }, led: [255, 56, 96], tag: 'THEO  ▼ LOCKED IN' },
  { c: { name: 'HANNAH_T', type: 'bear', shell: [84, 62, 92], accent: '#ffc23a' }, face: { eyes: 'heart', mouth: 'smile' }, led: [255, 120, 180], tag: 'HANNAH_T  STREAK 7' },
  { c: { name: 'DEANO', type: 'horns', shell: [78, 52, 58], accent: '#ffc23a' }, face: { eyes: 'x', mouth: 'frown' }, led: [255, 56, 96], tag: 'DEANO  ELIMINATED' },
  { c: { name: 'SOUP', type: 'antenna', shell: [74, 62, 96], accent: '#ffc23a' }, face: { eyes: 'dollar', mouth: 'o' }, led: [57, 255, 20], tag: 'SOUP  +12.40 USDC' },
  { c: { name: '0XTOM', type: 'frog', shell: [56, 74, 70], accent: '#39ff14' }, face: { eyes: 'question' }, led: [245, 243, 255], tag: '0XTOM  NEXT CANDLE?' },
];
function shotInserts(t, R, P) {
  const lt = t - bar(29);
  const k = clamp(Math.floor(lt / (BEAT / 2)), 0, INSERTS.length - 1);
  const it = INSERTS[k];
  const ll = lt - k * BEAT / 2;
  const col = it.led;
  bokeh(R, t, { n: 46, seed: 200 + k, y0: 60, h: 960, r: 52, a: 0.2, cols: [col, WHITE, RGB.cyan] });
  const side = k % 2 ? 1 : -1;
  const z = 1 + ll * 0.6;
  drawHelmet(R, { x: 960 + side * 260, y: 540, s: 380 * z, type: it.c.type, shell: it.c.shell, accent: it.c.accent, face: it.face, led: col, yaw: -side * 0.28, status: col, body: 'bust',
    key: { x: -side * 0.5, y: -0.5, col: [230, 235, 255], k: 0.55 }, rim: { x: side * 0.9, y: -0.3, col: RGB.cyan, k: 1.1 } });
  label(R, it.tag, 960 - side * 470, 540, { size: 44, weight: 700, col, tracking: 4, align: 'center', glow: 0.5 });
  P.flash = pulse(t, bar(29) + k * BEAT / 2, 0.035) * 0.1; P.bloom = 1.0; P.ca = 0.005;
}

// 55.76 – 57.60  Plunge into one arena: the ring rushes outward, the pupil fills the frame.
function shotDive(t, R, P) {
  const lt = t - bar(30);
  const u = clamp(lt / 1.84);
  const w = E.inQuart(u);
  const H = lerp(95, 3.4, E.inCubic(u));
  const cam = eyeCam({ a: 0, D: lerp(3.5, 0.6, u), H, f: lerp(1000, 900, u), roll: lerp(0, 0.9, E.inCubic(u)) });
  const { crowd } = world();
  const { b } = R;
  b.fillStyle = '#08070e'; b.fillRect(0, 0, 1920, 1080);
  floorPool(R, cam, 0, CANDLE_Z, 22, [200, 230, 255], 0.9);
  strikeLine(R, cam, CANDLE_Z, -70, 70, { phase: t * 0.6, width: 3 });
  const tick = pulse(((t - 0.5533) % (BEAT / 2) + BEAT / 2) % (BEAT / 2), 0, 0.1);
  drawCrowdTop(R, cam, crowd, (m) => {
    const pk = pickOf(m);
    return { led: m.r2 < 0.5 ? WHITE : pk === 1 ? RGB.green : RGB.red, ledI: 0.7 + 0.8 * tick * (m.r3 < 0.5 ? 1 : 0.4) };
  }, { fogCol: [16, 14, 30], fogNear: 80, fogFar: 260, keyCol: [200, 240, 255], keyK: 0.6 });
  drawCandleBox(R, cam, { x: 0, z: CANDLE_Z, close: 0.02, w: 3.0, col: [235, 245, 255], k: 1.3 + w, flat: true });
  speedLines(R, t, { n: 100, alpha: 0.1 + w * 0.5, r0: 120 + (1 - w) * 380, col: WHITE, width: 1 + w * 2.5 });
  P.zoomBlur = w * 0.1; P.bloom = 1.05 + w * 0.5; P.ca = 0.004 + w * 0.012;
  P.flash = u > 0.9 ? (u - 0.9) * 9 : 0;
}

// 57.60 – 59.44  YOUR CALL.  ▲ over the line, ▼ under it. Stillness.
function drawBigArrow(R, glyph, cx, cy, cell, col, I) {
  const { b, g } = R;
  const gl = EYES[glyph];
  const hot = [lerp(col[0], 255, 0.5), lerp(col[1], 255, 0.5), lerp(col[2], 255, 0.5)];
  b.fillStyle = rgba(hot, I); g.fillStyle = rgba(col, 0.9 * I);
  b.beginPath(); g.beginPath();
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
    if (!gl[y][x]) continue;
    const px = cx + (x - 4) * cell, py = cy + (y - 4) * cell;
    b.moveTo(px + cell * 0.38, py); b.arc(px, py, cell * 0.38, 0, 6.2832);
    g.moveTo(px + cell * 0.5, py); g.arc(px, py, cell * 0.5, 0, 6.2832);
  }
  b.fill(); g.fill();
}
function shotYourCall(t, R, P) {
  const lt = t - M.BASS_OUT_END;
  const { b, g } = R;
  b.fillStyle = '#07060c'; b.fillRect(0, 0, 1920, 1080);
  const lineY = 560;
  // strike line
  for (let x = -20; x < 1940; x += 34) { b.fillStyle = rgba(RGB.cyan, 0.95); b.fillRect(x, lineY - 2, 20, 4); g.fillStyle = rgba(RGB.cyan, 0.8); g.fillRect(x, lineY - 4, 20, 8); }
  // the trembling wick at the centre
  const w = noise1(t * 7) * 70 + noise1(t * 23) * 18;
  const top = Math.min(lineY, lineY - w), h = Math.max(6, Math.abs(w));
  b.fillStyle = 'rgba(245,243,255,0.95)'; b.fillRect(930, top, 60, h);
  g.fillStyle = 'rgba(245,243,255,0.7)'; g.fillRect(924, top - 4, 72, h + 8);
  for (let k = 1; k <= 5; k++) { const yy = top - k * 16; b.fillStyle = `rgba(245,243,255,${0.8 - k * 0.12})`; b.fillRect(957, yy - 3, 6, 6); }
  // claps pulse the arrows gently
  const cl = pulse(((t - 0.5533) % (BEAT) + BEAT) % BEAT, 0, 0.14);
  const ain = E.outBack(clamp(lt / 0.25));
  drawBigArrow(R, 'up', 960 - 520, lineY - 230, 30 * ain, RGB.green, 0.9 + cl * 0.3);
  drawBigArrow(R, 'down', 960 + 520, lineY + 230, 30 * ain, RGB.red, 0.9 + cl * 0.3);
  label(R, 'PUMP', 960 - 520, lineY - 60, { size: 30, weight: 700, col: RGB.green, tracking: 12, align: 'center', alpha: ain });
  label(R, 'DUMP', 960 + 520, lineY + 60, { size: 30, weight: 700, col: RGB.red, tracking: 12, align: 'center', alpha: ain });
  const ya = clamp((lt - 0.35) / 0.12);
  bigWord(R, 'YOUR CALL.', { x: 960, y: 330, size: 150, alpha: ya, fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2, extrude: { dx: 0, dy: 6, n: 6, col: [40, 36, 70], col2: [10, 9, 20] } });
  P.bloom = 1.0; P.vignette = 0.7; P.flash = pulse(t, M.BASS_OUT_END, 0.1) * 0.2;
}

// 59.44 – 62.0  The two sides fold into the Y. The reverb carries the URL.
function shotLogo(t, R, P) {
  const lt = t - M.CLICK;
  const { b, g } = R;
  b.fillStyle = '#07060c'; b.fillRect(0, 0, 1920, 1080);
  const k = E.inQuart(clamp(lt / 0.14));
  if (lt < 0.14) {
    // arrows collapse into the centre
    const lineY = 560;
    drawBigArrow(R, 'up', lerp(440, 960, k), lerp(330, 470, k), 30 * (1 - k * 0.6), RGB.green, 1);
    drawBigArrow(R, 'down', lerp(1480, 960, k), lerp(790, 650, k), 30 * (1 - k * 0.6), RGB.red, 1);
    P.blurVec = [0, 0]; P.zoomBlur = k * 0.05;
  } else {
    const u = lt - 0.14;
    const sc = 1 + 0.12 * (1 - E.outQuart(u / 0.5));
    const mixk = E.inOutCubic(clamp((u - 0.12) / 0.4));
    const cL = [lerp(57, 24, mixk), lerp(255, 224, mixk), lerp(20, 255, mixk)];
    const cR = [lerp(255, 24, mixk), lerp(56, 224, mixk), lerp(96, 255, mixk)];
    for (const [cx0, col] of [[0, cL], [960, cR]]) {
      b.save(); g.save();
      b.beginPath(); b.rect(cx0, 0, 960, 1080); b.clip(); g.beginPath(); g.rect(cx0, 0, 960, 1080); g.clip();
      drawLogo(R, 960, 470, 360 * sc, { col, glow: 0.9 + pulse(u, 0, 0.4) * 1.5 });
      b.restore(); g.restore();
    }
    const br = g.createRadialGradient(960, 470, 0, 960, 470, 700 * (0.4 + E.outCubic(clamp(u / 0.8)) * 0.8));
    br.addColorStop(0, `rgba(24,224,255,${0.25 * pulse(u, 0, 0.5)})`); br.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = br; g.fillRect(0, 0, 1920, 1080);
    const wa = clamp((u - 0.35) / 0.35);
    b.save(); b.globalAlpha = wa; b.font = F.hero(64, 700, false); b.letterSpacing = '28px'; b.textAlign = 'center'; b.fillStyle = '#f5f3ff';
    b.fillText('YOCHI', 960 + 14, 800); b.restore();
    const ua = clamp((u - 0.8) / 0.4);
    money(R, 'yochigg.xyz', 960, 890, { size: 40, col: RGB.cyan, alpha: ua, glow: 0.5, weight: 500 });
    P.flash = pulse(u, 0, 0.12) * 0.5; P.flashColor = [0.6, 0.95, 1.0];
    P.fade = clamp((t - 61.55) / 0.45);
  }
  P.bloom = 1.0; P.vignette = 0.6;
}

export const ACT4 = [
  { t0: M.LAST, t1: M.KNOWN, fn: shotLast },
  { t0: M.KNOWN, t1: M.BUILD, fn: shotKnown },
  { t0: M.BUILD, t1: bar(29), fn: shotWorld },
  { t0: bar(29), t1: bar(30), fn: shotInserts },
  { t0: bar(30), t1: M.BASS_OUT_END, fn: shotDive },
  { t0: M.BASS_OUT_END, t1: M.CLICK, fn: shotYourCall },
  { t0: M.CLICK, t1: 62.01, fn: shotLogo },
];
