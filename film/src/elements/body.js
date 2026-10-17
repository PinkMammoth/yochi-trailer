// Full-body players in streetwear: a hooded top with dropped shoulders and full sleeves, dark
// trousers, chunky sneakers; stylised proportions (the hood is ~27% of the height). Unit space:
// the head centred at (0,0). Standing feet at y = FEET. The garment is cloth, not a shell: a boxy
// torso that hangs straight to a ribbed hem, sleeves with a little fullness and ribbed cuffs, a
// kangaroo pocket, a small Yochi mark on the chest. Poses carry a weight shift, so standing reads
// as confidence rather than attention.
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';
import { drawHelmet, RGB, mirrorSub, clothOf } from './helmet.js';
import { logoPath } from './logo.js';
import { drawCanon } from './canon.js';
import { hasRig, drawRig } from './rig.js';

const TAU = Math.PI * 2;
const FEET = 5.6;
const SH_Y = 1.52, SH_X = 0.97;     // shoulder joints
const HIP_Y = 2.98, HIP_X = 0.42;   // hip joints
const UA = 1.1, FA = 1.0;           // upper arm, forearm
const TH = 1.3, SHIN = 1.16, BOOT = 0.16;
const HEAD_K = 0.86;                // body unit relative to the caller's s
const HELM = 0.78;                  // head size relative to the body unit

// Angles are measured from straight down; positive = outward (away from the body) for both sides.
// shift: pelvis offset toward the weight-bearing leg (+ = the right); tilt: pelvis roll (the
// shoulders answer it the other way).
export const POSES = {
  idle: { la: [0.2, -0.3], ra: [0.12, -0.42], ll: [0.1, 0], rl: [0.03, 0], lean: 0, crouch: 0, shift: 0.1, tilt: -0.05 },
  cheer: { la: [2.5, 0.32], ra: [2.5, 0.32], ll: [0.14, 0], rl: [0.14, 0], lean: 0, crouch: 0 },
  // a tight fist pump: the elbow down, the fist driven up beside the shoulder
  fist: { la: [0.24, -0.4], ra: [0.5, 2.3], ll: [0.1, 0], rl: [0.12, 0], lean: -0.03, crouch: 0.05, shift: -0.06, tilt: 0.04 },
  // one fist raised to the sky
  raise: { la: [0.2, -0.35], ra: [2.72, 0.28], ll: [0.1, 0], rl: [0.08, 0], lean: -0.03, crouch: 0, shift: -0.08, tilt: 0.05 },
  // a smug point, the other hand on the hip
  point: { la: [0.72, -2.1], ra: [1.6, -0.12], ll: [0.08, 0], rl: [0.16, 0], lean: 0.02, crouch: 0, shift: -0.08, tilt: 0.05 },
  flail: { la: [2.3, 1.1], ra: [1.9, -1.3], ll: [0.7, 0.8], rl: [0.45, -1.0], lean: 0.2, crouch: 0, air: true },
  slump: { la: [0.06, 0.08], ra: [0.06, 0.08], ll: [0.1, 0], rl: [0.1, 0], lean: 0.08, crouch: 0.22 },
  shrug: { la: [0.75, 1.35], ra: [0.75, 1.35], ll: [0.07, 0], rl: [0.07, 0], lean: 0, crouch: 0 },
  // ready: weight on one leg, knees soft, one fist clenched by the hip, the other arm loose
  // (anticipation, not a squat; the forearms come back in toward the body, never out)
  brace: { la: [0.26, -0.62], ra: [0.42, -1.3], ll: [0.13, 0], rl: [0.08, 0], lean: 0, crouch: 0.08, shift: 0.1, tilt: -0.05 },
};
// the same pose on the other foot (so neighbours don't stand as clones)
export function mirrorPose(p) {
  const A = typeof p === 'string' ? POSES[p] : p;
  return { ...A, la: A.ra, ra: A.la, ll: A.rl, rl: A.ll, lean: -(A.lean || 0), shift: -(A.shift || 0), tilt: -(A.tilt || 0) };
}
export function blendPose(a, b, t) {
  const A = typeof a === 'string' ? POSES[a] : a, B = typeof b === 'string' ? POSES[b] : b;
  const L = (x, y) => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  return { la: L(A.la, B.la), ra: L(A.ra, B.ra), ll: L(A.ll, B.ll), rl: L(A.rl, B.rl), lean: lerp(A.lean, B.lean, t), crouch: lerp(A.crouch, B.crouch, t),
    shift: lerp(A.shift || 0, B.shift || 0, t), tilt: lerp(A.tilt || 0, B.tilt || 0, t), air: t < 0.5 ? A.air : B.air };
}

