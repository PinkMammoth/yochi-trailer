// ACT II — THE RISE & THE DUEL (18.955 → 31.837)
// Calls stack under YOU. The crowd looks up. A nemesis. 1V1. Standoff. It dumps.
import { clamp, lerp, E, smooth, noise1, shake, pulse, env, rgba, hash1, spring } from '../core/math.js';
import { M, BEAT, BAR, bar, S16 } from '../core/music.js';
import { drawHelmet, RGB, C } from '../elements/helmet.js';
import { drawPlayer, blendPose } from '../elements/body.js';
import { Cam, drawSky, drawFloor, floorPool, strikeLine, drawCandleBox, drawCandle, dust } from '../elements/world.js';
import { drawCrowd } from '../elements/crowd.js';
import { bigWord, F, label, money, chatBubble, nameTag, fmtUSDC } from '../elements/type.js';
import { bokeh, stream, shockwave, confetti, speedLines } from '../elements/fx.js';
import { drawDotText, drawFlame } from '../elements/led.js';
import { world, pickOf, ledFor, eyesFor, CAST, CANDLE_Z, PEARL, CS } from './common.js';

const WHITE = RGB.text;
const BLOCK = 0.62;            // tower block height (world)
const TW = 1.25;               // tower width
// The streak: a new correct call every half bar from the rise.
const CALLS = [1, -1, 1, 1, -1, 1, -1];     // direction of each winning call
const CALL_T = [M.RISE - 0.3, M.RISE + BAR / 2, bar(11), 21.95, bar(12) + BAR / 2, bar(13), bar(13) + BAR / 2];
const RANKS = ['NORMIE', 'PLEB', 'PLEB', 'TRADER', 'TRADER', 'ORACLE', 'ORACLE'];
function streakAt(t) { let n = 0; for (const c of CALL_T) if (t >= c) n++; return n; }

// Hero position in the arena
function heroPos() { const { hero } = world(); return [hero.x, hero.z]; }
const RIVAL_POS = [0, CANDLE_Z + 3.7];
const YOU_DUEL = [0, CANDLE_Z - 3.7];

// A tower of calls: blocks coloured by the direction that won.
function drawTower(R, cam, x, z, n, t, o = {}) {
  const { b, g } = R;
  const blocks = o.blocks || CALLS;
  let top = 0;
  for (let i = 0; i < n; i++) {
    const dir = blocks[i % blocks.length];
    const col = dir === 1 ? RGB.green : RGB.red;
    let h = BLOCK;
    const born = o.times ? o.times[i] : -1;
    if (born >= 0 && t - born < 0.25) h = BLOCK * E.outBack(clamp((t - born) / 0.18), 2.5);
    const y0 = top + 0.05, y1 = top + h - 0.05;
    const P = (xx, yy, zz) => cam.p(xx, yy, zz);
    const hw = TW / 2;
    const fl = born >= 0 ? pulse(t, born, 0.2) : 0;
    const hot = [lerp(col[0], 255, 0.5 + fl * 0.4), lerp(col[1], 255, 0.5 + fl * 0.4), lerp(col[2], 255, 0.5 + fl * 0.4)];
    const quad = (c, pts, st) => { if (pts.some((q) => !q)) return; c.fillStyle = st; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) c.lineTo(q[0], q[1]); c.closePath(); c.fill(); };
    const k = o.k ?? 1;
    // front face (+z toward camera) and side faces as visible
    const faces = [];
    if (cam.z > z + hw) faces.push([P(x - hw, y0, z + hw), P(x + hw, y0, z + hw), P(x + hw, y1, z + hw), P(x - hw, y1, z + hw)]);
    if (cam.z < z - hw) faces.push([P(x + hw, y0, z - hw), P(x - hw, y0, z - hw), P(x - hw, y1, z - hw), P(x + hw, y1, z - hw)]);
    if (cam.x > x + hw) faces.push([P(x + hw, y0, z - hw), P(x + hw, y0, z + hw), P(x + hw, y1, z + hw), P(x + hw, y1, z - hw)]);
    if (cam.x < x - hw) faces.push([P(x - hw, y0, z + hw), P(x - hw, y0, z - hw), P(x - hw, y1, z - hw), P(x - hw, y1, z + hw)]);
    const edge = (c, pts, st, w) => { if (pts.some((q) => !q)) return; c.strokeStyle = st; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) c.lineTo(q[0], q[1]); c.closePath(); c.stroke(); };
    const sc0 = (cam.p(x, (y0 + y1) / 2, z) || [0, 0, 1, 100])[3];
    const ew = Math.max(1.2, 0.035 * sc0);
    faces.forEach((f, fi) => {
      const dark = [col[0] * 0.16 + 8, col[1] * 0.16 + 6, col[2] * 0.16 + 14];
      quad(b, f, rgba(fi === 0 ? [col[0] * 0.28 + 10, col[1] * 0.28 + 8, col[2] * 0.28 + 16] : dark, 0.97 * k));
      quad(g, f, rgba(col, (0.18 + fl * 0.5) * k));
      edge(b, f, rgba(hot, 0.95 * k), ew); edge(g, f, rgba(col, 0.9 * k), ew * 2.4);
    });
    if (cam.y > y1) { const f = [P(x - hw, y1, z - hw), P(x + hw, y1, z - hw), P(x + hw, y1, z + hw), P(x - hw, y1, z + hw)]; quad(b, f, rgba([col[0] * 0.4 + 20, col[1] * 0.4 + 20, col[2] * 0.4 + 30], 0.97 * k)); edge(b, f, rgba(hot, k), ew); edge(g, f, rgba(col, 0.9 * k), ew * 2.4); }
    top += h;
  }
  return top;
}

