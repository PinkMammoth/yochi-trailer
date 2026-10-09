// Canonical full-body players as cut-out puppets: the painted parts of asset-pack/characters/<who>-rig
// (prepared by tools/rig_prep.py) hung on the film's own pose skeleton, so every pose, blend, jump and
// fall the procedural body does, the painted one does too. The parts are composited as one figure
// through the same pipeline as the canonical busts (elements/canon.js: scene key, rim, black level, glow,
// fog, blur), and the hood's visor carries the film's LED face and status bars.
import { clamp } from '../core/math.js';
import { POSES, fk, ik } from './body.js';
import { composite, hot, col3, workMargin } from './canon.js';
import { rgba } from '../core/math.js';

const RIGS = {};
async function loadImg(src) { const im = new Image(); im.src = src; await im.decode(); return im; }
export async function loadRig(who) {
  if (RIGS[who]) return;
  const meta = await (await fetch(`assets/rig/${who}/rig.json`)).json();
  const img = {};
  await Promise.all(Object.entries(meta.parts).map(async ([k, p]) => {
    const [plate, trim] = await Promise.all([loadImg(`assets/rig/${who}/${p.file}.png`), loadImg(`assets/rig/${who}/${p.file}-trim.png`)]);
    img[k] = { plate, trim };
  }));
  const K = meta.skel, H = meta.parts.hood;
  // the ground under straight legs, and the figure's height (the hood's top to the soles)
  const hipY = (K.hipL[1] + K.hipR[1]) / 2;
  K.hipY = hipY;
  K.ground = hipY + (K.TH + K.SHIN) * 0.996 + K.ANKLE;
  K.top = K.visor[1] - (H.visor[1] - 12) * H.k;
  K.height = K.ground - K.top;
  RIGS[who] = { meta, img };
}
export const hasRig = (who) => !!RIGS[who];

// the procedural body's figure is 6.35 of its body units tall (s * 0.86 each): a rig is drawn the same
// height, and the poses' shifts and crouches (in those units) are converted with it
const OLD_H = 6.35;
const rot = (p, c, a) => { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };
const ang = (v) => Math.atan2(v[1], v[0]);

// the hand a pose shows: a raised arm or a sharply bent elbow makes a fist, a fall opens the hand
function handFor(A, P) {
  if (P.air) return 'open';
  if (A[0] > 1.8 || Math.abs(A[1]) > 1.2) return 'fist';
  return 'relaxed';
}

/**
 * Draw a rigged player. Called like drawPlayer (x, y: the feet; s; pose; face, led, ledI, status; flip;
 * roll; key, rim; fog, fogCol; blur), plus hands: { L, R } to force a hand shape. Returns { hx, hy, hs, v }
 * like drawPlayer (the head's centre and size, and the visor frame).
 */
