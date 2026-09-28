// Skeleton + poses for the Yochi competitor. Forward kinematics in JS; the shader receives, per bone,
// the inverse world matrix (model space -> bone space) and evaluates each body part in its bone's frame.
// Model space: feet on y = 0, y up, +z the way the character faces, +x the character's left.
// Units: helmet heights (the head is 1.0 tall). Standing height ~6.3.

// ---- tiny mat4 (column-major) ------------------------------------------------------------
export const M4 = {
  id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
  tr: (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  rx: (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
  ry: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
  rz: (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
  // rotation order: Y (twist) then X (flex) then Z (abduct), applied in the bone's local frame
  rot(r) { return r ? M4.mul(M4.mul(M4.ry(r[1] || 0), M4.rx(r[0] || 0)), M4.rz(r[2] || 0)) : M4.id(); },
  // inverse of a rigid transform
  inv(m) {
    const o = [m[0], m[4], m[8], 0, m[1], m[5], m[9], 0, m[2], m[6], m[10], 0, 0, 0, 0, 1];
    o[12] = -(o[0] * m[12] + o[4] * m[13] + o[8] * m[14]);
    o[13] = -(o[1] * m[12] + o[5] * m[13] + o[9] * m[14]);
    o[14] = -(o[2] * m[12] + o[6] * m[13] + o[10] * m[14]);
    return o;
  },
  apply: (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]],
};

// ---- skeleton: [name, parent, offset from parent pivot (rest)] --------------------------------
export const HEAD_H = 5.56; // head centre height at rest
export const HEAD_OFS = 0.5; // head centre above the head bone's pivot
export const BONES = [
  ['pelvis', -1, [0, 3.2, 0]],
  ['spine', 0, [0, 0.36, 0]],
  ['chest', 1, [0, 0.62, 0]],
  ['neck', 2, [0, 0.8, -0.05]],
  ['head', 3, [0, 0.08, 0.035]],
  ['clavL', 2, [0.1, 0.6, -0.03]],
  ['clavR', 2, [-0.1, 0.6, -0.03]],
  ['uarmL', 5, [0.51, -0.07, 0]],
  ['uarmR', 6, [-0.51, -0.07, 0]],
  ['farmL', 7, [0, -1.0, 0]],
  ['farmR', 8, [0, -1.0, 0]],
  ['handL', 9, [0, -0.9, 0]],
  ['handR', 10, [0, -0.9, 0]],
  ['thighL', 0, [0.245, -0.06, 0]],
  ['thighR', 0, [-0.245, -0.06, 0]],
  ['shinL', 13, [0, -1.46, 0]],
  ['shinR', 14, [0, -1.46, 0]],
  ['footL', 15, [0, -1.46, 0]],
  ['footR', 16, [0, -1.46, 0]],
];
export const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b[0], i]));
export const NB = BONES.length;

