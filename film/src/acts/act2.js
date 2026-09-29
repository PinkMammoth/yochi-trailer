// ACT II — THE RISE & THE DUEL (18.955 → 31.837)
// Calls stack under YOU. The crowd looks up. A nemesis. 1V1. Standoff. It dumps.
import { clamp, lerp, E, smooth, noise1, shake, pulse, env, rgba, hash1, spring } from '../core/math.js';
import { M, BEAT, BAR, bar, S16 } from '../core/music.js';
import { drawHelmet, RGB, C } from '../elements/helmet.js';
import { drawPlayer, blendPose } from '../elements/body.js';
import { Cam, drawSky, drawFloor, floorPool, strikeLine, drawCandleBox, drawCandle, dust } from '../elements/world.js';
import { drawCrowd } from '../elements/crowd.js';
import { headline, kicker, worldTitle, money, chatBubble, nameTag, fmtUSDC } from '../elements/type.js';
import { bokeh, stream, shockwave, confetti, speedLines } from '../elements/fx.js';
import { drawDotText, drawFlame } from '../elements/led.js';
import { world, pickOf, ledFor, eyesFor, CAST, CANDLE_Z, YOU_SHELL, CS, jump } from './common.js';

const WHITE = RGB.text;
const BLOCK = 0.62;            // tower block height (world)
const TW = 1.25;               // tower width
// The streak: a new correct call every half bar from the rise. The climb holds on the 4th (DEADEYE is
// its payoff, so the call beat never plays twice in that shot); the 5th lands offscreen on the NEMESIS cut.
const CALLS = [1, -1, 1, 1, -1, 1, -1];     // direction of each winning call
const CALL_T = [M.RISE - 0.3, M.RISE + BAR / 2, bar(11), 21.95, bar(13), bar(13) + BAR / 2, bar(14)];
const RANKS = ['NORMIE', 'PLEB', 'PLEB', 'TRADER', 'TRADER', 'ORACLE', 'ORACLE'];
function streakAt(t) { let n = 0; for (const c of CALL_T) if (t >= c) n++; return n; }

// Hero position in the arena
function heroPos() { const { hero } = world(); return [hero.x, hero.z]; }
const RIVAL_POS = [0, CANDLE_Z + 2.9];
const YOU_DUEL = [0, CANDLE_Z - 2.9];

// A tower of calls: blocks coloured by the direction that won.
function drawTower(R, cam, x, z, n, t, o = {}) {
  const { b, g } = R;
  const blocks = o.blocks || CALLS;
  let top = 0;
  for (let i = 0; i < n; i++) {
    const dir = blocks[i % blocks.length];
    const col = o.col || (o.neutral === false ? (dir === 1 ? RGB.green : RGB.red) : RGB.cyan);
    const strip = dir === 1 ? RGB.green : RGB.red;
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
    // call-direction LED strip across the front face
    if (o.neutral !== false && cam.z > z + hw) {
      const sy = (y0 + y1) / 2;
      const a1 = P(x - hw * 0.7, sy, z + hw), a2 = P(x + hw * 0.7, sy, z + hw);
      if (a1 && a2) {
        const lw = Math.max(1.5, 0.06 * a1[3]);
        b.strokeStyle = rgba([lerp(strip[0], 255, 0.4), lerp(strip[1], 255, 0.4), lerp(strip[2], 255, 0.4)], k); b.lineWidth = lw;
        b.beginPath(); b.moveTo(a1[0], a1[1]); b.lineTo(a2[0], a2[1]); b.stroke();
        g.strokeStyle = rgba(strip, 0.9 * k); g.lineWidth = lw * 3; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(a2[0], a2[1]); g.stroke();
      }
    }
    top += h;
  }
  return top;
}