function heroStreakFace(t) {
  const i = streakAt(t) - 1;
  const since = i >= 0 ? t - CALL_T[i] : 9;
  if (since < 0.28) return { eyes: 'dollar', mouth: 'grin' };
  const next = CALL_T[i + 1];
  if (next !== undefined && next - t < 0.38) return { eyes: CALLS[i + 1] === 1 ? 'up' : 'down' };
  return { eyeL: 'smugL', eyeR: 'smugL', mouth: 'smirk' };
}

// Streak / rank HUD (in-world typography)
function streakHUD(R, t, x, y, o = {}) {
  const n = streakAt(t);
  if (n <= 0) return;
  const i = n - 1;
  const pop = 1 + 0.35 * (1 - E.outQuart((t - CALL_T[i]) / 0.22));
  label(R, 'STREAK', x, y - 70, { size: 18, col: RGB.gold, tracking: 8, align: o.align || 'left' });
  money(R, String(n), x + (o.align === 'right' ? -10 : 0), y + 40, { size: 120, col: RGB.gold, align: o.align || 'left', scale: pop, glow: 0.8, hot: 0.25 });
  // LED flame beside the number, growing with the streak
  if (n >= 2) drawFlame(R, x + (o.align === 'right' ? -120 : 118), y + 36, 7 + Math.min(4, n - 2) * 1.6, t, { intensity: 1 });
  label(R, RANKS[Math.min(i, RANKS.length - 1)], x, y + 90, { size: 26, weight: 700, col: [245, 243, 255], tracking: 10, align: o.align || 'left' });
}

// ---------------------------------------------------------------------------
// 18.955 – 20.9  The rise: calls stack under YOU.
function shotRise(t, R, P) {
  const { crowd, hero } = world();
  const n = streakAt(t);
  const [hx, hz] = heroPos();
  const towerH = n * BLOCK;
  const lt = t - M.RISE;
  const topNow = towerH;
  const cam = new Cam({ x: hx - 0.7, y: topNow + 1.05, z: hz - 2.8, yaw: 0.22, pitch: -0.12, f: 1150 });
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.1 });
  drawFloor(R, cam);
  // crowd (faces, looking up at YOU more and more)
  const lookUp = clamp((t - 20.9) / 0.6);
  drawCrowd(R, cam, crowd, (m) => {
    if (m.hero) return { hide: true };
    const pk = pickOf(m);
    const d = Math.hypot(m.x - hx, m.z - hz);
    const lk = clamp(0.3 + n * 0.12 + lookUp * 0.6 - d * 0.02, 0, 1);
    return { eyes: lookUp > 0.5 && d < 6 ? 'wide' : eyesFor(pk), led: ledFor(pk), ledI: 0.55, look: lk, status: null };
  }, { lit: [120, 140, 200], key: { x: 0, y: -0.6, col: [190, 225, 255], k: 0.5 }, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.8 }, fogCol: [26, 22, 50], fogNear: 4, fogFar: 40, near: 1.4 });
  const top = drawTower(R, cam, hx, hz, n, t, { times: CALL_T });
  const pp = cam.p(hx, top, hz);
  if (pp) {
    const i = n - 1; const since = i >= 0 ? t - CALL_T[i] : 9;
    const hop = since < 0.3 ? Math.sin(clamp(since / 0.3) * Math.PI) * 0.18 : 0;
    const pose = since < 0.35 ? 'fist' : 'idle';
    drawPlayer(R, { x: pp[0], y: pp[1] - hop * pp[3], s: 0.3 * pp[3], pose, cast: CAST.you, face: heroStreakFace(t), led: since < 0.28 ? RGB.gold : RGB.green, yaw: 0.1, key: { x: -0.3, y: -0.7, col: [200, 230, 255], k: 0.6 }, rim: { x: 0.8, y: -0.5, col: RGB.cyan, k: 1.1 } });
    nameTag(R, pp[0], pp[1] - 1.55 * 0.3 * pp[3] * 3.4, 'YOU', { size: 20 });
  }
  streakHUD(R, t, 1350, 520);
  P.bloom = 0.9; P.flash = pulse(t, CALL_T[Math.max(0, n - 1)], 0.06) * 0.08;
}

