// The two fighters as pixel sprites, drawn from shapes on a pose skeleton (see lib/pixel.js).
// HYPE: enormous, a little unhinged. Wild ink hair, vermilion hachimaki, cream hand wraps, manic eyes.
// USDC: a small accountant. Grey suit, blue tie, glasses, side parting, briefcase.
import { part, capsule, ellipse, poly, blob, px, sprite } from '../../lib/pixel.js';
import { lerp } from '../../core/math.js';

// --------------------------------------------------------------------------------------------- palettes
export const C = {
  ink: '#0b0908', ink2: '#221e1a', ink3: '#3a332c',
  skinL: '#f6c99a', skin: '#dc9a66', skinS: '#a96a42', skinD: '#7a4a2e',
  hair: '#16130f', hairL: '#3a332c',
  red: '#ff5436', redS: '#bf3a24', redL: '#ff8a6a',
  wrap: '#efe7d8', wrapS: '#c2b8a6',
  pant: '#2a2520', pantS: '#16130f', pantL: '#463e36',
  white: '#fff8ef', eye: '#fff8ef',
  // USDC
  uskin: '#f0d0b4', uskinS: '#c99c80', uskinL: '#fbe6d2',
  suit: '#7d7871', suitS: '#55514c', suitL: '#a39d94',
  shirt: '#efe7d8', shirtS: '#c9c0b0',
  tie: '#3a7bd5', tieS: '#24539a',
  uhair: '#5a4632', uhairL: '#7c6448',
  glass: '#16130f', lens: '#d8e6ee',
  shoe: '#16130f', case: '#7a5234', caseS: '#4e331f', caseL: '#9c6c46', metal: '#d9cfbd',
};
const HYPE_PAL = [C.skinL, C.skin, C.skinS, C.skinD, C.hair, C.hairL, C.red, C.redS, C.redL, C.wrap, C.wrapS, C.pant, C.pantS, C.pantL, C.white, C.ink, C.ink2];
const USDC_PAL = [C.uskin, C.uskinS, C.uskinL, C.suit, C.suitS, C.suitL, C.shirt, C.shirtS, C.tie, C.tieS, C.uhair, C.uhairL, C.glass, C.lens, C.shoe, C.case, C.caseS, C.caseL, C.metal, C.ink, C.white];

const SK = [C.skinL, C.skin, C.skinS];
const PANT = [C.pantL, C.pant, C.pantS];
const WRAP = [C.white, C.wrap, C.wrapS];


// --------------------------------------------------------------------------------------------- HYPE poses
// Facing right, origin at the feet, y up is negative. ~150 px tall standing.
const P_IDLE = {
  hip: [0, -60], chest: [4, -98], neck: [10, -124], head: [14, -138], lean: 0,
  shF: [26, -114], elF: [44, -92], fiF: [50, -114],
  shB: [-14, -114], elB: [-6, -86], fiB: [22, -110],
  hpF: [12, -58], knF: [30, -30], ftF: [42, 0],
  hpB: [-12, -58], knB: [-26, -30], ftB: [-36, 0],
  face: 'grin',
};
const P_WIND = {
  hip: [-6, -58], chest: [-8, -96], neck: [-4, -122], head: [0, -136],
  shF: [16, -114], elF: [36, -100], fiF: [40, -120],
  shB: [-26, -112], elB: [-50, -98], fiB: [-64, -116],
  hpF: [8, -56], knF: [30, -30], ftF: [44, 0],
  hpB: [-16, -56], knB: [-30, -28], ftB: [-42, 0],
  face: 'mad',
};
const P_PUNCH = {
  hip: [10, -56], chest: [26, -92], neck: [38, -116], head: [44, -128],
  shF: [12, -110], elF: [4, -90], fiF: [20, -104],
  shB: [46, -110], elB: [80, -92], fiB: [112, -68],
  hpF: [20, -54], knF: [52, -30], ftF: [70, 0],
  hpB: [-2, -54], knB: [-26, -26], ftB: [-50, 0],
  face: 'yell', bigFist: true,
};
const P_WIN = {
  hip: [0, -62], chest: [2, -100], neck: [6, -126], head: [8, -141],
  shF: [24, -116], elF: [40, -140], fiF: [36, -170],
  shB: [-18, -116], elB: [-34, -94], fiB: [-14, -78],
  hpF: [12, -60], knF: [24, -30], ftF: [34, 0],
  hpB: [-12, -60], knB: [-22, -30], ftB: [-30, 0],
  face: 'laugh',
};
function mixPose(a, b, t) {
  const o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)] : (t < 0.5 ? a[k] : b[k]);
  return o;
}
function bob(p, y) { const o = {}; for (const k in p) o[k] = Array.isArray(p[k]) ? [p[k][0], p[k][1] + (k.startsWith('ft') ? 0 : k.startsWith('kn') ? y * 0.5 : y)] : p[k]; return o; }
export const HYPE_POSES = { idle: P_IDLE, wind: P_WIND, punch: P_PUNCH, win: P_WIN, mix: mixPose, bob };