// The Deadeye badge (the real Yochi achievement art), loaded once before the first frame.
let DEADEYE_BADGE = null, _badgeSil = null;
export async function loadAchievementArt() {
  const img = new Image();
  img.src = 'assets/achievements/deadeye.png';
  await img.decode();
  DEADEYE_BADGE = img;
}
// its black silhouette, to knock the emissive layer out behind it
function badgeSilhouette() {
  if (_badgeSil) return _badgeSil;
  const c = document.createElement('canvas');
  c.width = DEADEYE_BADGE.naturalWidth; c.height = DEADEYE_BADGE.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(DEADEYE_BADGE, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  _badgeSil = c;
  return c;
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
  kicker(R, 'STREAK', x, y - 70, { size: 19, col: RGB.gold, align: o.align || 'left' });
  money(R, String(n), x + (o.align === 'right' ? -10 : 0), y + 40, { size: 120, col: RGB.gold, align: o.align || 'left', scale: pop, glow: 0.8, hot: 0.25 });
  // LED flame beside the number, growing with the streak
  if (n >= 2) drawFlame(R, x + (o.align === 'right' ? -120 : 118), y + 36, 7 + Math.min(4, n - 2) * 1.6, t, { intensity: 1 });
  kicker(R, RANKS[Math.min(i, RANKS.length - 1)], x, y + 92, { size: 26, col: [245, 243, 255], align: o.align || 'left', track: 0.34, glow: 0.2 });
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
  const cam = new Cam({ x: hx - 0.75, y: topNow + 0.75, z: hz - 2.25, yaw: 0.3, pitch: 0.04, f: 1150 });
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
    const hd = drawPlayer(R, { x: pp[0], y: pp[1] - hop * pp[3], s: 0.3 * pp[3], pose, cast: CAST.you, face: heroStreakFace(t), led: since < 0.28 ? RGB.gold : RGB.green, yaw: 0.1, key: { x: -0.3, y: -0.7, col: [200, 230, 255], k: 0.6 }, rim: { x: 0.8, y: -0.5, col: RGB.cyan, k: 1.1 } });
    nameTag(R, hd.hx, hd.hy - hd.hs * 1.38, 'YOU', { size: 20 });
  }
  streakHUD(R, t, 1420, 520);
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
  const crowdSt = (m) => {
    if (m.hero) return { hide: true };
    const pk = pickOf(m);
    const d = Math.hypot(m.x - hx, m.z - hz);
    const delay = clamp(d / 18) * 0.35;
    const k = E.outBack(clamp((lt - delay) / 0.3));
    return { eyes: k > 0.5 ? 'wide' : eyesFor(pk), led: k > 0.5 ? WHITE : ledFor(pk), ledI: 1, look: k * 0.8, status: null, forceFront: true };
  };
  const crowdEnv = { lit: [120, 140, 200], key: { x: 0, y: -0.6, col: [190, 225, 255], k: 0.5 }, rim: { x: 0, y: -1, col: RGB.cyan, k: 0.8 }, fogCol: [26, 22, 50], fogNear: 4, fogFar: 40, near: 1.4, back: false };
  // the sign stands on the arena floor beyond the tower
  const SX = hx + 0.4, SZ = hz - 17;
  const sp = cam.p(SX, 0, SZ);
  const signDepth = sp ? sp[2] : 30;
  drawCrowd(R, cam, crowd, crowdSt, { ...crowdEnv, minZ: signDepth });
  worldTitle(R, cam, 'IS PUBLIC.', SX, 1.9, SZ, 2.5, { inT: lt - 0.3, glow: 0.18, halo: 1.1, hi: { from: 'PUBLIC.', col: [120, 236, 255], glow: 0.45, glowCol: RGB.cyan } });
  worldTitle(R, cam, 'EVERY WIN', SX, 1.9 + 2.5 * 1.02, SZ, 2.5, { inT: lt - 0.12, glow: 0.18, halo: 1.1 });
  drawCrowd(R, cam, crowd, crowdSt, { ...crowdEnv, maxZ: signDepth });
  const top = drawTower(R, cam, hx, hz, n, t, { times: CALL_T });
  const pp = cam.p(hx, top, hz);
  if (pp) drawPlayer(R, { x: pp[0], y: pp[1], s: 0.3 * pp[3], pose: blendPose('idle', 'cheer', E.outBack(clamp((lt - 0.2) / 0.3))), cast: CAST.you, face: { eyeL: 'smugL', eyeR: 'smugL', mouth: 'smirk' }, led: RGB.green, yaw: 0.0, pitch: 0.2 });
  P.bloom = 0.9;
}