// 20.9 – 21.95  Bass gap: everyone turns to look. EVERY WIN IS PUBLIC.
function shotPublic(t, R, P) {
  const { crowd, hero } = world();
  const [hx, hz] = heroPos();
  const n = streakAt(t);
  const lt = t - 20.9;
  const cam = new Cam({ x: hx + lerp(-1.5, -2.2, lt), y: lerp(6.5, 7.5, lt), z: hz + lerp(9, 10.5, E.outCubic(lt)), yaw: Math.PI + 0.1, pitch: -0.32, f: 1000 });
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.1 });
  drawFloor(R, cam);
  const turn = E.inOutCubic(clamp(lt / 0.55));
  drawCrowd(R, cam, crowd, (m) => {
    if (m.hero) return { hide: true };
    const pk = pickOf(m);
    const d = Math.hypot(m.x - hx, m.z - hz);
    const delay = clamp(d / 18) * 0.35;
    const k = E.outBack(clamp((lt - delay) / 0.3));
    return { eyes: k > 0.5 ? 'wide' : eyesFor(pk), led: k > 0.5 ? WHITE : ledFor(pk), ledI: 1, look: k * 0.8, status: null, forceFront: true };
  }, { lit: [120, 140, 200], key: { x: 0, y: -0.6, col: [190, 225, 255], k: 0.5 }, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.8 }, fogCol: [26, 22, 50], fogNear: 4, fogFar: 40, near: 1.4, back: false });
  const top = drawTower(R, cam, hx, hz, n, t, { times: CALL_T });
  const pp = cam.p(hx, top, hz);
  if (pp) drawPlayer(R, { x: pp[0], y: pp[1], s: 0.3 * pp[3], pose: blendPose('idle', 'cheer', E.outBack(clamp((lt - 0.2) / 0.3))), cast: CAST.you, face: { eyeL: 'smugL', eyeR: 'smugL', mouth: 'smirk' }, led: RGB.green, yaw: 0.0, pitch: 0.2 });
  const a = clamp((lt - 0.12) / 0.12);
  bigWord(R, 'EVERY WIN', { x: 960, y: 250, size: 120, alpha: a, fill: [[255, 255, 255], [205, 200, 235]], glow: 0.15, extrude: { dx: 0, dy: 5, n: 5, col: [40, 36, 70], col2: [10, 9, 20] } });
  bigWord(R, 'IS PUBLIC.', { x: 960, y: 385, size: 120, alpha: clamp((lt - 0.3) / 0.12), fill: [[180, 250, 255], [24, 224, 255]], glow: 0.35, glowCol: RGB.cyan, extrude: { dx: 0, dy: 5, n: 5, col: [10, 50, 70], col2: [4, 12, 20] } });
  P.bloom = 0.9;
}