function arm(c, sh, el, fi, rU, rL, fist, bigFist) {
  part(c, capsule(sh[0], sh[1], rU, el[0], el[1], rU - 1), SK, { sh: 2, line: C.skinD });
  part(c, capsule(el[0], el[1], rL, fi[0], fi[1], rL - 1), SK, { sh: 2, line: C.skinD });
  // a wrap at the wrist, then a bare fist with the knuckles taped
  const dx = fi[0] - el[0], dy = fi[1] - el[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
  const wx = fi[0] - ux * (rL + 1), wy = fi[1] - uy * (rL + 1);
  part(c, capsule(wx - ux * 4, wy - uy * 4, rL - 0.5, wx, wy, rL - 0.5), WRAP, { sh: 1, line: C.wrapS });
  const fr = bigFist ? fist + 3 : fist;
  part(c, ellipse(fi[0] + ux * 2, fi[1] + uy * 2, fr, fr * 0.85, Math.atan2(uy, ux)), SK, { sh: 2, line: C.skinD });
  // knuckle tape: a band across the leading face of the fist
  part(c, capsule(fi[0] + ux * (fr - 2) - uy * (fr - 3), fi[1] + uy * (fr - 2) + ux * (fr - 3), 2.2, fi[0] + ux * (fr - 2) + uy * (fr - 3), fi[1] + uy * (fr - 2) - ux * (fr - 3), 2.2), WRAP, { sh: 1 });
  // finger creases
  for (let i = -1; i <= 1; i++) px(c, fi[0] + ux * (fr - 5) - uy * i * 3.4, fi[1] + uy * (fr - 5) + ux * i * 3.4, 1, 2, C.skinS);
}
function leg(c, hp, kn, ft, rT, rC) {
  part(c, capsule(hp[0], hp[1], rT, kn[0], kn[1], rT - 2), PANT, { sh: 2, line: C.ink2 });
  part(c, capsule(kn[0], kn[1], rT - 2, ft[0], ft[1] - 7, rC), PANT, { sh: 2, line: C.ink2 });
  // shin wraps and a bare foot
  part(c, capsule(lerp(kn[0], ft[0], 0.6), lerp(kn[1], ft[1] - 7, 0.6), rC, ft[0], ft[1] - 6, rC), WRAP, { sh: 1 });
  part(c, poly([[ft[0] - 7, ft[1]], [ft[0] - 6, ft[1] - 7], [ft[0] + 5, ft[1] - 7], [ft[0] + 14, ft[1] - 2], [ft[0] + 14, ft[1]]], 2), SK, { sh: 1, line: C.skinD });
}
function hypeHead(c, p, t) {
  const [hx, hy] = p.head;
  // hair: wild spikes swept back, drawn first so the face sits on it
  const spikes = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const a = lerp(-2.7, 0.05, i / N); // from back-low to front-top
    const r = 15 + ((i * 7) % 5) * 1.6 + (i % 2 ? 0 : 7);
    const wob = Math.sin(t * 9 + i * 1.7) * 1.2;
    spikes.push([hx - 4 + Math.cos(a) * r - (i % 2 ? 0 : 5), hy - 4 + Math.sin(a) * r + wob]);
    spikes.push([hx - 3 + Math.cos(a + 0.17) * 9, hy - 3 + Math.sin(a + 0.17) * 9]);
  }
  part(c, poly([[hx - 12, hy + 4], ...spikes, [hx + 8, hy - 8], [hx + 2, hy + 2]]), [C.hairL, C.hair, C.hair], { sh: 0, rim: 1 });
  // jaw and skull: a heavy jaw for the giant
  part(c, blob([[hx - 9, hy - 9], [hx + 4, hy - 12], [hx + 12, hy - 6], [hx + 13, hy + 3], [hx + 10, hy + 11], [hx + 2, hy + 14], [hx - 8, hy + 10], [hx - 11, hy + 1]]), SK, { sh: 2, line: C.skinD });
  // ear
  part(c, ellipse(hx - 6, hy + 1, 2.6, 3.4), SK, { sh: 1, line: C.skinD });
  // headband with tails flying behind
  part(c, poly([[hx - 11, hy - 6], [hx + 12, hy - 10], [hx + 13, hy - 6], [hx - 11, hy - 1]]), [C.redL, C.red, C.redS], { sh: 1 });
  const fl = (k) => Math.sin(t * 14 + k) * 3;
  part(c, poly([[hx - 10, hy - 5], [hx - 24, hy - 9 + fl(0)], [hx - 34, hy - 4 + fl(1)], [hx - 23, hy - 3 + fl(0.5)], [hx - 10, hy - 2]]), [C.redL, C.red, C.redS], { sh: 1 });
  part(c, poly([[hx - 10, hy - 3], [hx - 20, hy + 2 + fl(2)], [hx - 28, hy + 8 + fl(3)], [hx - 18, hy + 4 + fl(2.5)], [hx - 10, hy - 1]]), [C.redL, C.red, C.redS], { sh: 1 });
  // face, profile three-quarter right
  const f = p.face;
  const ex = Math.round(hx + 6), ey = Math.round(hy - 2);
  // brow
  px(c, ex - 2, ey - 3, 6, 1, C.hair); px(c, ex + 3, ey - 2, 2, 1, C.hair);
  if (f === 'mad' || f === 'yell') px(c, ex - 2, ey - 4, 3, 1, C.hair);
  // the eye: wide, tiny pupil
  px(c, ex - 1, ey - 1, 5, 3, C.eye); px(c, ex + 2, ey, 1, 1, C.ink);
  if (f === 'mad') { px(c, ex - 1, ey - 1, 5, 1, C.skinS); }
  // nose
  px(c, hx + 12, hy + 1, 2, 2, C.skinS);
  // mouth
  if (f === 'grin') { px(c, hx + 3, hy + 6, 9, 3, C.ink); px(c, hx + 4, hy + 6, 7, 1, C.white); px(c, hx + 4, hy + 8, 6, 1, C.white); }
  else if (f === 'mad') { px(c, hx + 3, hy + 6, 9, 2, C.ink); px(c, hx + 4, hy + 6, 7, 1, C.white); }
  else if (f === 'yell') { px(c, hx + 2, hy + 5, 10, 6, C.ink); px(c, hx + 3, hy + 5, 8, 1, C.white); px(c, hx + 4, hy + 9, 5, 1, C.redS); }
  else if (f === 'laugh') { px(c, hx + 2, hy + 4, 11, 7, C.ink); px(c, hx + 3, hy + 4, 9, 1, C.white); px(c, hx + 4, hy + 8, 6, 2, C.redS); }
  // a scar across the cheek
  px(c, hx + 1, hy + 2, 1, 4, C.skinD);
}
function hypeTorso(c, p) {
  const [cx, cy] = p.chest, [hx, hy] = p.hip;
  const lean = (cx - hx) * 0.5;
  // trapezius and a massive chest, tapering to the waist
  const body = blob([
    [cx - 26, cy - 14], [cx - 8, cy - 24], [cx + 14, cy - 26], [cx + 32, cy - 16], [cx + 30, cy + 4],
    [hx + 20 + lean * 0.2, hy - 10], [hx + 16, hy + 2], [hx - 16, hy + 2], [hx - 20 + lean * 0.2, hy - 12], [cx - 26, cy + 4],
  ]);
  part(c, body, SK, { sh: 3, rim: 1, line: C.skinD });
  // pecs and abs: shade lines
  c.fillStyle = C.skinS;
  for (let i = 0; i < 16; i++) px(c, cx - 10 + i * 1.6, cy + 2 + Math.sin(i / 15 * Math.PI) * 3, 1, 1, C.skinS);
  px(c, cx + 3, cy - 12, 1, 14, C.skinS);
  for (let r = 0; r < 3; r++) { const yy = lerp(cy + 10, hy - 6, r / 2.4); const xx = lerp(cx, hx, (yy - cy) / (hy - cy)) + 2; px(c, xx - 6, yy, 4, 1, C.skinS); px(c, xx + 3, yy, 4, 1, C.skinS); }
  // the vermilion sash
  part(c, poly([[hx - 18, hy - 6], [hx + 19, hy - 7], [hx + 20, hy + 2], [hx - 19, hy + 3]], 1), [C.redL, C.red, C.redS], { sh: 1 });
  part(c, poly([[hx + 8, hy - 2], [hx + 18, hy + 14], [hx + 12, hy + 16], [hx + 4, hy + 1]]), [C.redL, C.red, C.redS], { sh: 1 });
}
// The whole fighter. o.t drives the hair and headband flutter.
export function drawHype(c, pose, t) {
  const p = pose;
  // back arm, back leg, hips, front leg, torso, head, front arm
  arm(c, p.shB, p.elB, p.fiB, 9, 9, 9, p.bigFist && false);
  leg(c, p.hpB, p.knB, p.ftB, 12, 6);
  part(c, poly([[p.hip[0] - 20, p.hip[1] - 4], [p.hip[0] + 20, p.hip[1] - 4], [p.hip[0] + 22, p.hip[1] + 16], [p.hip[0] - 22, p.hip[1] + 16]], 3), PANT, { sh: 2, line: C.ink2 });
  leg(c, p.hpF, p.knF, p.ftF, 13, 6);
  hypeTorso(c, p);
  // a neck like a tree trunk
  part(c, capsule(p.chest[0] + 4, p.chest[1] - 18, 11, p.head[0] - 2, p.head[1] + 8, 8), SK, { sh: 2, line: C.skinD });
  c.save(); c.translate(p.head[0], p.head[1] + 6); c.scale(1.3, 1.3); c.translate(-p.head[0], -p.head[1] - 6);
  hypeHead(c, p, t);
  c.restore();
  if (p.bigFist) arm(c, p.shB, p.elB, p.fiB, 10, 10, 10, true);
  arm(c, p.shF, p.elF, p.fiF, 10, 10, 10, false);
}
export function hypeSprite(key, pose, t, o = {}) {
  return sprite(key, 260, 220, 110, 205, HYPE_PAL, (c) => drawHype(c, pose, t), o);
}

