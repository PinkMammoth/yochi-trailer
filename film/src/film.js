// Master timeline: every shot of the film, in order.
import { ACT1 } from './acts/act1.js';
import { ACT2, loadAchievementArt } from './acts/act2.js';
import { ACT3 } from './acts/act3.js';
import { ACT4 } from './acts/act4.js';
import { world } from './acts/common.js';
import { label } from './elements/type.js';
import { E, clamp } from './core/math.js';
import { M } from './core/music.js';

const SHOTS = [...ACT1, ...ACT2, ...ACT3, ...ACT4];

// Vertical whips between shots (vertical is meaning in this world: up or down).
// dir +1: content moves up out of frame (camera whips down); -1: content moves down (camera whips up).
const WHIPS = [
  { at: M.RISE, out: 0.22, in: 0.2, dir: -1 },      // the L -> the rise: whip UP
  { at: M.BR, out: 0.26, in: 0.24, dir: 1 },        // GG -> battle royale: fall DOWN into it
  { at: M.BACK_IT, out: 0.0, in: 0.18, dir: -1 },   // DOWN -> BACK IT: come back up
];

// Debug sheets (outside the film's 0–62 s): t=100 characters, t=101 head lab (close-ups and crowd sizes).
import { drawHelmet, RGB as RGB_, C as C_ } from './elements/helmet.js';
import { drawPlayer, POSES } from './elements/body.js';
import { loadCanon, drawCanon } from './elements/canon.js';
import { loadRig, drawRig } from './elements/rig.js';
import { CAST } from './acts/common.js';
const YOU_DARK = { ...CAST.you, shell: [28, 28, 40] };
const YOU_PEARL = { ...CAST.you, shell: [226, 224, 240] };
function sheetBg(b) {
  const bg = b.createRadialGradient(960, 560, 50, 960, 560, 1200);
  bg.addColorStop(0, '#1b1932'); bg.addColorStop(1, '#07060c');
  b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
}
function charSheet(t, R, P) {
  const { b } = R;
  sheetBg(b);
  const casts = [YOU_DARK, YOU_PEARL, CAST.exit, CAST.oxtom, CAST.soup, CAST.cope, { type: 'horns', shell: [78, 52, 58], accent: C_.gold }, { type: 'fin', shell: [56, 64, 90], accent: C_.faint }];
  const faces = [{ eyes: 'up' }, { eyes: 'up' }, { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk' }, { eyes: 'dollar', mouth: 'grin' }, { eyeL: 'gtL', eyeR: 'ltR', mouth: 'wobble' }, { eyes: 'down' }, { eyes: 'x', mouth: 'frown' }, { eyes: 'happy', mouth: 'smile' }];
  const leds = [RGB_.green, RGB_.green, RGB_.red, RGB_.green, RGB_.text, RGB_.red, RGB_.red, RGB_.cyan];
  for (let i = 0; i < 8; i++) {
    drawHelmet(R, { x: 125 + i * 238, y: 250, s: 80, type: casts[i].type, shell: casts[i].shell, accent: casts[i].accent, stripes: casts[i].stripes,
      face: faces[i], led: leds[i], yaw: (i - 3.5) * 0.1, body: 'bust', status: leds[i],
      key: { x: -0.6, y: -0.5, col: [190, 225, 255], k: 0.6 }, rim: { x: 0.85, y: -0.45, col: RGB_.cyan, k: 1.0 } });
  }
  const poses = ['idle', 'cheer', 'fist', 'raise', 'point', 'brace', 'slump', 'shrug', 'flail'].filter((p) => POSES[p]);
  const cs = [YOU_DARK, CAST.exit, YOU_DARK, CAST.oxtom, CAST.exit, YOU_PEARL, CAST.cope, CAST.soup, CAST.exit];
  poses.forEach((pose, i) => {
    drawPlayer(R, { x: 110 + i * 200, y: 1040, s: 62, pose, cast: cs[i], face: { eyes: i % 2 ? 'down' : 'up' }, led: i % 2 ? RGB_.red : RGB_.green, yaw: 0.15, roll: pose === 'flail' ? 0.4 : 0 });
  });
}

// Head lab: the cast large (material and panel detail), then crowd sizes (readability at scale).
function headLab(t, R, P) {
  const { b } = R;
  sheetBg(b);
  const key = { x: -0.55, y: -0.5, col: [190, 225, 255], k: 0.6 }, rim = { x: 0.85, y: -0.45, col: RGB_.cyan, k: 1.0 };
  drawHelmet(R, { x: 250, y: 300, s: 175, ...YOU_DARK, face: { eyes: 'up' }, led: RGB_.green, status: C_.green, body: 'bust', key, rim });
  drawHelmet(R, { x: 725, y: 300, s: 175, ...YOU_PEARL, face: { eyes: 'up' }, led: RGB_.green, status: C_.green, body: 'bust', key, rim });
  drawHelmet(R, { x: 1200, y: 300, s: 175, ...CAST.exit, face: { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk' }, led: RGB_.red, status: C_.red, body: 'bust', yaw: -0.35, key: { ...key, x: 0.5 }, rim: { ...rim, x: -0.85 } });
  drawHelmet(R, { x: 1675, y: 300, s: 175, type: 'dome', shell: [62, 56, 90], accent: C_.faint, face: { eyes: 'dot' }, led: RGB_.text, body: 'bust', yaw: 0.4, key, rim });
  const types = ['dome', 'bear', 'horns', 'frog', 'cat', 'antenna', 'fin'];
  const sizes = [64, 48, 38];
  sizes.forEach((s, j) => types.forEach((ty, i) => {
    drawHelmet(R, { x: 150 + i * 272 + j * 70 - 70, y: 800 + j * 36 - (j ? 0 : 20), s, type: ty, shell: [[62, 56, 90], [54, 50, 78], [72, 64, 100]][j], accent: C_.faint,
      face: { eyes: ['up', 'down', 'dot'][(i + j) % 3] }, led: [RGB_.green, RGB_.red, RGB_.text][(i + j) % 3], body: 'bust', status: null,
      key: { x: 0, y: -0.4, col: [200, 225, 255], k: 0.6 }, rim: { x: 0.1, y: -1, col: RGB_.cyan, k: 0.8 }, fog: j * 0.2, fogCol: [22, 19, 40] });
  }));
}

// Canon lab: the canonical contestants through the compositor (busts, then half-body poses), with the
// film's own procedural heads beside them for scale and level.
function canonLab(t, R, P) {
  sheetBg(R.b);
  const key = { x: -0.55, y: -0.5, col: [190, 225, 255], k: 0.6 }, rim = { x: 0.85, y: -0.45, col: RGB_.cyan, k: 1.0 };
  const faces = [{ eyes: 'up' }, { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk' }, { eyes: 'down' }, { eyes: 'dollar', mouth: 'grin' }];
  const leds = [RGB_.green, RGB_.red, RGB_.red, RGB_.green];
  ['base', 'bear', 'bull', 'rogue'].forEach((who, i) => {
    drawCanon(R, { who, kind: 'bust', x: 250 + i * 470, y: 260, s: 150, face: faces[i], led: leds[i], key, rim });
    drawCanon(R, { who, kind: 'pose', x: 250 + i * 470, y: 720, s: 110, face: { eyes: i % 2 ? 'x' : 'up', mouth: i % 2 ? 'frown' : undefined }, led: i % 2 ? RGB_.red : RGB_.cyan, status: i % 2 ? RGB_.red : null, key, rim: { ...rim, x: -0.85 } });
  });
  drawHelmet(R, { x: 1840, y: 640, s: 60, ...CAST.you, face: { eyes: 'up' }, led: RGB_.green, status: C_.green, body: 'bust', key, rim });
}

export async function initFilm(R) {
  world();
  await loadAchievementArt();
  await loadCanon();
  await loadRig('base');
  await loadRig('bear');
}

// Rig lab: YOU's painted rig in the film's poses (top), then the elbow-bend test and a jump/fall (bottom).
function rigLab(t, R, P) {
  sheetBg(R.b);
  const key = { x: -0.4, y: -0.7, col: [200, 230, 255], k: 0.6 }, rim = { x: 0.8, y: -0.5, col: RGB_.cyan, k: 1.0 };
  const poses = ['idle', 'raise', 'fist', 'cheer', 'brace', 'point', 'slump', 'shrug'];
  poses.forEach((pose, i) => drawRig(R, 'base', { x: 130 + i * 237, y: 500, s: 74, pose, face: { eyes: 'up' }, led: RGB_.green, key, rim }));
  const bends = [0, -0.6, -1.2, -1.8, -2.4, 0.6];
  bends.forEach((b, i) => drawRig(R, 'base', { x: 130 + i * 237, y: 1050, s: 74, pose: { ...POSES.idle, la: [0.6, b], ra: [1.4, b] }, face: { eyes: 'dot' }, led: RGB_.cyan, key, rim }));
  drawRig(R, 'base', { x: 130 + 6 * 237, y: 990, s: 74, pose: 'flail', roll: 0.5, face: { eyes: 'x', mouth: 'frown' }, led: RGB_.red, key, rim });
  drawPlayer(R, { x: 130 + 7 * 237, y: 1050, s: 74, pose: 'idle', cast: CAST.you, face: { eyes: 'up' }, led: RGB_.green, key, rim });
}
// The same for the bear (EXIT_LIQUIDITY), with YOU beside it for scale.
function rigLabBear(t, R, P) {
  sheetBg(R.b);
  const key = { x: -0.4, y: -0.7, col: [200, 230, 255], k: 0.6 }, rim = { x: 0.8, y: -0.5, col: RGB_.cyan, k: 1.0 };
  const poses = ['idle', 'point', 'raise', 'cheer', 'brace', 'slump', 'shrug'];
  poses.forEach((pose, i) => drawRig(R, 'bear', { x: 130 + i * 237, y: 500, s: 74, pose, face: { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk' }, led: RGB_.red, key, rim }));
  drawRig(R, 'base', { x: 130 + 7 * 237, y: 500, s: 74, pose: 'idle', face: { eyes: 'up' }, led: RGB_.green, key, rim });
  const bends = [0, -0.8, -1.6, -2.4];
  bends.forEach((b, i) => drawRig(R, 'bear', { x: 130 + i * 237, y: 1050, s: 74, pose: { ...POSES.idle, la: [0.6, b], ra: [1.4, b], ll: [0.5, 0.9 * (i % 2)], rl: [0.1, 0] }, face: { eyes: 'dot' }, led: RGB_.cyan, key, rim }));
  drawRig(R, 'bear', { x: 130 + 5 * 237, y: 990, s: 74, pose: 'flail', roll: 0.5, face: { eyes: 'x', mouth: 'frown' }, led: RGB_.red, key, rim });
  drawRig(R, 'bear', { x: 130 + 7 * 237, y: 990, s: 74, pose: 'flail', roll: -1.4, flip: true, face: { eyes: 'x', mouth: 'frown' }, led: RGB_.red, key, rim });
}

export function renderFilm(t, R, P) {
  if (t >= 100 && t < 101) return charSheet(t, R, P);
  if (t >= 101 && t < 102) return headLab(t, R, P);
  if (t >= 102 && t < 103) return canonLab(t, R, P);
  if (t >= 103 && t < 104) return rigLab(t, R, P);
  if (t >= 104 && t < 105) return rigLabBear(t, R, P);
  let shot = null;
  for (const s of SHOTS) if (t >= s.t0 && t < s.t1) { shot = s; break; }
  if (!shot) {
    label(R, `t=${t.toFixed(2)} — not yet built`, 960, 540, { align: 'center', size: 28, col: [120, 110, 160] });
    return;
  }
  let dy = 0, vel = 0;
  for (const w of WHIPS) {
    if (t < w.at && t >= w.at - w.out) {
      const u = (t - (w.at - w.out)) / w.out;
      dy = -w.dir * 1200 * E.inCubic(u); vel = -w.dir * 3 * u * u;
    } else if (t >= w.at && t < w.at + w.in) {
      const u = (t - w.at) / w.in;
      dy = w.dir * 1200 * (1 - E.outCubic(u)); vel = -w.dir * 3 * (1 - u) * (1 - u);
    }
  }
  if (dy) { R.b.save(); R.g.save(); R.b.translate(0, dy); R.g.translate(0, dy); }
  shot.fn(t, R, P);
  if (dy) { R.b.restore(); R.g.restore(); }
  if (vel) { P.blurVec = [0, vel * 0.06]; P.ca = Math.max(P.ca, Math.abs(vel) * 0.004); }
}