// forward kinematics for a two-bone limb (angles from straight down, side = -1 left / +1 right)
export function fk(x, y, a1, a2, l1, l2, side) {
  const x1 = x + side * Math.sin(a1) * l1, y1 = y + Math.cos(a1) * l1;
  const x2 = x1 + side * Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
  return [[x, y], [x1, y1], [x2, y2]];
}
// two-bone IK from a hip to a planted ankle; knees bend outward
export function ik(hx, hy, ax, ay, l1, l2, side) {
  const dx = ax - hx, dy = ay - hy;
  let d = Math.hypot(dx, dy);
  const dmax = (l1 + l2) * 0.999;
  let tx = ax, ty = ay;
  if (d > dmax) { tx = hx + dx / d * dmax; ty = hy + dy / d * dmax; d = dmax; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = (tx - hx) / d, uy = (ty - hy) / d;
  const px = hx + ux * a, py = hy + uy * a;
  // perpendicular pointing outward (away from the centre line)
  let nx = -uy, ny = ux;
  if (nx * side < 0) { nx = -nx; ny = -ny; }
  return [[hx, hy], [px + nx * h, py + ny * h], [tx, ty]];
}
// A bone as a tapered body with a muscle swell (w0 at the root, wm at the swell, w1 at the end).
// Every bone is wound the same way, so overlapping subpaths union under nonzero filling.
function boneSub(c, x0, y0, x1, y1, w0, wm, w1, at = 0.38) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mx = x0 + dx * at, my = y0 + dy * at;
  const q = (a, m, b) => 2 * m - (a + b) / 2;   // quadratic control through m at its midpoint
  const ax = x0 + nx * w0 / 2, ay = y0 + ny * w0 / 2, bx = x1 + nx * w1 / 2, by = y1 + ny * w1 / 2;
  const cx = x1 - nx * w1 / 2, cy = y1 - ny * w1 / 2, ex = x0 - nx * w0 / 2, ey = y0 - ny * w0 / 2;
  c.moveTo(ax, ay);
  c.quadraticCurveTo(q(ax, mx + nx * wm / 2, bx), q(ay, my + ny * wm / 2, by), bx, by);
  c.lineTo(cx, cy);
  c.quadraticCurveTo(q(cx, mx - nx * wm / 2, ex), q(cy, my - ny * wm / 2, ey), ex, ey);
  c.closePath();
}
// prof: [root, swell1, joint, swell2, end] widths
function limbSub(c, pts, prof) {
  boneSub(c, pts[0][0], pts[0][1], pts[1][0], pts[1][1], prof[0], prof[1], prof[2]);
  boneSub(c, pts[1][0], pts[1][1], pts[2][0], pts[2][1], prof[2] * 0.96, prof[3], prof[4], 0.3);
  // joint disc wound the same way as the bones (anticlockwise), or nonzero filling would punch a hole in the knee
  c.moveTo(pts[1][0] + prof[2] / 2, pts[1][1]); c.arc(pts[1][0], pts[1][1], prof[2] / 2, TAU, 0, true);
}
// the edge of a limb on a given screen side (+1 right, -1 left), for rims and piping
function limbEdge(c, pts, prof, sideSign, inset = 0) {
  const W = [prof[0], prof[2], prof[4]];
  c.moveTo(pts[0][0] + sideSign * (W[0] / 2 - inset), pts[0][1]);
  for (let i = 1; i < 3; i++) c.lineTo(pts[i][0] + sideSign * (W[i] / 2 - inset), pts[i][1]);
}
// The hooded top: a collar the hood sits in, dropped shoulders, sides that hang straight into a
// ribbed hem over the hips.
function hoodieSub(c) {
  mirrorSub(c, 0.56, 0.98, [
    [0.78, 1.02, 0.98, 1.1, 1.08, 1.26],      // collar to shoulder
    [1.18, 1.4, 1.22, 1.6, 1.2, 1.86],        // the dropped shoulder, rounded
    [1.18, 2.2, 1.14, 2.6, 1.12, 2.92],       // the side hangs straight
    [1.12, 3.02, 1.09, 3.16, 1.05, 3.2],      // into the hem band
    [0.7, 3.24, 0.36, 3.25, 0, 3.25],         // the hem
  ]);
}
const mixc = (a, b2, t) => [lerp(a[0], b2[0], t), lerp(a[1], b2[1], t), lerp(a[2], b2[2], t)];
const sclc = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];