// --------------------------------------------------------------------------------------------- USDC
// Facing left, origin at the feet, ~72 px tall.
const SUIT = [C.suitL, C.suit, C.suitS];
const USK = [C.uskinL, C.uskin, C.uskinS];
export const U_IDLE = {
  head: [-1, -63], neck: [0, -55], chest: [0, -44], hip: [0, -30],
  shF: [-5, -50], elF: [-8, -38], haF: [-8, -27],
  shB: [5, -50], elB: [7, -38], haB: [7, -27],
  hpF: [-3, -30], knF: [-4, -15], ftF: [-5, 0],
  hpB: [3, -30], knB: [4, -15], ftB: [5, 0],
  face: 'meh', phone: false,
};
export const U_APPROVE = {
  ...U_IDLE,
  elF: [-14, -42], haF: [-15, -52], face: 'ahem', phone: true,
};
export const U_HIT = {
  head: [8, -56], neck: [6, -50], chest: [2, -42], hip: [-6, -34],
  shF: [0, -47], elF: [10, -58], haF: [16, -66],
  shB: [4, -46], elB: [14, -40], haB: [22, -44],
  hpF: [-6, -34], knF: [-16, -26], ftF: [-14, -12],
  hpB: [-4, -32], knB: [-2, -20], ftB: [-16, -16],
  face: 'ouch', phone: false,
};
export const USDC_POSES = { idle: U_IDLE, approve: U_APPROVE, hit: U_HIT };

