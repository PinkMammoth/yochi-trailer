// Full-body players: compact, athletic, stylised proportions (the helmet is ~28% of the height).
// Unit space: helmet centred at (0,0), half-width ~0.95. Standing feet at y = FEET.
// Shaped limbs (thigh and calf, deltoid, bicep and forearm) with knee pads, gloves and chunky
// boots; a torso that tapers from a clean shoulder line; poses carry a weight shift, so standing
// reads as confidence rather than attention.
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';
import { drawHelmet, RGB, mirrorSub } from './helmet.js';

const TAU = Math.PI * 2;
const FEET = 5.6;
const SH_Y = 1.52, SH_X = 0.97;     // shoulder joints
const HIP_Y = 2.98, HIP_X = 0.42;   // hip joints
const UA = 1.1, FA = 1.0;           // upper arm, forearm
const TH = 1.3, SHIN = 1.16, BOOT = 0.16;
const HEAD_K = 0.86;                // body unit relative to the caller's s
const HELM = 0.9;                   // helmet size relative to the body unit

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
function fk(x, y, a1, a2, l1, l2, side) {
  const x1 = x + side * Math.sin(a1) * l1, y1 = y + Math.cos(a1) * l1;
  const x2 = x1 + side * Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
  return [[x, y], [x1, y1], [x2, y2]];
}
// two-bone IK from a hip to a planted ankle; knees bend outward
function ik(hx, hy, ax, ay, l1, l2, side) {
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
// Torso: a clean trapezius into the shoulder caps, the lats tapering to the waist, the hips.
function torsoSub(c, hipY) {
  mirrorSub(c, 0.4, 0.96, [
    [0.42, 1.06, 0.43, 1.14, 0.44, 1.2],
    [0.62, 1.24, 0.82, 1.3, 0.96, 1.38],
    [1.12, 1.46, 1.17, 1.66, 1.08, 1.86],
    [0.98, 2.1, 0.78, 2.38, 0.68, 2.6],
    [0.73, 2.76, 0.8, 2.9, 0.78, hipY],
    [0.7, hipY + 0.14, 0.44, hipY + 0.22, 0, hipY + 0.24],
  ]);
}

/**
 * o: { x, y (feet position, screen), s (scale: helmet radius px before HEAD_K), pose, cast:{type,shell,accent,stripes},
 *      face, led, yaw, pitch, key, rim, roll, flip (mirror), bodyCol, status, ledI, fog, fogCol }
 * returns { hx, hy, hs } head centre and helmet radius in screen space
 */
export function drawPlayer(R, o) {
  const { b, g } = R;
  const s = o.s * HEAD_K;
  const P = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.idle);
  const cast = o.cast || {};
  const fx = o.flip ? -1 : 1;
  const rim0 = { x: 0.8, y: -0.5, col: RGB.cyan, k: 1, ...(o.rim || {}) };
  const key0 = { x: -0.5, y: -0.6, col: [190, 225, 255], k: 0.6, ...(o.key || {}) };
  // lights live in the world, so un-mirror them for the body
  const rim = { ...rim0, x: rim0.x * fx }, key = { ...key0, x: key0.x * fx };
  const body = o.bodyCol || [30, 28, 42];
  const dark = [body[0] * 0.5, body[1] * 0.5, body[2] * 0.56];
  const panel = [body[0] * 1.25 + 6, body[1] * 1.25 + 6, body[2] * 1.25 + 8];
  const lift = [body[0] * 1.3 + 8, body[1] * 1.3 + 8, body[2] * 1.3 + 12];
  const acc = typeof cast.accent === 'string' ? hexToRgb(cast.accent) : (cast.accent || RGB.cyan);
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

  // ---- legs (from a shifted, tilted pelvis to planted feet) ------------------------------
  const LP = [0.62, 0.62, 0.42, 0.46, 0.3];
  const legs = [-1, 1].map((side) => {
    const L = side < 0 ? P.ll : P.rl;
    const hx = shift + side * HIP_X * Math.cos(tilt), hy = HIP_Y + side * HIP_X * Math.sin(tilt);
    if (P.air) return fk(hx, hy, L[0], L[1], TH, SHIN, side);
    const spread = Math.sin(L[0]) * (TH + SHIN) * 0.55 + crouch * 0.5;
    return ik(hx, hy, side * (HIP_X + spread), FD - BOOT, TH, SHIN, side);
  });
  for (const [i, L] of legs.entries()) {
    const side = i ? 1 : -1;
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, L, LP); b.fill();
    // shadow half, away from the key light
    b.save(); b.beginPath(); limbSub(b, L, LP); b.clip();
    // (dark everywhere, then the lit side on top: an evenodd cut-out would flicker where the joint disc overlaps)
    b.fillStyle = rgba(dark); b.fillRect(-5, -5, 10, 20);
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, L.map(([x, y]) => [x + litSide * 0.13, y]), LP); b.fill();
    b.restore();
    // track stripe on the outer seam, rim on the rim side
    b.strokeStyle = rgba(acc, 0.4); b.lineWidth = 0.035; b.beginPath(); limbEdge(b, L, LP, side, 0.1); b.stroke();
    if (side === rimSide) { b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = rgba(rim.col, 0.45 * rim.k); b.lineWidth = 0.035;
      b.beginPath(); limbEdge(b, L, LP, rimSide, 0.02); b.stroke(); b.restore(); }
    // knee: a soft crease where the shin meets the thigh
    const [kx, ky] = L[1], [ax, ay] = L[2];
    const sdx = ax - kx, sdy = ay - ky, sl = Math.hypot(sdx, sdy) || 1;
    const tdx = kx - L[0][0], tdy = ky - L[0][1], tl = Math.hypot(tdx, tdy) || 1;
    const kn = [-(tdy / tl + sdy / sl), tdx / tl + sdx / sl], knl = Math.hypot(kn[0], kn[1]) || 1;
    b.strokeStyle = rgba(dark, 0.9); b.lineWidth = 0.03; b.lineCap = 'round';
    b.beginPath(); b.moveTo(kx - kn[0] / knl * 0.12, ky - kn[1] / knl * 0.12 + 0.05); b.quadraticCurveTo(kx, ky + 0.11, kx + kn[0] / knl * 0.12, ky + kn[1] / knl * 0.12 + 0.05); b.stroke();
    b.lineCap = 'butt';
    // boot: drawn along the shin, a chunky upper over a light sole
    const bu = [sdx / sl, sdy / sl];
    b.save(); b.translate(ax, ay); b.rotate(Math.atan2(bu[1], bu[0]) - Math.PI / 2);
    const bh = P.air ? 0.2 : BOOT + 0.02;
    b.fillStyle = rgba(dark);
    b.beginPath(); b.moveTo(-0.17, -0.16); b.lineTo(0.17, -0.16); b.lineTo(0.23, bh - 0.05); b.quadraticCurveTo(0, bh + 0.02, -0.23, bh - 0.05); b.closePath(); b.fill();
    b.fillStyle = rgba(panel); b.beginPath(); b.moveTo(-0.26, bh - 0.06); b.lineTo(0.26, bh - 0.06); b.lineTo(0.25, bh + 0.02); b.lineTo(-0.25, bh + 0.02); b.closePath(); b.fill();
    b.fillStyle = rgba(acc, 0.85); b.fillRect(-0.25, bh - 0.015, 0.5, 0.03);
    b.restore();
    g.fillStyle = '#000'; g.beginPath(); limbSub(g, L, LP); g.moveTo(ax + 0.3, ay + 0.05); g.arc(ax, ay + 0.05, 0.3, TAU, 0, true); g.fill();
  }

  // ---- upper body (shifted with the pelvis; leans around the hips, shoulders answer the tilt) -----
  const rot = lean - tilt * 0.8;
  for (const c of [b, g]) { c.translate(shift, 0); c.translate(0, HIP_Y); c.rotate(rot); c.translate(0, -HIP_Y); }
  const hipY = HIP_Y;
  b.fillStyle = rgba(body); b.beginPath(); torsoSub(b, hipY); b.fill();
  b.save(); b.beginPath(); torsoSub(b, hipY); b.clip();
  // the chest faces the light, the stomach turns away from it
  const tg = b.createLinearGradient(0, 1.2, 0, hipY);
  tg.addColorStop(0, rgba(lift)); tg.addColorStop(0.5, rgba(body)); tg.addColorStop(1, rgba([body[0] * 0.8, body[1] * 0.8, body[2] * 0.82]));
  b.fillStyle = tg; b.fillRect(-2, 0.9, 4, 2.4);
  // cel shade
  b.fillStyle = rgba(dark, 0.92);
  b.beginPath(); b.rect(-3, 0, 6, 5); b.ellipse(key.x * 0.62, 1.95, 0.9, 1.5, 0, 0, TAU); b.fill('evenodd');
  // chest yoke over the V, accent piping, the zip, the belt
  b.fillStyle = rgba(panel, 0.4);
  b.beginPath(); b.moveTo(-0.96, 1.46); b.lineTo(0, 2.06); b.lineTo(0.96, 1.46); b.lineTo(0.44, 1.22); b.lineTo(-0.44, 1.22); b.closePath(); b.fill();
  b.strokeStyle = rgba(acc, 0.7); b.lineWidth = 0.03;
  b.beginPath(); b.moveTo(-0.98, 1.53); b.lineTo(0, 2.14); b.lineTo(0.98, 1.53); b.stroke();
  b.strokeStyle = rgba(dark, 1); b.lineWidth = 0.032;
  b.beginPath(); b.moveTo(0, 2.14); b.lineTo(0, 2.6); b.stroke();
  b.fillStyle = rgba([body[0] * 0.4, body[1] * 0.4, body[2] * 0.45]); b.fillRect(-0.9, 2.58, 1.8, 0.13);
  b.fillStyle = rgba(acc, 0.9); b.fillRect(-0.09, 2.595, 0.18, 0.1);
  // rim along the silhouette
  const rg = b.createLinearGradient(-1.16 * rimSide, 0, 1.16 * rimSide, 0);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.72, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, 0.8 * rim.k));
  b.globalCompositeOperation = 'lighter'; b.strokeStyle = rg; b.lineWidth = 0.12; b.beginPath(); torsoSub(b, hipY); b.stroke();
  b.restore();
  g.fillStyle = '#000'; g.beginPath(); torsoSub(g, hipY); g.fill();

  // ---- arms ------------------------------------------------------------------------------
  const arms = [-1, 1].map((side) => {
    const A = side < 0 ? P.la : P.ra;
    return fk(side * SH_X, SH_Y, A[0], A[1], UA, FA, side);
  });
  const AP = [0.48, 0.44, 0.33, 0.37, 0.27];
  for (const [i, A] of arms.entries()) {
    const side = i ? 1 : -1;
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, A, AP); b.fill();
    b.save(); b.beginPath(); limbSub(b, A, AP); b.clip();
    b.fillStyle = rgba(dark); b.fillRect(-5, -5, 10, 20);
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, A.map(([x, y]) => [x + litSide * 0.1, y]), AP); b.fill();
    b.restore();
    if (side === rimSide) { b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = rgba(rim.col, 0.42 * rim.k); b.lineWidth = 0.035;
      b.beginPath(); limbEdge(b, A, AP, rimSide, 0.02); b.stroke(); b.restore(); }
    // deltoid: the shoulder rounds off into the arm (same cloth); its top-outer edge catches the
    // light, placed in screen terms so it stays on top when the arm rises
    const [sx, sy] = A[0], [ex, ey] = A[1];
    const ua = Math.atan2(ey - sy, ex - sx);
    b.save(); b.translate(sx, sy); b.rotate(ua);
    b.fillStyle = rgba(body); b.beginPath(); b.ellipse(0.1, 0, 0.32, 0.26, 0, 0, TAU); b.fill();
    const [h0, h1] = side > 0 ? [1.42 * Math.PI, 1.92 * Math.PI] : [1.08 * Math.PI, 1.58 * Math.PI];
    b.strokeStyle = rgba(lift, side === litSide ? 0.9 : 0.4); b.lineWidth = 0.04; b.lineCap = 'round';
    b.beginPath(); b.ellipse(0.1, 0, 0.32, 0.26, 0, h0 - ua, h1 - ua); b.stroke();
    b.lineCap = 'butt';
    b.restore();
    // glove: a mitt along the forearm with an accent cuff
    const [wx, wy] = A[2];
    const dx = wx - ex, dy = wy - ey, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    b.fillStyle = rgba(dark);
    b.beginPath(); b.ellipse(wx + ux * 0.13, wy + uy * 0.13, 0.19, 0.155, Math.atan2(uy, ux), 0, TAU); b.fill();
    b.strokeStyle = rgba([dark[0] * 2.4, dark[1] * 2.4, dark[2] * 2.2], 0.6); b.lineWidth = 0.025;
    b.beginPath(); b.ellipse(wx + ux * 0.13, wy + uy * 0.13, 0.19, 0.155, Math.atan2(uy, ux), -0.9, 0.9); b.stroke();
    b.fillStyle = rgba(acc, 0.85); b.beginPath(); b.moveTo(wx + nx * 0.15, wy + ny * 0.15); b.lineTo(wx - nx * 0.15, wy - ny * 0.15); b.lineTo(wx - nx * 0.15 - ux * 0.05, wy - ny * 0.15 - uy * 0.05); b.lineTo(wx + nx * 0.15 - ux * 0.05, wy + ny * 0.15 - uy * 0.05); b.closePath(); b.fill();
    g.fillStyle = '#000'; g.beginPath(); limbSub(g, A, AP); g.moveTo(wx + 0.3, wy); g.arc(wx, wy, 0.3, TAU, 0, true); g.moveTo(sx + 0.4, sy); g.arc(sx, sy, 0.4, TAU, 0, true); g.fill();
  }
  b.restore(); g.restore();

  // ---- helmet (in screen space) -------------------------------------------------------------
  const hlx = shift + HIP_Y * Math.sin(rot), hly = HIP_Y - HIP_Y * Math.cos(rot);
  const lx = fx * s * hlx, ly = s * (hly - FD);
  const cr = Math.cos(o.roll || 0), sr = Math.sin(o.roll || 0);
  const hx = o.x + cr * lx - sr * ly;
  const hy = o.y + sr * lx + cr * ly;
  const hsz = s * HELM;
  const dn = (1 - HELM) * 1.0 * s; // keep the chin on the collar
  const th = (o.roll || 0) + fx * rot;
  const hx2 = hx - Math.sin(th) * dn, hy2 = hy + Math.cos(th) * dn;
  drawHelmet(R, {
    x: hx2, y: hy2, s: hsz, type: cast.type, shell: cast.shell, accent: cast.accent, stripes: cast.stripes,
    face: o.face, led: o.led, ledI: o.ledI, yaw: fx * (o.yaw || 0), pitch: o.pitch || 0, roll: (o.roll || 0) + fx * (lean * 0.8 - tilt * 0.9),
    key: key0, rim: rim0, status: o.status, fog: o.fog, fogCol: o.fogCol, visorGlow: o.visorGlow,
  });
  return { hx: hx2, hy: hy2, hs: hsz };
}