// ---- poses: rotations [x flex, y twist, z abduct] per bone, plus a root offset ----------------------
// Arm z-rotation: + raises the arm away from the body (mirrored per side automatically).
// Knee (shin) x: + bends the knee (foot goes back). Thigh x: - swings the leg forward.
const P = (o) => o;
export const POSES = {
  // weight on the character's right leg, hip dropped left, shoulders counter-tilted, head turned
  neutral: P({
    root: [0.04, -0.02, 0], pelvis: [0.0, 0.08, -0.07], spine: [0.02, -0.04, 0.03], chest: [-0.04, -0.05, 0.05],
    neck: [0.04, 0.08, -0.03], head: [0.02, 0.14, -0.06],
    clavL: [0, 0, 0.02], clavR: [0, 0, -0.02],
    uarmL: [0.06, 0.15, 0.16], uarmR: [-0.04, -0.15, 0.13], farmL: [-0.3, 0, 0], farmR: [-0.18, 0, 0], handL: [-0.1, 0, 0.05], handR: [-0.08, 0, 0.05],
    thighL: [-0.12, 0.1, 0.02], thighR: [0.02, -0.06, -0.07], shinL: [0.3, 0, 0], shinR: [0.02, 0, 0], footL: [-0.14, 0.18, -0.02], footR: [-0.02, -0.08, 0.07],
    fist: [0.3, 0.3],
  }),
  // "call it": right arm points up, weight forward, chin up
  callUp: P({
    root: [0, -0.02, 0], pelvis: [0.05, 0.12, 0.02], spine: [0.06, 0.05, 0], chest: [0.02, 0.1, -0.03],
    neck: [-0.05, 0, 0], head: [-0.16, -0.12, 0.05],
    clavR: [0, 0, 0.12],
    uarmL: [0.25, 0, 0.22], farmL: [-0.9, 0, 0], handL: [0, 0, 0],
    uarmR: [-0.2, 0.2, 2.75], farmR: [-0.12, 0, 0], handR: [0, 0, 0],
    thighL: [-0.35, 0.05, 0.08], thighR: [0.18, -0.05, -0.02], shinL: [0.4, 0, 0], shinR: [0.18, 0, 0], footL: [-0.05, 0, 0], footR: [-0.32, 0, 0],
    fist: [1, 0.95], point: [0, 1],
  }),
  // "call it": right arm points down and across, weight back
  callDown: P({
    root: [0, -0.04, 0], pelvis: [-0.02, -0.1, 0.03], spine: [0.12, -0.05, -0.02], chest: [0.1, -0.12, 0.05],
    neck: [0.08, 0, 0], head: [0.2, 0.15, -0.05],
    uarmL: [0.1, 0, 0.35], farmL: [-0.5, 0, 0],
    uarmR: [-0.55, 0.3, 0.75], farmR: [-0.08, 0, 0], handR: [0.1, 0, 0],
    thighL: [-0.1, 0, 0.14], thighR: [0.05, 0, -0.08], shinL: [0.22, 0, 0], shinR: [0.1, 0, 0], footL: [-0.12, 0, -0.1], footR: [-0.1, 0, 0.05],
    fist: [0.9, 0.95], point: [0, 1],
  }),
  // victory: both arms up in the Y of the logo (arms 30 degrees off vertical... the logo's 60)
  victory: P({
    root: [0, 0.02, 0], pelvis: [0, 0, 0], spine: [-0.04, 0, 0], chest: [-0.08, 0, 0],
    neck: [-0.02, 0, 0], head: [-0.08, 0, 0],
    clavL: [0, 0, 0.14], clavR: [0, 0, 0.14],
    uarmL: [0, 0, 2.55], uarmR: [0, 0, 2.55], farmL: [0, 0, 0.05], farmR: [0, 0, 0.05], handL: [0, 0, 0], handR: [0, 0, 0],
    thighL: [-0.02, 0, 0.12], thighR: [-0.02, 0, 0.12], shinL: [0.04, 0, 0], shinR: [0.04, 0, 0], footL: [0, 0, -0.1], footR: [0, 0, -0.1],
    fist: [1, 1],
  }),
  // committed: squared up, fists low, leaning in (the moment before the candle closes)
  ready: P({
    root: [0, -0.12, 0], pelvis: [0.18, 0, 0], spine: [0.14, 0, 0], chest: [0.08, 0, 0],
    neck: [-0.1, 0, 0], head: [-0.12, 0, 0],
    uarmL: [-0.35, 0.3, 0.32], uarmR: [-0.35, -0.3, 0.32], farmL: [-1.3, 0, 0], farmR: [-1.3, 0, 0],
    thighL: [-0.42, 0, 0.16], thighR: [-0.42, 0, 0.16], shinL: [0.72, 0, 0], shinR: [0.72, 0, 0], footL: [-0.3, 0, -0.12], footR: [-0.3, 0, -0.12],
    fist: [1, 1],
  }),
  // eliminated: slumped
  slump: P({
    root: [0, -0.1, 0], pelvis: [0.1, 0, 0.02], spine: [0.22, 0, 0.03], chest: [0.28, 0, 0.02],
    neck: [0.35, 0, 0], head: [0.3, 0.1, 0.1],
    clavL: [0, 0, -0.08], clavR: [0, 0, -0.08],
    uarmL: [0.1, 0, 0.03], uarmR: [0.08, 0, 0.03], farmL: [-0.08, 0, 0], farmR: [-0.1, 0, 0],
    thighL: [-0.2, 0, 0.06], thighR: [-0.12, 0, 0.04], shinL: [0.34, 0, 0], shinR: [0.26, 0, 0], footL: [-0.12, 0, 0], footR: [-0.12, 0, 0],
    fist: [0.1, 0.1],
  }),
  // smug: arms folded high, weight back, head tilted
  smug: P({
    root: [0, 0, 0], pelvis: [-0.04, -0.15, 0.04], spine: [-0.04, -0.05, 0], chest: [-0.06, -0.05, -0.02],
    neck: [0, 0.1, 0.06], head: [-0.05, 0.25, 0.12],
    uarmL: [0.12, -0.1, 0.62], uarmR: [0.16, -0.1, 0.66], farmL: [-0.2, 0.0, -1.95], farmR: [-0.25, 0.0, -1.95], handL: [0, 0, -0.35], handR: [0, 0, -0.35],
    thighL: [-0.1, 0, 0.14], thighR: [0.06, 0, -0.05], shinL: [0.12, 0, 0], shinR: [0.06, 0, 0], footL: [-0.05, 0.2, -0.12], footR: [-0.05, -0.1, 0.05],
    fist: [0.75, 0.75],
  }),
};