/**
 * o: { x, y (feet position, screen), s (scale: head radius px before HEAD_K), pose, cast:{type,shell,accent,stripes},
 *      face, led, yaw, pitch, key, rim, roll, flip (mirror), bodyCol (the trousers), status, ledI, fog, fogCol }
 * returns { hx, hy, hs } head centre and head radius in screen space
 */
export function drawPlayer(R, o) {
  // a canonical player with a painted rig is drawn whole from it (elements/rig.js)
  if (o.canon && o.cast?.canon && hasRig(o.cast.canon) && !o.noRig) return drawRig(R, o.cast.canon, o);
  const { b, g } = R;
  const s = o.s * HEAD_K;
  const P = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.idle);
  // with a canonical head, the body takes the canonical palette too: charcoal cloth, cyan trim
  const cast = o.canon && o.cast?.canon ? { ...o.cast, shell: [28, 28, 40], accent: RGB.cyan } : (o.cast || {});
  const fx = o.flip ? -1 : 1;
  const rim0 = { x: 0.8, y: -0.5, col: RGB.cyan, k: 1, ...(o.rim || {}) };
  const key0 = { x: -0.5, y: -0.6, col: [190, 225, 255], k: 0.6, ...(o.key || {}) };
  // lights live in the world, so un-mirror them for the body
  const rim = { ...rim0, x: rim0.x * fx }, key = { ...key0, x: key0.x * fx };
  const acc = typeof cast.accent === 'string' ? hexToRgb(cast.accent) : (cast.accent || RGB.cyan);
  const plain = acc[0] === RGB.faint[0] && acc[1] === RGB.faint[1];
  // the top is the hood's cloth; the trousers are darker still
  const cloth = clothOf(cast.shell || [40, 38, 54]);
  const light = cloth[0] > 150;
  const tone = (c) => ({ base: c, dark: light ? mixc(sclc(c, 0.72), [74, 78, 106], 0.3) : sclc(c, 0.52), lift: mixc(sclc(c, light ? 1.04 : 1.24), key.col, 0.05) });
  const top = tone(cloth);
  const trou = tone(o.bodyCol || [25, 23, 34]);
  const crouch = P.crouch || 0;
  const drop = crouch * 1.1;
  const FD = FEET - drop;
  const lean = P.lean || 0, shift = P.shift || 0, tilt = P.tilt || 0;
  const litSide = key.x <= 0 ? -1 : 1;           // the side the key light comes from
  const rimSide = rim.x >= 0 ? 1 : -1;

  b.save(); g.save();
  for (const c of [b, g]) {
    c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s * fx, s);
    c.translate(0, -FD);
  }
  b.lineJoin = 'miter'; g.lineJoin = 'miter';

  // ---- legs: dark trousers with a little fullness, over chunky sneakers --------------------
  const LP = [0.74, 0.7, 0.54, 0.54, 0.46];
  const legs = [-1, 1].map((side) => {
    const L = side < 0 ? P.ll : P.rl;
    const hx = shift + side * HIP_X * Math.cos(tilt), hy = HIP_Y + side * HIP_X * Math.sin(tilt);
    if (P.air) return fk(hx, hy, L[0], L[1], TH, SHIN, side);
    const spread = Math.sin(L[0]) * (TH + SHIN) * 0.55 + crouch * 0.5;
    return ik(hx, hy, side * (HIP_X + spread), FD - BOOT, TH, SHIN, side);
  });
  for (const [i, L] of legs.entries()) {
    const side = i ? 1 : -1;
    b.fillStyle = rgba(trou.base); b.beginPath(); limbSub(b, L, LP); b.fill();
    // shadow half, away from the key light
    b.save(); b.beginPath(); limbSub(b, L, LP); b.clip();
    // (dark everywhere, then the lit side on top: an evenodd cut-out would flicker where the joint disc overlaps)
    b.fillStyle = rgba(trou.dark); b.fillRect(-5, -5, 10, 20);
    b.fillStyle = rgba(trou.base); b.beginPath(); limbSub(b, L.map(([x, y]) => [x + litSide * 0.15, y]), LP); b.fill();
    b.restore();
    if (side === rimSide) { b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = rgba(rim.col, 0.36 * rim.k); b.lineWidth = 0.035;
      b.beginPath(); limbEdge(b, L, LP, rimSide, 0.02); b.stroke(); b.restore(); }
    // knee: a soft break in the cloth where the shin meets the thigh
    const [kx, ky] = L[1], [ax, ay] = L[2];
    const sdx = ax - kx, sdy = ay - ky, sl = Math.hypot(sdx, sdy) || 1;
    const tdx = kx - L[0][0], tdy = ky - L[0][1], tl = Math.hypot(tdx, tdy) || 1;
    const kn = [-(tdy / tl + sdy / sl), tdx / tl + sdx / sl], knl = Math.hypot(kn[0], kn[1]) || 1;
    b.strokeStyle = rgba(trou.dark, 0.9); b.lineWidth = 0.03; b.lineCap = 'round';
    b.beginPath(); b.moveTo(kx - kn[0] / knl * 0.14, ky - kn[1] / knl * 0.14 + 0.06); b.quadraticCurveTo(kx, ky + 0.13, kx + kn[0] / knl * 0.14, ky + kn[1] / knl * 0.14 + 0.06); b.stroke();
    b.lineCap = 'butt';
    // sneaker: a chunky dark upper over a pale sole, the trouser hem breaking over it
    const bu = [sdx / sl, sdy / sl];
    b.save(); b.translate(ax, ay); b.rotate(Math.atan2(bu[1], bu[0]) - Math.PI / 2);
    const bh = P.air ? 0.2 : BOOT + 0.02;
    b.fillStyle = rgba(sclc(trou.dark, 0.9));
    b.beginPath(); b.moveTo(-0.2, -0.12); b.lineTo(0.2, -0.12); b.lineTo(0.27, bh - 0.06); b.quadraticCurveTo(0, bh + 0.0, -0.27, bh - 0.06); b.closePath(); b.fill();
    b.fillStyle = rgba(light ? [210, 208, 222] : [150, 148, 166]); b.beginPath(); b.moveTo(-0.3, bh - 0.07); b.lineTo(0.3, bh - 0.07); b.lineTo(0.29, bh + 0.04); b.lineTo(-0.29, bh + 0.04); b.closePath(); b.fill();
    if (!plain) { b.fillStyle = rgba(acc, 0.85); b.fillRect(-0.29, bh - 0.03, 0.58, 0.025); }
    b.fillStyle = rgba(trou.base); b.beginPath(); b.moveTo(-0.26, -0.2); b.lineTo(0.26, -0.2); b.lineTo(0.25, -0.06); b.quadraticCurveTo(0, 0.0, -0.25, -0.06); b.closePath(); b.fill();
    b.restore();
    g.fillStyle = '#000'; g.beginPath(); limbSub(g, L, LP); g.moveTo(ax + 0.32, ay + 0.05); g.arc(ax, ay + 0.05, 0.32, TAU, 0, true); g.fill();
  }

  // ---- the top (shifted with the pelvis; leans around the hips, shoulders answer the tilt) -----
  const rot = lean - tilt * 0.8;
  for (const c of [b, g]) { c.translate(shift, 0); c.translate(0, HIP_Y); c.rotate(rot); c.translate(0, -HIP_Y); }
  b.fillStyle = rgba(top.base); b.beginPath(); hoodieSub(b); b.fill();
  b.save(); b.beginPath(); hoodieSub(b); b.clip();
  // the chest faces the light, the stomach turns away from it
  const tg = b.createLinearGradient(0, 1.1, 0, 3.2);
  tg.addColorStop(0, rgba(top.lift)); tg.addColorStop(0.5, rgba(top.base)); tg.addColorStop(1, rgba(sclc(top.base, 0.84)));
  b.fillStyle = tg; b.fillRect(-2, 0.8, 4, 2.6);
  // cel shade
  b.fillStyle = rgba(top.dark, 0.9);
  b.beginPath(); b.rect(-3, 0, 6, 5); b.ellipse(key.x * 0.62, 2.0, 0.95, 1.6, 0, 0, TAU); b.fill('evenodd');
  // kangaroo pocket: a panel with slanted openings, stitched to the hem
  b.fillStyle = rgba(sclc(top.base, 0.9), 0.7);
  b.beginPath(); b.moveTo(-0.66, 2.36); b.lineTo(0.66, 2.36); b.lineTo(0.84, 2.96); b.lineTo(-0.84, 2.96); b.closePath(); b.fill();
  b.strokeStyle = rgba(top.dark, 0.95); b.lineWidth = 0.028; b.lineCap = 'round';
  b.beginPath(); b.moveTo(-0.84, 2.96); b.lineTo(-0.66, 2.36); b.lineTo(0.66, 2.36); b.lineTo(0.84, 2.96); b.stroke();
  // the ribbed hem band
  b.fillStyle = rgba(sclc(top.base, 0.78)); b.fillRect(-1.3, 3.0, 2.6, 0.3);
  b.strokeStyle = rgba(top.dark, 0.5); b.lineWidth = 0.014;
  b.beginPath(); for (let x = -1.06; x <= 1.06; x += 0.085) { b.moveTo(x, 3.02); b.lineTo(x, 3.22); } b.stroke();
  b.strokeStyle = rgba(top.dark, 0.9); b.lineWidth = 0.022; b.beginPath(); b.moveTo(-1.2, 3.0); b.lineTo(1.2, 3.0); b.stroke();
  // a soft fold under each arm, into the side
  b.strokeStyle = rgba(top.dark, 0.6); b.lineWidth = 0.026;
  b.beginPath(); for (const sg of [-1, 1]) { b.moveTo(sg * 1.06, 1.96); b.quadraticCurveTo(sg * 0.9, 2.1, sg * 0.76, 2.14); } b.stroke();
  // the small Yochi mark on the chest
  const mk = 0.26 / 1.56;
  b.save(); b.translate(0, 1.84); b.scale(mk, mk);
  b.fillStyle = plain ? rgba(sclc(top.base, light ? 0.8 : 1.7), 0.55) : rgba(acc, 0.9); logoPath(b); b.fill();
  b.restore();
  if (!plain) { g.save(); g.translate(0, 1.84); g.scale(mk, mk); g.fillStyle = rgba(acc, cast.stripes === 'y' ? 0.35 : 0.12); logoPath(g); g.fill(); g.restore(); }
  // rim along the silhouette
  const rg = b.createLinearGradient(-1.2 * rimSide, 0, 1.2 * rimSide, 0);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.74, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, 0.65 * rim.k));
  b.globalCompositeOperation = 'lighter'; b.strokeStyle = rg; b.lineWidth = 0.11; b.beginPath(); hoodieSub(b); b.stroke();
  b.restore();
  g.fillStyle = '#000'; g.beginPath(); hoodieSub(g); g.fill();

  // ---- sleeves: full, a little slack at the elbow, ribbed cuffs, dark gloves -----------------
  const arms = [-1, 1].map((side) => {
    const A = side < 0 ? P.la : P.ra;
    return fk(side * SH_X, SH_Y, A[0], A[1], UA, FA, side);
  });
  const AP = [0.64, 0.6, 0.5, 0.52, 0.42];
  for (const [i, A] of arms.entries()) {
    const side = i ? 1 : -1;
    b.fillStyle = rgba(top.base); b.beginPath(); limbSub(b, A, AP); b.fill();
    b.save(); b.beginPath(); limbSub(b, A, AP); b.clip();
    b.fillStyle = rgba(top.dark); b.fillRect(-5, -5, 10, 20);
    b.fillStyle = rgba(top.base); b.beginPath(); limbSub(b, A.map(([x, y]) => [x + litSide * 0.12, y]), AP); b.fill();
    b.restore();
    if (side === rimSide) { b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = rgba(rim.col, 0.36 * rim.k); b.lineWidth = 0.035;
      b.beginPath(); limbEdge(b, A, AP, rimSide, 0.02); b.stroke(); b.restore(); }
    // the dropped shoulder: the sleeve seam sits below the shoulder line
    const [sx, sy] = A[0], [ex, ey] = A[1];
    const ua = Math.atan2(ey - sy, ex - sx);
    b.save(); b.translate(sx, sy); b.rotate(ua);
    b.fillStyle = rgba(top.base); b.beginPath(); b.ellipse(0.06, 0, 0.36, 0.33, 0, 0, TAU); b.fill();
    b.strokeStyle = rgba(top.dark, 0.7); b.lineWidth = 0.024;
    b.beginPath(); b.ellipse(0.06, 0, 0.36, 0.33, 0, 0.5 * Math.PI - 0.9, 0.5 * Math.PI + 0.9); b.stroke();
    b.restore();
    // elbow: the sleeve bunches where it bends
    const [wx, wy] = A[2];
    const fdx = wx - ex, fdy = wy - ey, fl = Math.hypot(fdx, fdy) || 1;
    b.strokeStyle = rgba(top.dark, 0.75); b.lineWidth = 0.026; b.lineCap = 'round';
    b.beginPath(); b.moveTo(ex - fdy / fl * 0.16 + fdx / fl * 0.06, ey + fdx / fl * 0.16 + fdy / fl * 0.06); b.quadraticCurveTo(ex + fdx / fl * 0.14, ey + fdy / fl * 0.14, ex + fdy / fl * 0.16 + fdx / fl * 0.06, ey - fdx / fl * 0.16 + fdy / fl * 0.06); b.stroke();
    b.lineCap = 'butt';
    // ribbed cuff and glove
    const ux = fdx / fl, uy = fdy / fl, nx = -uy, ny = ux;
    const cx0 = wx - ux * 0.16, cy0 = wy - uy * 0.16;
    b.fillStyle = rgba(sclc(top.base, 0.78));
    b.beginPath(); b.moveTo(cx0 + nx * 0.22, cy0 + ny * 0.22); b.lineTo(wx + nx * 0.2, wy + ny * 0.2); b.lineTo(wx - nx * 0.2, wy - ny * 0.2); b.lineTo(cx0 - nx * 0.22, cy0 - ny * 0.22); b.closePath(); b.fill();
    b.fillStyle = rgba(sclc(trou.dark, 0.9));
    b.beginPath(); b.ellipse(wx + ux * 0.14, wy + uy * 0.14, 0.2, 0.165, Math.atan2(uy, ux), 0, TAU); b.fill();
    b.strokeStyle = rgba(sclc(trou.dark, 2.4), 0.5); b.lineWidth = 0.022;
    b.beginPath(); b.ellipse(wx + ux * 0.14, wy + uy * 0.14, 0.2, 0.165, Math.atan2(uy, ux), -0.9, 0.9); b.stroke();
    g.fillStyle = '#000'; g.beginPath(); limbSub(g, A, AP); g.moveTo(wx + 0.3, wy); g.arc(wx, wy, 0.3, TAU, 0, true); g.moveTo(sx + 0.42, sy); g.arc(sx, sy, 0.42, TAU, 0, true); g.fill();
  }
  b.restore(); g.restore();

  // ---- the hood (in screen space) ------------------------------------------------------------
  const hlx = shift + HIP_Y * Math.sin(rot), hly = HIP_Y - HIP_Y * Math.cos(rot);
  const lx = fx * s * hlx, ly = s * (hly - FD);
  const cr = Math.cos(o.roll || 0), sr = Math.sin(o.roll || 0);
  const hx = o.x + cr * lx - sr * ly;
  const hy = o.y + sr * lx + cr * ly;
  const hsz = s * HELM;
  const dn = (1 - HELM) * 0.95 * s; // seat the hood's collar in the neckline
  const th = (o.roll || 0) + fx * rot;
  const hx2 = hx - Math.sin(th) * dn, hy2 = hy + Math.cos(th) * dn;
  if (o.canon && cast.canon) {
    // the canonical contestant's hood and visor on the rig's body (a head swap: the painting fades out
    // at its collar, over the rig's own neckline)
    const v = drawCanon(R, {
      who: cast.canon, kind: 'bust', x: hx2, y: hy2 - hsz * 0.02, s: hsz * 1.08, roll: th, flip: o.flip, face: o.face, led: o.led, ledI: o.ledI, status: o.status,
      key: key0, rim: rim0, fog: o.fog, fogCol: o.fogCol, cut: [1.05, 1.6], lift: o.lift, exposure: 0.8,
    });
    return { hx: hx2, hy: hy2, hs: hsz, v };
  }
  drawHelmet(R, {
    x: hx2, y: hy2, s: hsz, type: cast.type, shell: cast.shell, accent: cast.accent, stripes: cast.stripes,
    face: o.face, led: o.led, ledI: o.ledI, yaw: fx * (o.yaw || 0), pitch: o.pitch || 0, roll: (o.roll || 0) + fx * (lean * 0.8 - tilt * 0.9),
    key: key0, rim: rim0, status: o.status, fog: o.fog, fogCol: o.fogCol, visorGlow: o.visorGlow, cords: 1.05,
  });
  return { hx: hx2, hy: hy2, hs: hsz };
}