// 21.95 – 24.476  The climb continues; stickers and ranks.
function shotClimb(t, R, P) {
  const { crowd } = world();
  const [hx, hz] = heroPos();
  const n = streakAt(t);
  const lt = t - 21.95;
  const top0 = n * BLOCK;
  const cam = new Cam({ x: hx + 0.95, y: top0 + lerp(0.8, 0.95, lt / 2.5), z: hz - 2.3, yaw: -0.38, pitch: 0.0, f: 1150 });
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
    // the Deadeye badge slaps onto the helmet at streak 4 (the real art: seated with a contact shadow,
    // blocking the glow behind it and giving off a little of its own)
    const tA = CALL_T[3] + 0.05;
    const tOut = bar(13);   // the achievement holds until NEMESIS cuts in
    if (t > tA) {
      const u = E.outBack(clamp((t - tA) / 0.16), 3);
      const sx = hd.hx + s * 0.55, sy = hd.hy - s * 0.62;
      const { b, g } = R;
      const BW = 82;        // badge box in sticker units (the art spans ~64 across, like the old sticker)
      const place = (c) => { c.translate(sx, sy); c.rotate(-0.25 + (1 - u) * 1.2); c.scale(u * s * 0.012, u * s * 0.012); c.imageSmoothingQuality = 'high'; };
      b.save(); place(b);
      b.shadowColor = 'rgba(3,2,7,0.7)'; b.shadowBlur = 7 * R.S; b.shadowOffsetY = 2 * R.S;
      b.drawImage(DEADEYE_BADGE, -BW / 2, -BW / 2, BW, BW);
      b.restore();
      g.save(); place(g);
      g.drawImage(badgeSilhouette(), -BW / 2, -BW / 2, BW, BW);
      g.globalAlpha = 0.35; g.drawImage(DEADEYE_BADGE, -BW / 2, -BW / 2, BW, BW);
      g.restore();
      const la = env(t, tA, tOut, 0.05, 0.2);
      const { b: bb, g: gg } = R;
      // chamfered plate (Chakra Petch's cut corners)
      const px0 = 250, py0 = 322, pw = 560, ph = 196, ch = 18;
      const plate = (c) => { c.beginPath(); c.moveTo(px0 + ch, py0); c.lineTo(px0 + pw, py0); c.lineTo(px0 + pw, py0 + ph - ch); c.lineTo(px0 + pw - ch, py0 + ph); c.lineTo(px0, py0 + ph); c.lineTo(px0, py0 + ch); c.closePath(); };
      bb.save(); bb.globalAlpha = la; bb.fillStyle = 'rgba(9,8,16,0.86)'; plate(bb); bb.fill();
      bb.strokeStyle = 'rgba(24,224,255,0.55)'; bb.lineWidth = 1.5; plate(bb); bb.stroke();
      bb.fillStyle = 'rgba(24,224,255,1)'; bb.fillRect(px0 + ch, py0 - 1, 120, 4); bb.restore();
      gg.save(); gg.globalAlpha = la * 0.6; gg.fillStyle = 'rgba(24,224,255,1)'; gg.fillRect(px0 + ch, py0 - 2, 120, 6); gg.restore();
      kicker(R, 'ACHIEVEMENT UNLOCKED', 530, 366, { size: 17, col: RGB.cyan, align: 'center', alpha: la });
      headline(R, 'DEADEYE', { x: 530, y: 462, size: 96, inT: t - tA - 0.04, outT: tOut - t, glow: 0.12, halo: 0 });
      kicker(R, 'LEGENDARY · 60% OVER 100 ROUNDS', 530, 494, { size: 15, col: [168, 162, 200], align: 'center', alpha: la, glow: 0, track: 0.18 });
    }
  }
  streakHUD(R, t, 1440, 470);
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
      drawHelmet(R, { x: 560 - split * 60, y: 540, s: 300, type: 'dome', shell: YOU_SHELL, accent: C.cyan, stripes: 'y', face: { eyes: 'wide', mouth: 'o', lookX: 2 }, led: WHITE, yaw: 0.3, body: 'bust', key: { x: 0.5, y: -0.4, col: [255, 180, 200], k: 0.5 }, rim: { x: 0.9, y: -0.3, col: RGB.red, k: 0.9 } });
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
  headline(R, 'NEMESIS DETECTED', { x: 960, y: 1004, size: 128, alpha: flick, inT: lt - 0.3, col: [255, 120, 146], glow: 0.55, glowCol: RGB.red, halo: 1.1,
    kicker: { text: '▲ RIVAL ACTIVITY ▲', col: RGB.red, size: 20 }, rule: { col: RGB.red } });
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
  const topE = o.exitFall ? 0 : drawTower(R, cam, RIVAL_POS[0], RIVAL_POS[1], nE, t, { blocks: [-1, -1, 1, -1, 1, -1], col: [255, 56, 96] });
  drawCandleBox(R, cam, { x: 0, z: CANDLE_Z, close: p * CS, hi: Math.max(p, 0) * CS, lo: Math.min(p, 0) * CS, w: 2.2, col, k: 1.1, flat: Math.abs(p) < 0.03 });
  return { topY, topE, hx, hz };
}

