import { renderer } from '../../src/character/renderer.js';
import { face } from '../../src/character/face.js';
import { conceptModel, CONCEPT_INFO, BUST_BOX } from '../models/concepts.glsl.js';
import { backdrop, label, rule, COL, LIGHT } from './lib.js';


function drawConcept(R, name, o) {
  const { call = 1, ...rest } = o;
  const led = call > 0 ? COL.green : call < 0 ? COL.red : COL.text;
  return renderer().draw(R, {
    model: conceptModel(name), box: BUST_BOX, anchor: [0, 0, 0], ss: 2, elev: 0.06, fov: 0.22,
    lights: LIGHT.studio, shell: COL.slate, accent: COL.cyan, suit: [26, 24, 38], trim: [70, 68, 92],
    pick: led, face: face(call > 0 ? 'up' : call < 0 ? 'down' : 'slits', led), ...rest,
  });
}

// The first round: six helmet directions on the same neutral bust (see CHARACTER.md).
export const EXPLORE = {
  // One concept: front / three-quarter / side / back at hero scale, plus a crowd patch.
  async concept(R, P, name) {
    backdrop(R, { cx: 700, cy: 520 });
    const shell = COL.slate;
    label(R, name, 70, 92, { size: 44, col: COL.text, track: 6, font: '700 44px "Chakra Petch"' });
    label(R, CONCEPT_INFO[name], 72, 128, { size: 17, col: COL.muted, track: 1.5, font: '500 17px "Chakra Petch"' });
    rule(R, 70, 1850, 150);
    const views = [[0, 'FRONT'], [0.62, 'THREE-QUARTER'], [Math.PI / 2, 'SIDE'], [Math.PI, 'BACK']];
    views.forEach(([yaw, lab], i) => {
      const x = 230 + i * 330;
      drawConcept(R, name, { x, y: 420, scale: 250, yaw, shell: i === 1 ? COL.pearl : shell, call: 1 });
      label(R, lab, x, 1040, { size: 14, align: 'center', col: COL.faint });
    });
    // crowd patch: small figures, mixed picks
    const x0 = 1440, y0 = 300;
    label(R, 'CROWD SCALE', 1650, 230, { size: 14, align: 'center', col: COL.faint });
    for (let row = 0; row < 5; row++) {
      const sc = 26 + row * 7;
      for (let col = 0; col < 7 - Math.floor(row / 2); col++) {
        const n = 7 - Math.floor(row / 2);
        const x = 1650 + (col - (n - 1) / 2) * sc * 1.55 + (row % 2) * sc * 0.4;
        const y = y0 + row * sc * 2.1 + row * row * 6;
        const pk = ((row * 7 + col * 3) % 5) < 2 ? -1 : 1;
        drawConcept(R, name, { x, y, scale: sc, yaw: (col - 3) * -0.12, call: pk, ss: 3, elev: 0.12 });
      }
    }
    return { stats: renderer().stats };
  },

  // All concepts side by side at three-quarter, then at mid and crowd scale.
  async concepts(R) {
    backdrop(R);
    const names = Object.keys(CONCEPT_INFO);
    names.forEach((n, i) => {
      const x = 170 + i * 316;
      drawConcept(R, n, { x, y: 300, scale: 205, yaw: 0.55, call: 1 });
      label(R, n, x, 70, { size: 26, align: 'center', col: COL.text, track: 6, font: '700 26px "Chakra Petch"' });
      for (let k = 0; k < 4; k++) drawConcept(R, n, { x: x - 99 + k * 66, y: 830, scale: 44, yaw: (k - 1.5) * 0.25, call: k % 2 ? -1 : 1, ss: 3 });
      for (let k = 0; k < 7; k++) drawConcept(R, n, { x: x - 111 + k * 37, y: 990, scale: 17, yaw: (k - 3.5) * 0.15, call: (k * 5) % 3 ? 1 : -1, ss: 4, elev: 0.15 });
    });
    return { stats: renderer().stats };
  },
};