export function blendPose(a, b, t) {
  const A = typeof a === 'string' ? POSES[a] : a, B = typeof b === 'string' ? POSES[b] : b;
  const o = {};
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  for (const k of keys) {
    const x = A[k] || [0, 0, 0], y = B[k] || [0, 0, 0];
    o[k] = x.map((v, i) => v + ((y[i] ?? 0) - v) * t);
  }
  return o;
}

// Forward kinematics. Returns { inv: Float32Array(NB*16) (model->bone), world: [mat4], joint(name, local) }.
// Mirroring: poses are authored for the character's right side (R) with +z abduction raising the arm; the
// left side mirrors the sign of the y and z rotations.
export function solve(pose) {
  const po = typeof pose === 'string' ? POSES[pose] : (pose || POSES.neutral);
  const world = new Array(NB);
  for (let i = 0; i < NB; i++) {
    const [name, parent, off] = BONES[i];
    let r = po[name] || [0, 0, 0];
    const left = name.endsWith('L');
    if (left) r = [r[0], -(r[1] || 0), -(r[2] || 0)];
    // arms: abduction for the right side rotates about +z (the arm swings out toward -x)
    if (name.startsWith('uarm') || name.startsWith('farm') || name.startsWith('hand') || name.startsWith('clav')) r = [r[0], r[1], -(r[2] || 0)];
    if (name.startsWith('thigh') || name.startsWith('shin') || name.startsWith('foot')) r = [r[0], r[1], -(r[2] || 0)];
    let local = M4.mul(M4.tr(...off), M4.rot(r));
    if (i === 0) {
      const ro = po.root || [0, 0, 0];
      local = M4.mul(M4.tr(ro[0] || 0, ro[1] || 0, ro[2] || 0), local);
    }
    world[i] = parent < 0 ? local : M4.mul(world[parent], local);
  }
  const inv = new Float32Array(NB * 16);
  for (let i = 0; i < NB; i++) inv.set(M4.inv(world[i]), i * 16);
  const joint = (name, local = [0, 0, 0]) => M4.apply(world[BONE_INDEX[name]], local);
  return { inv, world, joint, pose: po };
}