// 21.95 – 24.476  The climb continues; stickers and ranks.
function shotClimb(t, R, P) {
  const { crowd } = world();
  const [hx, hz] = heroPos();
  const n = streakAt(t);
  const lt = t - 21.95;
  const top0 = n * BLOCK;
  const cam = new Cam({ x: hx + 1.0, y: top0 + lerp(1.0, 1.2, lt / 2.5), z: hz - 2.8, yaw: -0.34, pitch: -0.14, f: 1150 });
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.3 });
  drawFloor(R, cam);
  drawCrowd(R, cam, crowd, (m) => (m.hero ? { hide: true } : { eyes: 'wide', led: WHITE, ledI: 0.5, look: 0.9, forceFront: true }), { lit: [110, 130, 190], fogCol: [26, 22, 50], fogNear: 4, fogFar: 36, near: 1.4, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.6 } });
  const top = drawTower(R, cam, hx, hz, n, t, { times: CALL_T });
  const pp = cam.p(hx, top, hz);
  if (pp) {
    const i = n - 1; const since = t - CALL_T[i];
    const hop = since < 0.3 ? Math.sin(clamp(since / 0.3) * Math.PI) * 0.2 : 0;
    const s = 0.3 * pp[3];
    const hd = drawPlayer(R, { x: pp[0], y: pp[1] - hop * pp[3], s, pose: since < 0.35 ? 'fist' : 'idle', cast: CAST.you, face: heroStreakFace(t), led: since < 0.28 ? RGB.gold : RGB.green, yaw: -0.3, key: { x: 0.3, y: -0.7, col: [200, 230, 255], k: 0.6 }, rim: { x: -0.8, y: -0.5, col: RGB.cyan, k: 1.1 } });
    // achievement sticker slaps on at streak 4
    const tA = CALL_T[3] + 0.05;
    if (t > tA) {
      const u = E.outBack(clamp((t - tA) / 0.16), 3);
      const sx = hd.hx + s * 0.55, sy = hd.hy - s * 0.62;
      const { b, g } = R;
      b.save(); b.translate(sx, sy); b.rotate(-0.25 + (1 - u) * 1.2); b.scale(u * s * 0.012, u * s * 0.012);
      b.fillStyle = '#0d0c16'; b.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; b.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); } b.closePath(); b.fill();
      b.strokeStyle = rgba(RGB.cyan); b.lineWidth = 4; b.stroke();
      b.strokeStyle = rgba([245, 243, 255]); b.lineWidth = 3; b.beginPath(); b.arc(0, 0, 13, 0, 6.2832); b.stroke();
      b.beginPath(); b.moveTo(-20, 0); b.lineTo(20, 0); b.moveTo(0, -20); b.lineTo(0, 20); b.stroke();
      b.restore();
      const la = env(t, tA, tA + 1.3, 0.05, 0.2);
      const { b: bb } = R;
      bb.fillStyle = `rgba(7,6,12,${0.75 * la})`; bb.fillRect(250, 330, 560, 190);
      bb.fillStyle = `rgba(24,224,255,${la})`; bb.fillRect(250, 330, 560, 4);
      label(R, 'ACHIEVEMENT UNLOCKED', 530, 370, { size: 16, col: RGB.cyan, tracking: 6, alpha: la, align: 'center' });
      bigWord(R, 'DEADEYE', { x: 530, y: 460, size: 92, alpha: la, fill: [[255, 255, 255], [200, 196, 230]], glow: 0.15 });
      label(R, 'LEGENDARY · 60% OVER 100 ROUNDS', 530, 495, { size: 14, col: [168, 162, 200], tracking: 4, alpha: la, align: 'center' });
    }
  }
  streakHUD(R, t, 1330, 470);
  P.bloom = 0.9; P.flash = pulse(t, CALL_T[Math.max(0, n - 1)], 0.06) * 0.08;
}

