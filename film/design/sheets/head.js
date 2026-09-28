import { renderer } from '../../src/character/renderer.js';
import { face } from '../../src/character/face.js';
import { HEAD_BUST as HEAD_ONLY, HEAD_BOX } from '../../src/character/head.glsl.js';
import { backdrop, label, COL, LIGHT } from './lib.js';

export const HEADS = {};
// ---- CALLER head iteration --------------------------------------------------------------

function drawHead(R, o) {
  const { call = 1, ...rest } = o;
  const led = call > 0 ? COL.green : call < 0 ? COL.red : COL.text;
  return renderer().draw(R, {
    model: HEAD_ONLY, box: HEAD_BOX, anchor: [0, 0, 0], ss: 2, elev: 0.05, fov: 0.2, lights: LIGHT.studio,
    shell: COL.slate, trim: [40, 38, 54], accent: COL.cyan, suit: [26, 24, 38],
    pick: led, face: face(call > 0 ? 'up' : call < 0 ? 'down' : 'slits', led), ...rest,
  });
}
HEADS.head = async (R, P, variant) => {
  backdrop(R, { cx: 960, cy: 480 });
  const pearl = variant === 'pearl';
  const shell = pearl ? COL.pearl : COL.slate, trim = pearl ? [58, 56, 74] : [40, 38, 54];
  const views = [[0, 'FRONT'], [0.6, 'THREE-QUARTER'], [Math.PI / 2, 'SIDE'], [2.5, 'REAR THREE-QUARTER'], [Math.PI, 'BACK']];
  views.forEach(([yaw, lab], i) => {
    const x = 200 + i * 380;
    drawHead(R, { x, y: 400, scale: 330, yaw, shell, trim, call: 1 });
    label(R, lab, x, 700, { size: 14, align: 'center', col: COL.faint });
  });
  // mid and small scale strips
  for (let k = 0; k < 10; k++) drawHead(R, { x: 160 + k * 90, y: 870, scale: 80, yaw: (k - 4.5) * 0.3, shell, trim, call: k % 3 ? 1 : -1, ss: 3 });
  for (let k = 0; k < 16; k++) drawHead(R, { x: 1100 + k * 46, y: 860, scale: 36, yaw: (k - 7.5) * 0.18, shell, trim, call: (k * 7) % 5 < 2 ? -1 : 1, ss: 3 });
  for (let k = 0; k < 24; k++) drawHead(R, { x: 1100 + k * 30.5, y: 960, scale: 18, yaw: (k - 11.5) * 0.12, shell, trim, call: (k * 5) % 7 < 3 ? -1 : 1, ss: 4, elev: 0.15 });
  return { stats: renderer().stats };
};

// the full-body model's head, large, three-quarter from slightly below (hero angle)
import { drawCaller, CAST } from './body.js';
HEADS.headOnBody = async (R) => {
  backdrop(R, { cx: 960, cy: 420 });
  [[0.0, 330], [0.62, 960], [1.3, 1590]].forEach(([yaw, x]) => {
    drawCaller(R, { x, y: 470, scale: 560, yaw, cast: CAST.you, call: 1, elev: 0.03, anchorAt: 'head', clip: [x - 320, 0, x + 320, 1080] });
  });
  return { stats: renderer().stats };
};