export function drawRig(R, who, o) {
  const { meta, img } = RIGS[who];
  const K = meta.skel, PT = meta.parts;
  const P = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.idle);
  const s = o.s;
  const px = (OLD_H * 0.86 * s) / K.height;          // virtual px per rig unit
  const q = K.height / OLD_H;                         // rig units per old body unit
  const fx = o.flip ? -1 : 1, roll = o.roll || 0;
  const S = R.S, M = workMargin(R);

  // ---- the skeleton (rig units, the neck at the origin, y down) ----------------------------------
  const crouch = P.crouch || 0, drop = crouch * 1.1 * q;
  const shift = (P.shift || 0) * q, tilt = P.tilt || 0, lean = P.lean || 0;
  const r = lean - tilt * 0.8;
  const hip0 = [0, K.hipY];
  const hipC = [shift, K.hipY + drop];
  const pel = (p) => { const t = rot(p, hip0, tilt); return [t[0] + shift, t[1] + drop]; };
  const up = (p) => { const t = rot(p, hip0, r); return [t[0] + shift, t[1] + drop]; };
  const arms = { L: P.la, R: P.ra }, legs = { L: P.ll, R: P.rl };
  const J = {};
  for (const side of ['L', 'R']) {
    const sg = side === 'L' ? -1 : 1;
    const sh = side === 'L' ? K.shL : K.shR;
    const A = arms[side];
    J['arm' + side] = fk(sh[0], sh[1], A[0], A[1], K.UA, K.FA, sg).map(up);
    const Lg = legs[side];
    const hp = pel(side === 'L' ? K.hipL : K.hipR);
    if (P.air) J['leg' + side] = fk(hp[0], hp[1], Lg[0], Lg[1], K.TH, K.SHIN, sg);
    else {
      const spread = Math.sin(Lg[0]) * (K.TH + K.SHIN) * 0.55 + crouch * 0.5 * q;
      const hx = Math.abs((side === 'L' ? K.hipL : K.hipR)[0]);
      J['leg' + side] = ik(hp[0], hp[1], sg * (hx + spread), K.ground - K.ANKLE, K.TH, K.SHIN, sg);
    }
  }
  const neck = up([0, 0]), visor = up(K.visor), waistTop = pel(K.waistTop);

  // ---- the parts, back to front --------------------------------------------------------------
  const fig = (c) => { c.setTransform(S, 0, 0, S, M, M); c.translate(o.x, o.y); c.rotate(roll); c.scale(px * fx, px); c.translate(0, -K.ground); };
  // a limb part from joint a to joint b; mirror: the art is for the other side
  const limb = (c, key, layer, a, b, mirror) => {
    const p = PT[key], im = img[key][layer];
    const v = [(p.p1[0] - p.p0[0]) * (mirror ? -1 : 1), p.p1[1] - p.p0[1]];
    c.save(); c.translate(a[0], a[1]); c.rotate(ang([b[0] - a[0], b[1] - a[1]]) - ang(v)); c.scale(p.k * (mirror ? -1 : 1), p.k);
    c.translate(-p.p0[0], -p.p0[1]); c.drawImage(im, 0, 0); c.restore();
  };
  // a rigid part placed by an anchor and turned by a
  const rigid = (c, key, layer, anchorImg, at, a) => {
    const p = PT[key], im = img[key][layer];
    c.save(); c.translate(at[0], at[1]); c.rotate(a); c.scale(p.k, p.k); c.translate(-anchorImg[0], -anchorImg[1]); c.drawImage(im, 0, 0); c.restore();
  };
  const hands = { L: o.hands?.L || handFor(arms.L, P), R: o.hands?.R || handFor(arms.R, P) };
  const T = PT.torso;
  const paint = (c, layer) => {
    fig(c);
    // legs: the lower leg (its art is the screen-right one) under the thigh (screen-left art)
    for (const side of ['L', 'R']) { const Lg = J['leg' + side]; limb(c, 'shin', layer, Lg[1], Lg[2], side === 'L'); }
    for (const side of ['L', 'R']) { const Lg = J['leg' + side]; limb(c, 'thigh', layer, Lg[0], Lg[1], side === 'R'); }
    rigid(c, 'waist', layer, PT.waist.top, waistTop, tilt);
    // upper arms come out from under the cap sleeves
    for (const side of ['L', 'R']) { const A = J['arm' + side]; limb(c, 'ua' + side, layer, A[0], A[1], false); }
    rigid(c, 'torso', layer, PT.torso.neck, neck, r);
    rigid(c, 'mark', layer, PT.mark.c, up([(T.mark[0] - T.neck[0]) * T.k, (T.mark[1] - T.neck[1]) * T.k]), r);
    rigid(c, 'hood', layer, PT.hood.visor, visor, r);
    // the glove tucks into the sleeve's cuff
    for (const side of ['L', 'R']) {
      const A = J['arm' + side], d = [A[2][0] - A[1][0], A[2][1] - A[1][1]], l = Math.hypot(d[0], d[1]) || 1;
      limb(c, 'hand_' + hands[side], layer, A[2], [A[2][0] + d[0] / l * 100, A[2][1] + d[1] / l * 100], side === 'R');
    }
    for (const side of ['L', 'R']) { const A = J['arm' + side]; limb(c, 'fa' + side, layer, A[1], A[2], false); }
  };
  // rig -> screen (virtual px)
  const scr = (p) => { const x = fx * px * p[0], y = px * (p[1] - K.ground), cr = Math.cos(roll), sr = Math.sin(roll); return [o.x + x * cr - y * sr, o.y + x * sr + y * cr]; };
  const [vx, vy] = scr(visor);
  const hw = PT.hood.hw * PT.hood.k * px;
  const fa = roll + fx * r;
  const st = col3(o.status, [24, 224, 255]);
  // (the parts are rendered a little lighter than the canonical busts' near-black cloth)
  const v = composite(R, { ...o, exposure: o.exposure ?? 0.86, keyR: o.keyR ?? 16, rimScale: o.rimScale ?? hw * 2.2 }, {
    vx, vy, hw, ang: fa,
    plate: (c) => paint(c, 'plate'),
    trim: (c) => paint(c, 'trim'),
    status: (cb, cg, sI, glowK) => {
      for (const [c, col, al, grow] of [[cb, hot(st, 0.55), 0.95 * sI, 0], [cg, st, 0.9 * sI * glowK, 0.04]]) {
        c.save(); c.setTransform(S, 0, 0, S, M, M); c.translate(vx, vy); c.rotate(fa); c.scale(hw, hw);
        c.globalAlpha = clamp(al); c.fillStyle = rgba(col);
        for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(sx * 0.95 - 0.035 - grow, -0.2 - grow, 0.07 + 2 * grow, 0.4 + 2 * grow, 0.035); c.fill(); }
        c.restore();
      }
    },
  });
  const hs = (K.visor[1] - K.top) * px / 1.25;
  return { hx: vx, hy: vy, hs, v };
}