// 24.476 – 26.316  NEMESIS DETECTED. A red tower across the arena. Split on the logo's 30°.
function shotNemesis(t, R, P) {
  const { b, g } = R;
  const lt = t - bar(13);
  const n = streakAt(t);
  const split = E.outExpo(clamp((lt - 0.25) / 0.3));
  const angle = Math.PI / 6;
  // left: YOU (cyan/pearl) — right: EXIT (red)
  const drawSide = (who) => {
    if (who === 'you') {
      bokeh(R, t, { n: 40, seed: 61, y0: 100, h: 900, r: 44, a: 0.14, cols: [RGB.cyan, WHITE, RGB.green] });
      drawHelmet(R, { x: 560 - split * 60, y: 540, s: 300, type: 'dome', shell: PEARL, accent: C.cyan, stripes: 'y', face: { eyes: 'wide', mouth: 'o', lookX: 2 }, led: WHITE, yaw: 0.3, body: 'bust', key: { x: 0.5, y: -0.4, col: [255, 180, 200], k: 0.5 }, rim: { x: 0.9, y: -0.3, col: RGB.red, k: 0.9 } });
    } else {
      b.fillStyle = '#12040a'; b.fillRect(0, 0, 1920, 1080);
      bokeh(R, t + 3, { n: 40, seed: 62, y0: 100, h: 900, r: 44, a: 0.2, cols: [RGB.red, RGB.red, [255, 0, 79]] });
      drawHelmet(R, { x: 1380 + (1 - split) * 400, y: 540, s: 300, type: 'bear', shell: CAST.exit.shell, accent: C.red, stripes: 'one', face: { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk', lookX: -2 }, led: RGB.red, yaw: -0.3, body: 'bust', key: { x: -0.5, y: -0.4, col: [255, 150, 170], k: 0.6 }, rim: { x: -0.9, y: -0.3, col: RGB.red, k: 1.2 } });
    }
  };
  if (lt < 0.25) {
    drawSide('you');
  } else {
    // clip each side along a 30° line
    const cx = 960 + (1 - split) * 1400;
    const dx = Math.tan(angle) * 540;
    const clipL = (c) => { c.beginPath(); c.moveTo(-10, -10); c.lineTo(cx + dx, -10); c.lineTo(cx - dx, 1090); c.lineTo(-10, 1090); c.closePath(); };
    const clipR = (c) => { c.beginPath(); c.moveTo(cx + dx, -10); c.lineTo(1930, -10); c.lineTo(1930, 1090); c.lineTo(cx - dx, 1090); c.closePath(); };
    for (const [clip, who] of [[clipL, 'you'], [clipR, 'exit']]) {
      b.save(); g.save(); clip(b); b.clip(); clip(g); g.clip();
      drawSide(who);
      b.restore(); g.restore();
    }
    // the split seam
    b.strokeStyle = rgba(RGB.red); b.lineWidth = 6; b.beginPath(); b.moveTo(cx + dx, -10); b.lineTo(cx - dx, 1090); b.stroke();
    g.strokeStyle = rgba(RGB.red); g.lineWidth = 14; g.beginPath(); g.moveTo(cx + dx, -10); g.lineTo(cx - dx, 1090); g.stroke();
  }
  // alert typography
  const aa = clamp((lt - 0.3) / 0.08);
  const flick = lt < 0.7 ? (Math.floor(lt * 30) % 3 === 0 ? 0.4 : 1) : 1;
  label(R, '▲ RIVAL ACTIVITY ▲', 960, 120, { size: 18, col: RGB.red, tracking: 8, align: 'center', alpha: aa * flick, glow: 0.8 });
  bigWord(R, 'NEMESIS DETECTED', { x: 960, y: 1000, size: 120, alpha: aa * flick, fill: [[255, 200, 210], [255, 0, 79]], glow: 0.6, glowCol: RGB.red, extrude: { dx: 0, dy: 5, n: 5, col: [70, 6, 20], col2: [18, 2, 6] } });
  nameTag(R, 1380 + (1 - split) * 400, 190, 'EXIT_LIQUIDITY', { size: 26, col: RGB.red, alpha: aa });
  P.glitch = lt > 0.25 && lt < 0.5 ? 0.6 : 0; P.glitchSeed = Math.floor(t * 30);
  P.flash = pulse(t, bar(13) + 0.25, 0.08) * 0.2; P.flashColor = [1, 0.2, 0.35];
  P.ca = 0.006; P.bloom = 1.0;
}

// ---- The duel -----------------------------------------------------------------
// Round schedule on the snare roll.
const DUEL = {
  r1: { pick: 27.47, res: 27.93, you: 1, exit: -1, out: -1 },
  r2: { pick: 28.39, res: 28.85, you: -1, exit: 1, out: -1 },
  r3: { pick: 29.31, res: M.DROP2, you: -1, exit: 1, out: -1 },
};
function score(t) {
  let y = 0, e = 0;
  if (t >= DUEL.r1.res) { if (DUEL.r1.out === DUEL.r1.you) y++; else e++; }
  if (t >= DUEL.r2.res) { if (DUEL.r2.out === DUEL.r2.you) y++; else e++; }
  if (t >= DUEL.r3.res) { if (DUEL.r3.out === DUEL.r3.you) y++; else e++; }
  return [y, e];
}
function duelPrice(t) {
  // candle during the duel: each round is a short candle
  const seg = t < DUEL.r1.res ? DUEL.r1 : t < DUEL.r2.res ? DUEL.r2 : DUEL.r3;
  const start = seg.pick - 0.15;
  const u = clamp((t - start) / (seg.res - start));
  if (seg === DUEL.r3) {
    if (t >= M.DROP2) return -0.05 - 6.5 * E.outExpo((t - M.DROP2) / 0.5);
    if (t >= M.ROLL2_END) return 0;
    return noise1(t * 9) * 0.5 * (1 - clamp((t - 29.6) / 0.35));
  }
  return seg.out * E.outQuart(clamp((u - 0.55) / 0.45)) * 1.6 + noise1(t * 11) * 0.35 * (1 - u);
}

function duelCam(o) { return new Cam({ x: o.x ?? 16, y: o.y ?? 3.2, z: CANDLE_Z + (o.dz ?? 0), yaw: -Math.PI / 2 + (o.yaw || 0), pitch: o.pitch ?? 0.02, f: o.f ?? 1250 }); }
function duelWide(R, t, cam, o = {}) {
  const { crowd } = world();
  const p = o.price ?? duelPrice(t);
  const col = p > 0.05 ? RGB.green : p < -0.05 ? RGB.red : [235, 245, 255];
  drawSky(R, cam, { hor: [30, 26, 58], band: 1.2 });
  drawFloor(R, cam);
  floorPool(R, cam, 0, CANDLE_Z, 10 + Math.abs(p) * 2, col, 1.2);
  strikeLine(R, cam, CANDLE_Z, -40, 40, { phase: t * 0.3 });
  drawCrowd(R, cam, crowd, (m) => (m.hero || m.rival ? { hide: true } : { eyes: 'wide', led: WHITE, ledI: 0.55, look: 0.5 }), { lit: [90, 100, 150], fogCol: [24, 20, 46], fogNear: 6, fogFar: 40, near: 3, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.5 } });
  const [hx, hz] = YOU_DUEL;
  const nY = o.youH ?? 6, nE = o.exitH ?? 6;
  const topY = drawTower(R, cam, hx, hz, nY, t, {});
  const topE = o.exitFall ? 0 : drawTower(R, cam, RIVAL_POS[0], RIVAL_POS[1], nE, t, { blocks: [-1, -1, 1, -1, 1, -1] });
  drawCandleBox(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: Math.max(p, 0) * CS, lo: Math.min(p, 0) * CS, w: 2.2, col, k: 1.1, flat: Math.abs(p) < 0.03 });
  return { topY, topE, hx, hz };
}

// 26.316 – 27.47  1V1. Best of 3.
function shotOneVOne(t, R, P) {
  const lt = t - M.DUEL;
  const cam = duelCam({ x: lerp(8.6, 7.6, E.outCubic(lt / 1.15)), y: 3.3, pitch: 0.0, f: 1300 });
  const w = duelWide(R, t, cam, { price: 0 });
  const pY = cam.p(w.hx, w.topY, w.hz), pE = cam.p(RIVAL_POS[0], w.topE, RIVAL_POS[1]);
  if (pY) drawPlayer(R, { x: pY[0], y: pY[1], s: 0.3 * pY[3], pose: 'idle', cast: CAST.you, face: { eyeL: 'smugL', eyeR: 'smugL', lookX: 2 }, led: RGB.cyan, yaw: 0.6 });
  if (pE) drawPlayer(R, { x: pE[0], y: pE[1], s: 0.3 * pE[3], pose: 'point', cast: CAST.exit, face: { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk', lookX: -2 }, led: RGB.red, yaw: 0.6, flip: true, rim: { x: -0.8, y: -0.5, col: RGB.red, k: 1 } });
  const a = clamp(lt / 0.08);
  bigWord(R, '1V1', { x: 960, y: 330, size: 250, alpha: a, scale: 1 + 0.2 * (1 - E.outQuart(lt / 0.2)), fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2, extrude: { dx: 0, dy: 7, n: 7, col: [40, 36, 70], col2: [10, 9, 20] } });
  label(R, 'BEST OF 3  ·  POT 50 USDC', 960, 410, { size: 22, col: RGB.cyan, tracking: 8, align: 'center', alpha: clamp((lt - 0.25) / 0.1) });
  if (pY) nameTag(R, pY[0], pY[1] - 0.3 * pY[3] * 5.2, 'YOU', { size: 20, alpha: a });
  if (pE) nameTag(R, pE[0], pE[1] - 0.3 * pE[3] * 5.2, 'EXIT_LIQUIDITY', { size: 20, col: RGB.red, alpha: a });
  P.flash = pulse(t, M.DUEL, 0.07) * 0.15; P.bloom = 0.95;
}

function scoreHUD(R, t, alpha = 1) {
  const [y, e] = score(t);
  const pY = t >= DUEL.r2.res ? pulse(t, DUEL.r2.res, 0.2) : 0, pE = pulse(t, DUEL.r1.res, 0.2);
  label(R, 'YOU', 760, 90, { size: 22, weight: 700, col: RGB.cyan, tracking: 6, align: 'right', alpha });
  money(R, String(y), 850, 112, { size: 72, col: RGB.cyan, scale: 1 + pY * 0.4, alpha });
  money(R, '—', 960, 105, { size: 40, col: [168, 162, 200], alpha });
  money(R, String(e), 1070, 112, { size: 72, col: RGB.red, scale: 1 + pE * 0.4, alpha });
  label(R, 'EXIT_LIQUIDITY', 1160, 90, { size: 22, weight: 700, col: RGB.red, tracking: 6, align: 'left', alpha });
}

// 27.47 – 29.997  Rounds on the roll: faces and the candle.
function shotRounds(t, R, P) {
  const lt = t - M.ROLL2;
  const i = Math.floor(lt / (BEAT / 2));    // cut every 8th
  const seg = t < DUEL.r1.res ? DUEL.r1 : t < DUEL.r2.res ? DUEL.r2 : DUEL.r3;
  const pickedY = t >= seg.pick, pickedE = t >= seg.pick + 0.06;
  const resolved = t >= seg.res && seg !== DUEL.r3;
  const kind = i % 3;
  if (kind === 0 || kind === 1) {
    const you = kind === 0;
    const who = you ? CAST.you : CAST.exit;
    const dir = you ? seg.you : seg.exit;
    const won = resolved && seg.out === dir;
    const lost = resolved && seg.out !== dir;
    const face = won ? { eyes: 'dollar', mouth: 'grin' } : lost ? { eyes: 'x', mouth: 'frown' } : (you ? pickedY : pickedE) ? { eyes: dir === 1 ? 'up' : 'down' } : { eyes: 'question' };
    const led = won ? RGB.green : lost ? RGB.red : dir === 1 ? RGB.green : RGB.red;
    const cb = you ? [RGB.cyan, WHITE] : [RGB.red, [255, 0, 79]];
    bokeh(R, t, { n: 40, seed: 70 + i, y0: 100, h: 900, r: 50, a: 0.18, cols: cb });
    const zoom = 1 + (lt % (BEAT / 2)) * 0.5;
    drawHelmet(R, { x: you ? 900 : 1020, y: 520, s: 400 * zoom, type: who.type, shell: who.shell, accent: who.accent, stripes: who.stripes, face, led, yaw: you ? 0.25 : -0.25, status: led, body: 'bust', key: { x: you ? -0.5 : 0.5, y: -0.5, col: [220, 230, 255], k: 0.55 }, rim: { x: you ? 0.9 : -0.9, y: -0.3, col: you ? RGB.cyan : RGB.red, k: 1.1 } });
  } else {
    const cam = duelCam({ x: 8, y: 1.6, pitch: 0.1, f: 1300, dz: 0 });
    duelWide(R, t, cam, {});
    speedLines(R, t, { vertical: true, n: 30, alpha: 0.1, col: WHITE });
  }
  scoreHUD(R, t);
  if (seg === DUEL.r3 && t > seg.pick) {
    const a = env(t, seg.pick, M.ROLL2_END + 0.1, 0.05, 0.05);
    bigWord(R, 'FINAL ROUND', { x: 960, y: 1000, size: 90, alpha: a, fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2 });
  }
  P.flash = pulse(t, M.ROLL2 + i * BEAT / 2, 0.04) * 0.08; P.ca = 0.005; P.bloom = 1.0;
}

// 29.997 – 30.90  Standoff. Everything stops but the orbit.
function shotStandoff(t, R, P) {
  const lt = t - M.ROLL2_END;
  const ang = lerp(-0.18, 0.12, lt / 0.9);
  const cam = new Cam({ x: Math.cos(ang) * 7.2, y: 3.4, z: CANDLE_Z + Math.sin(ang) * 7.2, yaw: -Math.PI / 2 - ang, pitch: 0.0, f: 1350 });
  const w = duelWide(R, 29.98, cam, { price: 0 });
  const pY = cam.p(w.hx, w.topY, w.hz), pE = cam.p(RIVAL_POS[0], w.topE, RIVAL_POS[1]);
  if (pY) drawPlayer(R, { x: pY[0], y: pY[1], s: 0.3 * pY[3], pose: 'brace', cast: CAST.you, face: { eyes: 'down' }, led: RGB.red, yaw: 0.5 });
  if (pE) drawPlayer(R, { x: pE[0], y: pE[1], s: 0.3 * pE[3], pose: 'brace', cast: CAST.exit, face: { eyes: 'up' }, led: RGB.green, yaw: 0.5, flip: true, rim: { x: -0.8, y: -0.5, col: RGB.red, k: 1 } });
  scoreHUD(R, t, 0.9);
  P.satBase = 0.15; P.satGlow = 0.6; P.monoTint = 0.2; P.vignette = 0.85; P.bloom = 0.8; P.grain = 0.06;
}

// 30.90 – 31.837  It dumps. YOU called it. The rival's tower goes.
function shotPlunge(t, R, P) {
  const lt = t - M.DROP2;
  const [sx, sy] = shake(t, M.DROP2, 22, 0.8, 20, 7);
  const cam = duelCam({ x: lerp(7.6, 8.8, lt), y: lerp(3.0, 3.5, lt), pitch: -0.02, f: 1300 });
  cam.sx = sx; cam.sy = sy;
  const w = duelWide(R, t, cam, { exitFall: true });
  // the rival's tower blocks scatter
  const { b, g } = R;
  for (let k = 0; k < 6; k++) {
    const vx = (hash1(k * 3.1) - 0.5) * 8, vy = 3 + hash1(k * 7.7) * 4, vz = (hash1(k * 1.3) - 0.5) * 4;
    const px = RIVAL_POS[0] + vx * lt, py = k * BLOCK + vy * lt - 9.8 * lt * lt, pz = RIVAL_POS[1] + vz * lt;
    const q = cam.p(px, py, pz); if (!q) continue;
    const sz = BLOCK * q[3];
    b.save(); b.translate(q[0], q[1]); b.rotate(lt * (k - 2.5) * 3);
    b.fillStyle = rgba(k % 3 === 2 ? RGB.green : RGB.red, 0.95); b.fillRect(-sz, -sz / 2, sz * 2, sz);
    g.save(); g.translate(q[0], q[1]); g.rotate(lt * (k - 2.5) * 3); g.fillStyle = rgba(k % 3 === 2 ? RGB.green : RGB.red, 0.8); g.fillRect(-sz * 1.1, -sz * 0.6, sz * 2.2, sz * 1.2); g.restore();
    b.restore();
  }
  // the rival falls
  const fy = 6 * BLOCK + 2.5 * lt - 9.8 * lt * lt;
  const pE = cam.p(RIVAL_POS[0], fy, RIVAL_POS[1]);
  if (pE) drawPlayer(R, { x: pE[0], y: pE[1], s: 0.3 * pE[3], pose: 'flail', cast: CAST.exit, face: { eyes: 'x', mouth: 'frown' }, led: RGB.red, roll: lt * 5, flip: true });
  const pY = cam.p(w.hx, w.topY, w.hz);
  if (pY) drawPlayer(R, { x: pY[0], y: pY[1] - Math.abs(Math.sin(lt * 9)) * 12, s: 0.3 * pY[3], pose: 'cheer', cast: CAST.you, face: { eyes: 'dollar', mouth: 'grin' }, led: RGB.green, yaw: 0.4 });
  shockwave(R, cam, 0, CANDLE_Z, lt, { r: 26, col: RGB.red, dur: 0.9 });
  const a = clamp((lt - 0.12) / 0.08);
  bigWord(R, 'GG.', { x: 960, y: 300, size: 210, alpha: a, scale: 1 + 0.2 * (1 - E.outQuart((lt - 0.12) / 0.2)), fill: [[255, 255, 255], [205, 200, 235]], glow: 0.2, extrude: { dx: 0, dy: 7, n: 7, col: [40, 36, 70], col2: [10, 9, 20] } });
  money(R, '+47.50 USDC', 960, 390, { size: 56, col: RGB.green, alpha: clamp((lt - 0.25) / 0.08) });
  scoreHUD(R, t);
  P.invert = lt < 0.034 ? 1 : 0; if (lt < 0.034) { P.satBase = 0; P.satGlow = 0; }
  P.flash = pulse(t, M.DROP2, 0.1) * 0.3; P.flashColor = [1, 0.3, 0.4]; P.ca = 0.008 * (1 - clamp(lt)); P.bloom = 1.15;
  P.blurVec = [0, lt < 0.15 ? -0.04 * (1 - lt / 0.15) : 0];
}

export const ACT2 = [
  { t0: bar(10), t1: 20.9, fn: shotRise },
  { t0: 20.9, t1: 21.95, fn: shotPublic },
  { t0: 21.95, t1: bar(13), fn: shotClimb },
  { t0: bar(13), t1: M.DUEL, fn: shotNemesis },
  { t0: M.DUEL, t1: M.ROLL2, fn: shotOneVOne },
  { t0: M.ROLL2, t1: M.ROLL2_END, fn: shotRounds },
  { t0: M.ROLL2_END, t1: M.DROP2, fn: shotStandoff },
  { t0: M.DROP2, t1: M.BR, fn: shotPlunge },
];
