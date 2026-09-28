// The visor language: every display state on the real helmet.
import { renderer } from '../../src/character/renderer.js';
import { face, commitGlyph, GRID_W, GRID_H, composeLayers } from '../../src/character/face.js';
import { HEAD_BUST as HEAD_ONLY, HEAD_BOX } from '../../src/character/head.glsl.js';
import { backdrop, label, rule, COL, LIGHT } from './lib.js';

function head(R, o) {
  const { glyph, led = COL.green, pick, ...rest } = o;
  const f = typeof glyph === 'function' ? composeLayers(GRID_W, GRID_H, [{ draw: glyph, col: led }]) : face(glyph, led);
  return renderer().draw(R, {
    model: HEAD_ONLY, box: HEAD_BOX, anchor: [0, 0, 0], ss: 2, elev: 0.04, fov: 0.2, lights: LIGHT.studio,
    shell: COL.pearl, accent: COL.cyan, suit: [22, 21, 32], pick: pick || led, face: f, ...rest,
  });
}

export const VISOR = {
  async visor(R) {
    backdrop(R, { cx: 960, cy: 520 });
    label(R, 'THE VISOR', 70, 80, { size: 34, col: COL.text, track: 6, font: '700 34px "Chakra Petch"' });
    label(R, 'CALL: one symbol that fills the face.   FACE: two lidded eyes for acting.   COMMIT: the eyes become a strike line, the line becomes the call.', 72, 112, { size: 16, col: COL.muted, track: 1, font: '500 16px "Chakra Petch"' });
    rule(R, 70, 1850, 132);
    const call = [['up', COL.green, 'UP'], ['down', COL.red, 'DOWN'], ['lock', COL.cyan, 'LOCKED'], ['win', COL.green, 'WIN'], ['out', COL.red, 'OUT'], ['flame', COL.gold, 'STREAK'], ['strike', COL.text, 'UNCOMMITTED']];
    call.forEach(([g, c, lab], i) => {
      const x = 160 + i * 266;
      head(R, { x, y: 290, scale: 190, yaw: 0.12, glyph: g, led: c, pick: c });
      label(R, lab, x, 440, { size: 13, align: 'center', col: COL.faint });
    });
    label(R, 'CALL', 70, 170, { size: 14, col: COL.cyan, track: 4 });
    const faces = [['watch', COL.text, 'WATCH'], ['focus', COL.cyan, 'FOCUS'], ['smug', COL.red, 'SMUG'], ['shock', COL.text, 'SHOCK'], ['happy', COL.cyan, 'HAPPY'], ['nervous', COL.gold, 'NERVOUS'], ['sad', COL.red, 'THE L'], ['cash', COL.green, 'PAID']];
    faces.forEach(([g, c, lab], i) => {
      const x = 140 + i * 234;
      head(R, { x, y: 610, scale: 170, yaw: -0.1, glyph: g, led: c, pick: COL.text, pickI: 0.35 });
      label(R, lab, x, 745, { size: 13, align: 'center', col: COL.faint });
    });
    label(R, 'FACE', 70, 490, { size: 14, col: COL.cyan, track: 4 });
    label(R, 'COMMIT', 70, 800, { size: 14, col: COL.cyan, track: 4 });
    const ts = [0, 0.18, 0.35, 0.5, 0.7, 1.0];
    ts.forEach((t, i) => {
      head(R, { x: 150 + i * 145, y: 930, scale: 115, yaw: 0, glyph: commitGlyph(1, t), led: t < 0.35 ? COL.text : COL.green, pick: t < 0.35 ? COL.text : COL.green, ss: 3 });
      head(R, { x: 1030 + i * 145, y: 930, scale: 115, yaw: 0, glyph: commitGlyph(-1, t), led: t < 0.35 ? COL.text : COL.red, pick: t < 0.35 ? COL.text : COL.red, ss: 3 });
    });
    label(R, 'WATCH  >  STRIKE LINE  >  UP', 520, 1045, { size: 13, align: 'center', col: COL.faint });
    label(R, 'WATCH  >  STRIKE LINE  >  DOWN', 1400, 1045, { size: 13, align: 'center', col: COL.faint });
    return { stats: renderer().stats };
  },
};