function usdcHead(c, p) {
  const [hx, hy] = p.head;
  part(c, blob([[hx - 6, hy - 7], [hx + 4, hy - 8], [hx + 7, hy - 2], [hx + 6, hy + 5], [hx + 1, hy + 9], [hx - 5, hy + 8], [hx - 8, hy + 3], [hx - 8, hy - 3]]), USK, { sh: 1, lx: 1, ly: -1, line: C.uskinS });
  // neat hair, parted, a little thin on top
  part(c, poly([[hx - 8, hy - 2], [hx - 8, hy - 7], [hx - 3, hy - 10], [hx + 5, hy - 9], [hx + 8, hy - 4], [hx + 7, hy], [hx + 4, hy - 5], [hx - 3, hy - 6], [hx - 6, hy - 1]]), [C.uhairL, C.uhair, C.uhair], { sh: 0 });
  px(c, hx - 2, hy - 9, 1, 3, C.uskin); // the parting
  // ear (facing left, ear on the right)
  part(c, ellipse(hx + 5, hy + 1, 1.6, 2.4), USK, { sh: 0, line: C.uskinS });
  // glasses
  const gx = Math.round(hx - 7), gy = Math.round(hy - 1);
  px(c, gx, gy, 5, 4, C.glass); px(c, gx + 1, gy + 1, 3, 2, C.lens); px(c, gx + 5, gy + 1, 5, 1, C.glass);
  const f = p.face;
  if (f === 'ouch') { px(c, gx + 1, gy + 1, 3, 2, C.white); px(c, gx + 2, gy + 1, 1, 2, C.ink); }
  else px(c, gx + 1, gy + 2, 1, 1, C.ink);
  // mouth
  if (f === 'ouch') { px(c, hx - 6, hy + 4, 3, 3, C.ink); }
  else if (f === 'ahem') { px(c, hx - 6, hy + 5, 3, 1, C.ink); }
  else { px(c, hx - 6, hy + 5, 3, 1, C.uskinS); }
}
function usdcBody(c, p) {
  const SH = [C.shirt, C.shirt, C.shirtS];
  // back arm with the briefcase
  part(c, capsule(p.shB[0], p.shB[1], 3, p.elB[0], p.elB[1], 3), SUIT, { sh: 1, line: C.suitS });
  part(c, capsule(p.elB[0], p.elB[1], 3, p.haB[0], p.haB[1], 2.5), SUIT, { sh: 1, line: C.suitS });
  if (!p.noCase) {
    const bx = p.haB[0] - 2, by = p.haB[1] + 1;
    px(c, bx - 1, by - 2, 6, 2, C.caseS);
    part(c, poly([[bx - 8, by], [bx + 11, by], [bx + 11, by + 13], [bx - 8, by + 13]], 1), [C.caseL, C.case, C.caseS], { sh: 1 });
    px(c, bx - 7, by + 5, 18, 1, C.caseS); px(c, bx + 1, by + 4, 3, 3, C.metal);
  }
  // legs: grey trousers, black shoes
  for (const [hp, kn, ft] of [[p.hpB, p.knB, p.ftB], [p.hpF, p.knF, p.ftF]]) {
    part(c, capsule(hp[0], hp[1], 3.5, kn[0], kn[1], 3), SUIT, { sh: 1, line: C.suitS });
    part(c, capsule(kn[0], kn[1], 3, ft[0], ft[1] - 3, 2.6), SUIT, { sh: 1, line: C.suitS });
    part(c, poly([[ft[0] - 6, ft[1]], [ft[0] - 5, ft[1] - 3], [ft[0] + 3, ft[1] - 4], [ft[0] + 3, ft[1]]], 1), [C.suitS, C.shoe, C.shoe], { sh: 0 });
  }
  // jacket
  const [cx, cy] = p.chest, [hx, hy] = p.hip;
  part(c, poly([[cx - 7, cy - 8], [cx + 7, cy - 8], [hx + 7, hy + 3], [hx - 7, hy + 3]], 2), SUIT, { sh: 2, line: C.suitS });
  // shirt V and tie
  part(c, poly([[cx - 3, cy - 8], [cx + 3, cy - 8], [cx, cy + 4]]), SH, { sh: 0 });
  part(c, poly([[cx - 1, cy - 7], [cx + 1, cy - 7], [cx + 1.5, cy + 6], [cx, cy + 8], [cx - 1.5, cy + 6]]), [C.tie, C.tie, C.tieS], { sh: 1 });
  px(c, cx - 1, cy - 8, 2, 2, C.tieS);
  // a coin pin on the lapel
  px(c, cx - 6, cy - 4, 2, 2, C.tie);
  // neck
  part(c, capsule(p.neck[0], p.neck[1] - 2, 2.5, cx, cy - 8, 2.5), USK, { sh: 0 });
}
function usdcFrontArm(c, p) {
  part(c, capsule(p.shF[0], p.shF[1], 3, p.elF[0], p.elF[1], 3), SUIT, { sh: 1, line: C.suitS });
  part(c, capsule(p.elF[0], p.elF[1], 3, p.haF[0], p.haF[1], 2.5), SUIT, { sh: 1, line: C.suitS });
  part(c, ellipse(p.haF[0], p.haF[1], 2.2, 2.2), USK, { sh: 0 });
  if (p.phone) {
    // a phone held up, screen toward the giant
    part(c, poly([[p.haF[0] - 4, p.haF[1] - 9], [p.haF[0] + 1, p.haF[1] - 9], [p.haF[0] + 1, p.haF[1] + 1], [p.haF[0] - 4, p.haF[1] + 1]], 1), [C.lens, C.lens, C.glass], { sh: 1 });
  }
}
export function drawUsdc(c, pose) {
  usdcBody(c, pose); usdcHead(c, pose); usdcFrontArm(c, pose);
}
export function usdcSprite(key, pose, o = {}) {
  return sprite(key, 120, 110, 60, 95, USDC_PAL, (c) => drawUsdc(c, pose), o);
}

