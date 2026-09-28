// Full-body players: athletic, stylised proportions (the helmet is ~30% of the height).
// Unit space: helmet centred at (0,0), half-width ~0.95. Standing feet at y = FEET.
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';
import { drawHelmet, RGB } from './helmet.js';

const TAU = Math.PI * 2;
const FEET = 5.6;
const SH_Y = 1.5, SH_X = 1.06;      // shoulder joints
const HIP_Y = 2.98, HIP_X = 0.42;   // hip joints
const UA = 1.1, FA = 1.0;           // upper arm, forearm
const TH = 1.3, SHIN = 1.16, BOOT = 0.16;
const HEAD_K = 0.86;                // body unit relative to the caller's s
const HELM = 0.9;                   // helmet size relative to the body unit

// Angles are measured from straight down; positive = outward (away from the body) for both sides.
export const POSES = {
  idle: { la: [0.16, -0.2], ra: [0.16, -0.2], ll: [0.05, 0], rl: [0.05, 0], lean: 0, crouch: 0 },
  cheer: { la: [2.6, 0.22], ra: [2.6, 0.22], ll: [0.14, 0], rl: [0.14, 0], lean: 0, crouch: 0 },
  fist: { la: [0.2, -0.3], ra: [2.55, 1.35], ll: [0.1, 0], rl: [0.1, 0], lean: 0, crouch: 0.04 },
  point: { la: [0.16, -0.24], ra: [1.55, 0.0], ll: [0.08, 0], rl: [0.14, 0], lean: 0, crouch: 0 },
  flail: { la: [2.3, 1.1], ra: [1.9, -1.3], ll: [0.7, 0.8], rl: [0.45, -1.0], lean: 0.2, crouch: 0, air: true },
  slump: { la: [0.04, 0.05], ra: [0.04, 0.05], ll: [0.1, 0], rl: [0.1, 0], lean: 0.08, crouch: 0.22 },
  shrug: { la: [0.9, -2.2], ra: [0.9, -2.2], ll: [0.07, 0], rl: [0.07, 0], lean: 0, crouch: 0 },
  brace: { la: [0.62, 1.2], ra: [0.62, 1.2], ll: [0.22, 0], rl: [0.22, 0], lean: 0, crouch: 0.26 },
};
export function blendPose(a, b, t) {
  const A = typeof a === 'string' ? POSES[a] : a, B = typeof b === 'string' ? POSES[b] : b;
  const L = (x, y) => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  return { la: L(A.la, B.la), ra: L(A.ra, B.ra), ll: L(A.ll, B.ll), rl: L(A.rl, B.rl), lean: lerp(A.lean, B.lean, t), crouch: lerp(A.crouch, B.crouch, t), air: t < 0.5 ? A.air : B.air };
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
// tapered segment as a subpath
function seg(c, x0, y0, x1, y1, w0, w1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2);
  c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  c.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2);
  c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  c.closePath();
}
function limbSub(c, pts, w0, w1, w2) {
  seg(c, pts[0][0], pts[0][1], pts[1][0], pts[1][1], w0, w1);
  seg(c, pts[1][0], pts[1][1], pts[2][0], pts[2][1], w1 * 0.96, w2);
  // joint disc wound the same way as the quads (anticlockwise), or nonzero filling would punch a hole in the knee
  c.moveTo(pts[1][0] + w1 / 2, pts[1][1]); c.arc(pts[1][0], pts[1][1], w1 / 2, TAU, 0, true);
}
// the edge of a limb on a given screen side (+1 right, -1 left), for rims and piping
function limbEdge(c, pts, w0, w1, w2, sideSign, inset = 0) {
  const P = [[pts[0], w0], [pts[1], w1], [pts[2], w2]];
  c.moveTo(pts[0][0] + sideSign * (w0 / 2 - inset), pts[0][1]);
  for (let i = 1; i < 3; i++) c.lineTo(P[i][0][0] + sideSign * (P[i][1] / 2 - inset), P[i][0][1]);
}
function torsoSub(c, hipY) {
  c.moveTo(-0.4, 0.96);
  c.lineTo(-0.43, 1.2);
  c.bezierCurveTo(-0.74, 1.24, -0.98, 1.3, -1.16, 1.42);
  c.bezierCurveTo(-1.3, 1.52, -1.34, 1.7, -1.25, 1.9);
  c.lineTo(-1.05, 2.08);
  c.lineTo(-0.66, 2.62);
  c.lineTo(-0.8, hipY - 0.02);
  c.lineTo(-0.56, hipY + 0.16);
  c.lineTo(0, hipY + 0.22);
  c.lineTo(0.56, hipY + 0.16);
  c.lineTo(0.8, hipY - 0.02);
  c.lineTo(0.66, 2.62);
  c.lineTo(1.05, 2.08);
  c.lineTo(1.25, 1.9);
  c.bezierCurveTo(1.34, 1.7, 1.3, 1.52, 1.16, 1.42);
  c.bezierCurveTo(0.98, 1.3, 0.74, 1.24, 0.43, 1.2);
  c.lineTo(0.4, 0.96);
  c.closePath();
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
  const acc = typeof cast.accent === 'string' ? hexToRgb(cast.accent) : (cast.accent || RGB.cyan);
  const crouch = P.crouch || 0;
  const drop = crouch * 1.1;
  const FD = FEET - drop;
  const lean = P.lean || 0;
  const litSide = key.x <= 0 ? -1 : 1;           // the side the key light comes from
  const rimSide = rim.x >= 0 ? 1 : -1;

  b.save(); g.save();
  for (const c of [b, g]) {
    c.translate(o.x, o.y); c.rotate(o.roll || 0); c.scale(s * fx, s);
    c.translate(0, -FD);
  }
  b.lineJoin = 'miter'; g.lineJoin = 'miter';

  // ---- legs ----------------------------------------------------------------------
  const legs = [-1, 1].map((side) => {
    const L = side < 0 ? P.ll : P.rl;
    const hx = side * HIP_X, hy = HIP_Y;
    if (P.air) return fk(hx, hy, L[0], L[1], TH, SHIN, side);
    const spread = Math.sin(L[0]) * (TH + SHIN) * 0.55 + crouch * 0.5;
    return ik(hx, hy, side * (HIP_X + spread), FD - BOOT, TH, SHIN, side);
  });
  const LW = [0.64, 0.44, 0.3];
  for (const [i, L] of legs.entries()) {
    const side = i ? 1 : -1;
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, L, ...LW); b.fill();
    // shadow half, away from the key light
    b.save(); b.beginPath(); limbSub(b, L, ...LW); b.clip();
    // (dark everywhere, then the lit side on top: an evenodd cut-out would flicker where the joint disc overlaps)
    b.fillStyle = rgba(dark); b.fillRect(-5, -5, 10, 20);
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, L.map(([x, y]) => [x + litSide * 0.13, y]), ...LW); b.fill();
    b.restore();
    // accent piping on the outer edge, rim on the rim side
    b.strokeStyle = rgba(acc, 0.32); b.lineWidth = 0.03; b.beginPath(); limbEdge(b, L, ...LW, side, 0.09); b.stroke();
    if (side === rimSide) { b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = rgba(rim.col, 0.45 * rim.k); b.lineWidth = 0.035;
      b.beginPath(); limbEdge(b, L, ...LW, rimSide, 0.02); b.stroke(); b.restore(); }
    // boot
    const [ax, ay] = L[2];
    const bw0 = 0.3, bw1 = 0.44, bh = P.air ? 0.2 : BOOT + 0.02;
    b.fillStyle = rgba(dark);
    b.beginPath(); b.moveTo(ax - bw0 / 2, ay - 0.02); b.lineTo(ax + bw0 / 2, ay - 0.02); b.lineTo(ax + bw1 / 2, ay + bh); b.lineTo(ax - bw1 / 2, ay + bh); b.closePath(); b.fill();
    b.fillStyle = rgba(acc, 0.8); b.fillRect(ax - bw1 / 2, ay + bh - 0.035, bw1, 0.035);
    g.fillStyle = '#000'; g.beginPath(); limbSub(g, L, ...LW); g.rect(ax - bw1 / 2, ay - 0.02, bw1, bh + 0.02); g.fill();
  }

  // ---- upper body (leans around the hips) --------------------------------------------
  for (const c of [b, g]) { c.translate(0, HIP_Y); c.rotate(lean); c.translate(0, -HIP_Y); }
  const hipY = HIP_Y;
  b.fillStyle = rgba(body); b.beginPath(); torsoSub(b, hipY); b.fill();
  b.save(); b.beginPath(); torsoSub(b, hipY); b.clip();
  // cel shade
  b.fillStyle = rgba(dark);
  b.beginPath(); b.rect(-3, 0, 6, 5); b.ellipse(key.x * 0.62, 1.9, 0.94, 1.5, 0, 0, TAU); b.fill('evenodd');
  // chest plate (yoke) and belt
  b.fillStyle = rgba(panel, 0.55);
  b.beginPath(); b.moveTo(-0.98, 1.44); b.lineTo(0, 2.06); b.lineTo(0.98, 1.44); b.lineTo(0.46, 1.22); b.lineTo(-0.46, 1.22); b.closePath(); b.fill();
  b.strokeStyle = rgba(acc, 0.7); b.lineWidth = 0.03;
  b.beginPath(); b.moveTo(-1.0, 1.52); b.lineTo(0, 2.14); b.lineTo(1.0, 1.52); b.stroke();
  b.strokeStyle = rgba(dark, 1); b.lineWidth = 0.035;
  b.beginPath(); b.moveTo(0, 2.14); b.lineTo(0, 2.62); b.stroke();
  b.fillStyle = rgba([body[0] * 0.4, body[1] * 0.4, body[2] * 0.45]); b.fillRect(-0.9, 2.58, 1.8, 0.14);
  b.fillStyle = rgba(acc, 0.9); b.fillRect(-0.09, 2.6, 0.18, 0.1);
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
  const AW = [0.45, 0.34, 0.27];
  for (const [i, A] of arms.entries()) {
    const side = i ? 1 : -1;
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, A, ...AW); b.fill();
    b.save(); b.beginPath(); limbSub(b, A, ...AW); b.clip();
    b.fillStyle = rgba(dark); b.fillRect(-5, -5, 10, 20);
    b.fillStyle = rgba(body); b.beginPath(); limbSub(b, A.map(([x, y]) => [x + litSide * 0.1, y]), ...AW); b.fill();
    b.restore();
    // pauldron
    b.fillStyle = rgba(panel);
    b.beginPath(); b.moveTo(side * 0.77, 1.34); b.bezierCurveTo(side * 1.17, 1.26, side * 1.42, 1.46, side * 1.46, 1.86); b.lineTo(side * 1.17, 1.9); b.bezierCurveTo(side * 1.12, 1.64, side * 0.99, 1.5, side * 0.76, 1.46); b.closePath(); b.fill();
    b.strokeStyle = rgba([panel[0] * 1.6, panel[1] * 1.6, panel[2] * 1.6], 0.8); b.lineWidth = 0.03;
    b.beginPath(); b.moveTo(side * 0.77, 1.34); b.bezierCurveTo(side * 1.17, 1.26, side * 1.42, 1.46, side * 1.46, 1.86); b.stroke();
    if (side === rimSide) { b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = rgba(rim.col, 0.42 * rim.k); b.lineWidth = 0.035;
      b.beginPath(); limbEdge(b, A, ...AW, rimSide, 0.02); b.stroke(); b.restore(); }
    // glove: an angular wedge along the forearm
    const [ex, ey] = A[1], [wx, wy] = A[2];
    const dx = wx - ex, dy = wy - ey, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const gl = 0.34, gw = 0.15;
    b.fillStyle = rgba(dark);
    b.beginPath();
    b.moveTo(wx + nx * gw * 0.8, wy + ny * gw * 0.8);
    b.lineTo(wx + ux * gl * 0.7 + nx * gw, wy + uy * gl * 0.7 + ny * gw);
    b.lineTo(wx + ux * gl, wy + uy * gl);
    b.lineTo(wx + ux * gl * 0.7 - nx * gw, wy + uy * gl * 0.7 - ny * gw);
    b.lineTo(wx - nx * gw * 0.8, wy - ny * gw * 0.8);
    b.closePath(); b.fill();
    b.fillStyle = rgba(acc, 0.85); b.beginPath(); b.moveTo(wx + nx * gw * 0.8, wy + ny * gw * 0.8); b.lineTo(wx - nx * gw * 0.8, wy - ny * gw * 0.8); b.lineTo(wx - nx * gw * 0.8 + ux * 0.05, wy - ny * gw * 0.8 + uy * 0.05); b.lineTo(wx + nx * gw * 0.8 + ux * 0.05, wy + ny * gw * 0.8 + uy * 0.05); b.closePath(); b.fill();
    g.fillStyle = '#000'; g.beginPath(); limbSub(g, A, ...AW); g.moveTo(wx + 0.3, wy); g.arc(wx, wy, 0.3, TAU, 0, true); g.fill();
  }
  b.restore(); g.restore();

  // ---- helmet (in screen space) -------------------------------------------------------------
  const hlx = HIP_Y * Math.sin(lean), hly = HIP_Y - HIP_Y * Math.cos(lean);
  const lx = fx * s * hlx, ly = s * (hly - FD);
  const cr = Math.cos(o.roll || 0), sr = Math.sin(o.roll || 0);
  const hx = o.x + cr * lx - sr * ly;
  const hy = o.y + sr * lx + cr * ly;
  const hsz = s * HELM;
  const dn = (1 - HELM) * 1.0 * s; // keep the chin on the collar
  const th = (o.roll || 0) + fx * lean;
  const hx2 = hx - Math.sin(th) * dn, hy2 = hy + Math.cos(th) * dn;
  drawHelmet(R, {
    x: hx2, y: hy2, s: hsz, type: cast.type, shell: cast.shell, accent: cast.accent, stripes: cast.stripes,
    face: o.face, led: o.led, ledI: o.ledI, yaw: fx * (o.yaw || 0), pitch: o.pitch || 0, roll: (o.roll || 0) + fx * lean * 0.8,
    key: key0, rim: rim0, status: o.status, fog: o.fog, fogCol: o.fogCol, visorGlow: o.visorGlow,
  });
  return { hx: hx2, hy: hy2, hs: hsz };
}
