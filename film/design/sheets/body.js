import { renderer } from '../../src/character/renderer.js';
import { drawCompetitor, CAST } from '../../src/character/index.js';
import { backdrop, label, rule, COL, LIGHT } from './lib.js';

export { CAST };
// design-sheet wrapper: studio lighting by default, anchorAt kept for older sheets
export function drawCaller(R, o) {
  const { anchorAt, ...rest } = o;
  return drawCompetitor(R, { lights: LIGHT.studio, ...(anchorAt ? { anchor: anchorAt } : {}), ...rest });
}

export const BODIES = {
  async body(R, P, variant) {
    backdrop(R, { cx: 960, cy: 560 });
    const cast = variant === 'crowd' ? CAST.crowd : variant === 'rival' ? CAST.rival : CAST.you;
    const views = [[0, 'FRONT'], [0.62, 'THREE-QUARTER'], [Math.PI / 2, 'SIDE'], [Math.PI, 'BACK']];
    views.forEach(([yaw, lab], i) => {
      const x = 270 + i * 460;
      drawCaller(R, { x, y: 1010, scale: 146, yaw, cast, call: 1, anchor: [0, 0, 0] });
      label(R, lab, x, 1060, { size: 14, align: 'center', col: COL.faint });
    });
    return { stats: renderer().stats };
  },
  async poses(R) {
    backdrop(R, { cx: 960, cy: 560 });
    const set = [['neutral', 0, 0.35], ['callUp', 1, 0.3], ['callDown', -1, -0.3], ['ready', 1, 0.2], ['victory', 1, 0.0], ['smug', 0, -0.4], ['slump', -1, 0.3]];
    set.forEach(([pose, call, yaw], i) => {
      const x = 150 + i * 270;
      drawCaller(R, { x, y: 1000, scale: 120, yaw, pose, call, glyph: pose === 'slump' ? 'down' : undefined });
      label(R, pose.toUpperCase(), x, 1050, { size: 14, align: 'center', col: COL.faint });
    });
    return { stats: renderer().stats };
  },
};

BODIES.closeup = async (R, P, variant) => {
  backdrop(R, { cx: 960, cy: 400 });
  const cast = variant === 'crowd' ? CAST.crowd : variant === 'rival' ? CAST.rival : CAST.you;
  // hero framing: waist up, three views
  [[0.0, 380], [0.55, 960], [1.25, 1540]].forEach(([yaw, x]) => {
    drawCaller(R, { x, y: 2060, scale: 330, yaw, cast, call: 1, elev: 0.02, clip: [x - 330, 0, x + 330, 1080] });
  });
  return { stats: renderer().stats };
};

BODIES.cast = async (R) => {
  backdrop(R, { cx: 960, cy: 620, inner: '#1c1a34' });
  const lineup = [
    ['you', 'neutral', 'up', COL.green, 0.25],
    ['rival', 'smug', 'smug', COL.red, -0.3],
    ['deano', 'callUp', 'up', COL.green, 0.15],
    ['soup', 'neutral', 'nervous', COL.gold, 0.2],
    ['oxtom', 'callDown', 'down', COL.red, -0.2],
    ['cope', 'neutral', 'watch', COL.text, -0.25],
    ['finn', 'neutral', 'down', COL.red, 0.3],
  ];
  lineup.forEach(([k, pose, glyph, led, yaw], i) => {
    const x = 150 + i * 270;
    drawCaller(R, { x, y: 1000, scale: 128, yaw, pose, cast: CAST[k], glyph, led, pick: led });
    label(R, CAST[k].name, x, 1052, { size: 15, align: 'center', col: CAST[k].accent, track: 3 });
  });
  return { stats: renderer().stats };
};