// 26.316 – 27.47  1V1. Best of 3.
function shotOneVOne(t, R, P) {
  const lt = t - M.DUEL;
  const cam = duelCam({ x: lerp(4.6, 4.1, E.outCubic(lt / 1.15)), y: 5.0, pitch: -0.13, f: 1100 });
  const w = duelWide(R, t, cam, { price: 0 });
  const pY = cam.p(w.hx, w.topY, w.hz), pE = cam.p(RIVAL_POS[0], w.topE, RIVAL_POS[1]);
  const hY = pY ? drawPlayer(R, { x: pY[0], y: pY[1], s: 0.3 * pY[3], pose: 'idle', cast: CAST.you, face: { eyeL: 'smugL', eyeR: 'smugL', lookX: 2 }, led: RGB.cyan, yaw: 0.6 }) : null;
  const hE = pE ? drawPlayer(R, { x: pE[0], y: pE[1], s: 0.3 * pE[3], pose: 'point', cast: CAST.exit, face: { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk', lookX: -2 }, led: RGB.red, yaw: 0.6, flip: true, rim: { x: -0.8, y: -0.5, col: RGB.red, k: 1 } }) : null;
  const a = clamp(lt / 0.08);
  const bb = worldTitle(R, cam, '1V1', 0, 4.35, CANDLE_Z, 1.02, { inT: lt, glow: 0.22, halo: 0.9, rule: { col: RGB.cyan } });
  if (bb) kicker(R, 'BEST OF 3 · POT 50 USDC', bb.x, bb.y + bb.size * 0.46, { size: 26, col: [150, 236, 255], glow: 0.3, align: 'center', alpha: clamp((lt - 0.25) / 0.1), halo: 2 });
  if (hY) nameTag(R, hY.hx, hY.hy - hY.hs * 2.3, 'YOU', { size: 20, alpha: a });
  if (hE) nameTag(R, hE.hx, hE.hy - hE.hs * 2.3, 'EXIT_LIQUIDITY', { size: 20, col: RGB.red, alpha: a });
  P.flash = pulse(t, M.DUEL, 0.07) * 0.15; P.bloom = 0.95;
}

function scoreHUD(R, t, alpha = 1) {
  const [y, e] = score(t);
  const pY = t >= DUEL.r2.res ? pulse(t, DUEL.r2.res, 0.2) : 0, pE = pulse(t, DUEL.r1.res, 0.2);
  kicker(R, 'YOU', 770, 88, { size: 22, col: RGB.cyan, align: 'right', alpha });
  money(R, String(y), 850, 112, { size: 72, col: RGB.cyan, scale: 1 + pY * 0.4, alpha });
  money(R, '—', 960, 105, { size: 40, col: [168, 162, 200], alpha });
  money(R, String(e), 1070, 112, { size: 72, col: RGB.red, scale: 1 + pE * 0.4, alpha });
  kicker(R, 'EXIT_LIQUIDITY', 1150, 88, { size: 22, col: RGB.red, align: 'left', alpha, track: 0.2 });
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
    headline(R, 'FINAL ROUND', { x: 960, y: 1004, size: 100, inT: t - seg.pick, outT: M.ROLL2_END + 0.1 - t, glow: 0.2, rule: { col: RGB.cyan } });
  }
  P.flash = pulse(t, M.ROLL2 + i * BEAT / 2, 0.04) * 0.08; P.ca = 0.005; P.bloom = 1.0;
}

// 29.997 – 30.90  Standoff. Two visors, frozen: ▼▼ against ▲▲.
function shotStandoff(t, R, P) {
  const lt = t - M.ROLL2_END;
  const { b, g } = R;
  const z = 1 + lt * 0.08;
  const half = (clipX, drawFn) => { b.save(); g.save(); b.beginPath(); b.rect(clipX, 0, 960, 1080); b.clip(); g.beginPath(); g.rect(clipX, 0, 960, 1080); g.clip(); drawFn(); b.restore(); g.restore(); };
  half(0, () => {
    b.fillStyle = '#0a1016'; b.fillRect(0, 0, 960, 1080);
    drawHelmet(R, { x: 520, y: 600, s: 470 * z, type: 'dome', shell: YOU_SHELL, accent: C.cyan, stripes: 'y', face: { eyes: 'down' }, led: RGB.red, yaw: 0.35, status: C.red, body: 'bust', key: { x: 0.6, y: -0.4, col: [220, 230, 255], k: 0.5 }, rim: { x: -0.9, y: -0.3, col: RGB.cyan, k: 1 } });
  });
  half(960, () => {
    b.fillStyle = '#140a0e'; b.fillRect(960, 0, 960, 1080);
    drawHelmet(R, { x: 1400, y: 600, s: 470 * z, type: 'bear', shell: CAST.exit.shell, accent: C.red, stripes: 'one', face: { eyes: 'up' }, led: RGB.green, yaw: -0.35, status: C.green, body: 'bust', key: { x: -0.6, y: -0.4, col: [255, 200, 210], k: 0.5 }, rim: { x: 0.9, y: -0.3, col: RGB.red, k: 1.1 } });
  });
  b.fillStyle = 'rgba(245,243,255,0.9)'; b.fillRect(958, 0, 4, 1080);
  g.fillStyle = 'rgba(245,243,255,0.4)'; g.fillRect(954, 0, 12, 1080);
  kicker(R, 'YOU', 480, 150, { size: 26, col: RGB.cyan, align: 'center' });
  kicker(R, 'EXIT_LIQUIDITY', 1440, 150, { size: 26, col: RGB.red, align: 'center', track: 0.2 });
  scoreHUD(R, t, 0.95);
  kicker(R, 'FINAL ROUND', 960, 1010, { size: 24, col: [245, 243, 255], align: 'center', track: 0.4 });
  P.satBase = 0.2; P.satGlow = 0.75; P.monoTint = 0.15; P.vignette = 0.85; P.bloom = 0.85; P.grain = 0.06;
}

// 30.90 – 31.837  It dumps. YOU called it. The rival's tower goes.
function shotPlunge(t, R, P) {
  const lt = t - M.DROP2;
  const [sx, sy] = shake(t, M.DROP2, 22, 0.8, 20, 7);
  const cam = duelCam({ x: lerp(4.4, 5.4, lt), y: lerp(4.6, 4.9, lt), pitch: -0.12, f: 1100 });
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
  if (pE) drawPlayer(R, { x: pE[0], y: pE[1], s: 0.36 * pE[3], pose: 'flail', cast: CAST.exit, face: { eyes: 'x', mouth: 'frown' }, led: RGB.red, roll: lt * 5, flip: true });
  const pY = cam.p(w.hx, w.topY, w.hz);
  if (pY) drawPlayer(R, { x: pY[0], y: pY[1] - jump(lt, 0.2) * pY[3], s: 0.3 * pY[3], pose: 'cheer', cast: CAST.you, face: { eyes: 'dollar', mouth: 'grin' }, led: RGB.green, yaw: 0.4 });
  shockwave(R, cam, 0, CANDLE_Z, lt, { r: 26, col: RGB.red, dur: 0.9 });
  headline(R, 'GG.', { x: 960, y: 312, size: 230, inT: lt - 0.12, glow: 0.22, rule: { col: RGB.green } });
  money(R, '+47.50 USDC', 960, 418, { size: 58, col: RGB.green, alpha: clamp((lt - 0.25) / 0.08) });
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
