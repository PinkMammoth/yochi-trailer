// Full-body players (chibi proportions: the helmet is ~45% of the height).
// Unit space: helmet radius 1 at (0,0). Feet at about y = 3.6.
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';
import { drawHelmet, RGB } from './helmet.js';

const TAU = Math.PI * 2;
// Angles are measured from straight down; positive = outward (away from the body) for both sides.
export const POSES = {
  idle: { la: [0.2, -0.3], ra: [0.2, -0.3], ll: [0.06, 0], rl: [0.06, 0], lean: 0, crouch: 0 },
  cheer: { la: [2.65, 0.25], ra: [2.65, 0.25], ll: [0.25, -0.1], rl: [0.25, -0.1], lean: 0, crouch: 0 },
  fist: { la: [0.25, -0.35], ra: [2.5, 1.5], ll: [0.14, 0], rl: [0.14, 0], lean: 0, crouch: 0.05 },
  point: { la: [0.2, -0.3], ra: [1.55, 0.0], ll: [0.1, 0], rl: [0.2, -0.1], lean: 0, crouch: 0 },
  flail: { la: [2.3, 1.1], ra: [1.9, -1.3], ll: [0.7, 0.8], rl: [0.45, -1.0], lean: 0.2, crouch: 0 },
  slump: { la: [0.04, 0.05], ra: [0.04, 0.05], ll: [0.12, -0.5], rl: [0.12, -0.5], lean: 0.1, crouch: 0.25 },
  shrug: { la: [0.95, -2.3], ra: [0.95, -2.3], ll: [0.08, 0], rl: [0.08, 0], lean: 0, crouch: 0 },
  brace: { la: [0.8, 1.3], ra: [0.8, 1.3], ll: [0.35, -0.3], rl: [0.35, -0.3], lean: 0, crouch: 0.2 },
};
export function blendPose(a, b, t) {
  const A = typeof a === 'string' ? POSES[a] : a, B = typeof b === 'string' ? POSES[b] : b;
  const L = (x, y) => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  return { la: L(A.la, B.la), ra: L(A.ra, B.ra), ll: L(A.ll, B.ll), rl: L(A.rl, B.rl), lean: lerp(A.lean, B.lean, t), crouch: lerp(A.crouch, B.crouch, t) };
}

// limb: from (x,y), angles measured from straight down, second angle relative to first
function limb(c, x, y, a1, a2, l1, l2, side) {
  const x1 = x + side * Math.sin(a1) * l1, y1 = y + Math.cos(a1) * l1;
  const x2 = x1 + side * Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
  return [[x, y], [x1, y1], [x2, y2]];
}
function strokePts(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }

/**
 * o: { x, y (feet position, screen), s (helmet radius px), pose, cast:{type,shell,accent,stripes}, face, led, yaw, pitch,
 *      key, rim, roll, flip (mirror), bodyCol, status, ledI }
 */