// --------------------------------------------------------------------------------------------- busts
// Character-select portraits, ~120 px, drawn on their own (not scaled sprites) so the faces carry.
export function hypeBust(t, o = {}) {
  return sprite('hypeBust', 150, 140, 75, 140, HYPE_PAL, (c) => {
    const s = 1;
    // shoulders that do not fit the frame
    // traps rising to the neck, deltoids like boulders, a slab of chest
    part(c, blob([[-74, 0], [-74, -30], [-40, -50], [-18, -66], [18, -66], [40, -50], [74, -30], [74, 0]]), SK, { sh: 4, rim: 2, line: C.skinD });
    part(c, ellipse(-60, -26, 18, 24, -0.3), SK, { sh: 4, rim: 2, line: C.skinD });
    part(c, ellipse(60, -26, 18, 24, 0.3), SK, { sh: 4, rim: 2, line: C.skinD });
    part(c, blob([[-40, -44], [-4, -48], [-2, -16], [-20, -10], [-42, -18]]), SK, { sh: 3, rim: 1, line: C.skinS });
    part(c, blob([[40, -44], [4, -48], [2, -16], [20, -10], [42, -18]]), SK, { sh: 3, rim: 1, line: C.skinS });
    part(c, poly([[-22, -58], [22, -58], [18, -76], [-18, -76]], 4), SK, { sh: 3, line: C.skinD });
    // head: big square jaw
    const hx = 0, hy = -100;
    // hair spikes behind
    const spikes = [];
    for (let i = 0; i <= 12; i++) {
      const a = lerp(-3.4, 0.25, i / 12), r = (i % 2 ? 22 : 40) + Math.sin(i * 2.3) * 4;
      spikes.push([hx + Math.cos(a) * r, hy - 12 + Math.sin(a) * r * 0.9 + (i % 2 ? 0 : Math.sin(t * 8 + i) * 1.5)]);
    }
    part(c, poly(spikes), [C.hairL, C.hair, C.hair], { sh: 0, rim: 2 });
    part(c, blob([[-20, -128], [0, -133], [20, -128], [26, -108], [25, -88], [18, -72], [0, -66], [-18, -72], [-25, -88], [-26, -108]]), SK, { sh: 4, rim: 2, line: C.skinD });
    // ears
    part(c, ellipse(-27, -100, 4, 7), SK, { sh: 2, line: C.skinD }); part(c, ellipse(27, -100, 4, 7), SK, { sh: 2, line: C.skinD });
    // headband and knot tails
    part(c, poly([[-27, -118], [27, -118], [27, -109], [-27, -108]], 1), [C.redL, C.red, C.redS], { sh: 2 });
    const fl = (k) => Math.sin(t * 12 + k) * 3;
    part(c, poly([[24, -117], [44, -126 + fl(0)], [60, -118 + fl(1)], [44, -114 + fl(0.6)], [26, -110]]), [C.redL, C.red, C.redS], { sh: 1 });
    part(c, poly([[24, -112], [40, -104 + fl(2)], [52, -92 + fl(3)], [36, -100 + fl(2.5)], [25, -108]]), [C.redL, C.red, C.redS], { sh: 1 });
    // front hair over the band
    part(c, poly([[-22, -118], [-14, -134], [-8, -121], [0, -140], [6, -122], [14, -136], [16, -120], [24, -128], [22, -116]]), [C.hairL, C.hair, C.hair], { sh: 0 });
    // brows: angry, uneven
    px(c, -18, -105, 12, 3, C.hair); px(c, -8, -103, 3, 2, C.hair);
    px(c, 6, -103, 3, 2, C.hair); px(c, 8, -106, 12, 3, C.hair);
    // eyes: wide, unhinged, mismatched pupils
    px(c, -17, -101, 10, 6, C.eye); px(c, 7, -102, 10, 7, C.eye);
    px(c, -12, -99, 2, 2, C.ink); px(c, 10, -99, 2, 2, C.ink);
    px(c, -17, -95, 10, 1, C.skinS); px(c, 7, -95, 10, 1, C.skinS);
    // nose
    px(c, -2, -96, 4, 1, C.skinS); px(c, -3, -90, 7, 3, C.skinS); px(c, -2, -91, 5, 1, C.skin);
    // the grin: far too many teeth
    px(c, -15, -84, 31, 9, C.ink);
    px(c, -14, -84, 29, 3, C.white); px(c, -12, -78, 25, 2, C.white);
    for (let i = -12; i < 16; i += 4) px(c, i, -84, 1, 3, C.wrapS);
    px(c, -16, -85, 2, 2, C.skinS); px(c, 15, -85, 2, 2, C.skinS);
    // scar
    px(c, 14, -94, 1, 8, C.skinD); px(c, 13, -92, 3, 1, C.skinD); px(c, 13, -89, 3, 1, C.skinD);
    // a vein on the temple
    px(c, -22, -116, 1, 3, C.skinD); px(c, -21, -114, 2, 1, C.skinD);
  }, o);
}
export function usdcBust(o = {}) {
  return sprite('usdcBust', 150, 140, 75, 140, USDC_PAL, (c) => {
    // narrow shoulders in a grey suit
    part(c, blob([[-50, 0], [-46, -30], [-30, -44], [0, -48], [30, -44], [46, -30], [50, 0]]), SUIT, { sh: 3, rim: 1, line: C.suitS });
    // shirt V, tie, lapels
    part(c, poly([[-12, -46], [12, -46], [0, -8]]), [C.shirt, C.shirt, C.shirtS], { sh: 1 });
    part(c, poly([[-4, -44], [4, -44], [6, -4], [0, 4], [-6, -4]]), [C.tie, C.tie, C.tieS], { sh: 2 });
    part(c, poly([[-4, -46], [4, -46], [3, -40], [-3, -40]]), [C.tieS, C.tieS, C.tieS], { sh: 0 });
    part(c, poly([[-13, -46], [-24, -40], [-12, -16], [-2, -4]]), SUIT, { sh: 1, line: C.suitS });
    part(c, poly([[13, -46], [24, -40], [12, -16], [2, -4]]), SUIT, { sh: 1, line: C.suitS });
    // pen in the pocket, lanyard badge
    px(c, 26, -34, 2, 8, C.tie); px(c, 22, -28, 10, 1, C.suitS);
    // neck
    part(c, poly([[-9, -48], [9, -48], [8, -60], [-8, -60]], 2), USK, { sh: 2, line: C.uskinS });
    // head: soft, long face
    part(c, blob([[-17, -108], [0, -114], [17, -108], [20, -90], [18, -70], [8, -58], [-8, -58], [-18, -70], [-20, -90]]), USK, { sh: 3, rim: 1, line: C.uskinS });
    part(c, ellipse(-21, -88, 3, 6), USK, { sh: 1, line: C.uskinS }); part(c, ellipse(21, -88, 3, 6), USK, { sh: 1, line: C.uskinS });
    // hair: a careful side parting
    part(c, poly([[-21, -88], [-21, -104], [-12, -116], [6, -118], [20, -110], [22, -94], [18, -100], [8, -106], [-6, -106], [-12, -100], [-17, -92]]), [C.uhairL, C.uhair, C.uhair], { sh: 0, rim: 1 });
    px(c, -9, -116, 2, 10, C.uskin);
    // glasses, rectangular
    px(c, -18, -96, 15, 10, C.glass); px(c, 3, -96, 15, 10, C.glass); px(c, -3, -93, 6, 2, C.glass);
    px(c, -16, -94, 11, 6, C.lens); px(c, 5, -94, 11, 6, C.lens);
    px(c, -15, -93, 3, 1, C.white); px(c, 6, -93, 3, 1, C.white);
    // tired eyes
    px(c, -12, -91, 3, 2, C.ink); px(c, 9, -91, 3, 2, C.ink);
    px(c, -15, -94, 9, 1, C.uskinS); px(c, 6, -94, 9, 1, C.uskinS);
    // brows: worried
    px(c, -16, -100, 10, 2, C.uhair); px(c, 6, -100, 10, 2, C.uhair); px(c, -7, -101, 2, 1, C.uhair); px(c, 6, -101, 2, 1, C.uhair);
    // nose, thin mouth
    px(c, -1, -84, 3, 6, C.uskinS); px(c, -6, -71, 12, 2, C.uskinS); px(c, -5, -71, 10, 1, C.ink);
    // a sweat drop
    px(c, 21, -104, 3, 5, C.lens); px(c, 22, -106, 1, 2, C.lens);
  }, o);
}