export function drawPlayer(R, o) {
  const { b, g } = R;
  const s = o.s;
  const P = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.idle);
  const cast = o.cast || {};
  const rim = { x: 0.8, y: -0.5, col: RGB.cyan, k: 1, ...(o.rim || {}) };
  const key = { x: -0.5, y: -0.6, col: [190, 225, 255], k: 0.6, ...(o.key || {}) };
  const body = o.bodyCol || [36, 33, 54];
  const dark = [body[0] * 0.55, body[1] * 0.55, body[2] * 0.6];
  const acc = typeof cast.accent === 'string' ? hexToRgb(cast.accent) : (cast.accent || RGB.cyan);
  const crouch = P.crouch || 0;
  // local frame: feet at (0, 3.6), head centre at (0, 0)
  b.save(); g.save();
  for (const c of [b, g]) {
    c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s * (o.flip ? -1 : 1), s);
    c.translate(0, -3.6 + crouch * 0.6);
    c.rotate(P.lean || 0);
  }
  const rimStroke = (pts, w) => {
    b.save(); b.globalCompositeOperation = 'lighter';
    b.strokeStyle = rgba(rim.col, 0.28 * rim.k); b.lineWidth = w * 0.22; b.lineCap = 'round'; b.lineJoin = 'round';
    b.translate(rim.x * w * 0.3, rim.y * w * 0.3); strokePts(b, pts); b.restore();
  };
  // legs
  const hipY = 2.35 - crouch * 0.4;
  const legs = [limb(b, -0.32, hipY, P.ll[0], P.ll[1], 0.62 - crouch * 0.1, 0.62, -1), limb(b, 0.32, hipY, P.rl[0], P.rl[1], 0.62 - crouch * 0.1, 0.62, 1)];
  b.lineCap = 'round'; b.lineJoin = 'round';
  for (const L of legs) {
    b.strokeStyle = rgba(dark); b.lineWidth = 0.42; strokePts(b, L);
    rimStroke(L, 0.42);
    const f = L[2];
    b.fillStyle = rgba([lerp(acc[0], 30, 0.5), lerp(acc[1], 30, 0.5), lerp(acc[2], 40, 0.5)]);
    b.beginPath(); b.ellipse(f[0], f[1] + 0.08, 0.3, 0.17, 0, 0, TAU); b.fill();
  }
  // back arm (drawn before torso)
  const sh = 1.12;
  const armL = limb(b, -0.72, sh, P.la[0], P.la[1], 0.62, 0.58, -1);
  const armR = limb(b, 0.72, sh, P.ra[0], P.ra[1], 0.62, 0.58, 1);
  // torso (hoodie)
  b.fillStyle = rgba(body);
  b.beginPath();
  b.moveTo(-0.62, 0.78);
  b.quadraticCurveTo(-0.98, 0.9, -0.92, 1.4);
  b.lineTo(-0.78, hipY + 0.1);
  b.quadraticCurveTo(0, hipY + 0.28, 0.78, hipY + 0.1);
  b.lineTo(0.92, 1.4);
  b.quadraticCurveTo(0.98, 0.9, 0.62, 0.78);
  b.closePath(); b.fill();
  b.save(); b.clip();
  b.fillStyle = rgba(dark);
  b.beginPath(); b.rect(-2, 0, 4, 4); b.ellipse(key.x * 0.6, 1.3, 0.95, 1.4, 0, 0, TAU); b.fill('evenodd');
  // pocket + zip
  b.strokeStyle = rgba([body[0] * 0.5, body[1] * 0.5, body[2] * 0.55]); b.lineWidth = 0.05;
  b.beginPath(); b.moveTo(-0.45, 1.95); b.quadraticCurveTo(0, 2.05, 0.45, 1.95); b.stroke();
  b.strokeStyle = rgba(acc, 0.8); b.lineWidth = 0.05; b.beginPath(); b.moveTo(0, 0.95); b.lineTo(0, hipY); b.stroke();
  b.globalCompositeOperation = 'lighter';
  const rg = b.createLinearGradient(-rim.x * 1.2, 0, rim.x * 1.2, 0);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.7, 'rgba(0,0,0,0)'); rg.addColorStop(1, rgba(rim.col, 0.8 * rim.k));
  b.strokeStyle = rg; b.lineWidth = 0.14;
  b.beginPath(); b.moveTo(-0.62, 0.78); b.quadraticCurveTo(-0.98, 0.9, -0.92, 1.4); b.lineTo(-0.78, hipY + 0.1); b.moveTo(0.62, 0.78); b.quadraticCurveTo(0.98, 0.9, 0.92, 1.4); b.lineTo(0.78, hipY + 0.1); b.stroke();
  b.restore();
  // arms
  for (const A of [armL, armR]) {
    b.strokeStyle = rgba(body); b.lineWidth = 0.36; strokePts(b, A);
    rimStroke(A, 0.36);
    const h = A[2];
    b.fillStyle = rgba([body[0] * 1.25, body[1] * 1.25, body[2] * 1.25]);
    b.beginPath(); b.arc(h[0], h[1], 0.2, 0, TAU); b.fill();
  }
  b.restore(); g.restore();
  // helmet on top (in screen space)
  const hgt = (3.6 - crouch * 0.6) * s;
  const hx = o.x + Math.sin(o.roll || 0) * hgt;
  const hy = o.y - Math.cos(o.roll || 0) * hgt;
  drawHelmet(R, {
    x: hx, y: hy, s, type: cast.type, shell: cast.shell, accent: cast.accent, stripes: cast.stripes,
    face: o.face, led: o.led, ledI: o.ledI, yaw: (o.flip ? -1 : 1) * (o.yaw || 0), pitch: o.pitch || 0, roll: (o.roll || 0) + (P.lean || 0) * 0.6,
    key, rim, status: o.status, fog: o.fog, fogCol: o.fogCol,
  });
  return { hx, hy };
}
