// Silhouette test: the design as flat shapes. If it only works in colour, it doesn't work.
import { renderer } from '../../src/character/renderer.js';
import { drawCompetitor, CAST } from '../../src/character/index.js';
import { label, COL } from './lib.js';

export const SILHOUETTES = {
  async silhouette(R) {
    const { b } = R;
    b.fillStyle = '#0c0b14'; b.fillRect(0, 0, 1920, 1080);
    const S = '#define SILHOUETTE';
    label(R, 'SILHOUETTE', 60, 70, { size: 26, col: COL.text, track: 8, font: '700 26px "Chakra Petch"' });
    [[0, 'FRONT'], [0.62, 'THREE-QUARTER'], [Math.PI / 2, 'SIDE'], [Math.PI, 'BACK']].forEach(([yaw, lab], i) => {
      const x = 130 + i * 205;
      drawCompetitor(R, { x, y: 640, scale: 88, yaw, cast: CAST.you, defines: S, fov: 0.1 });
      label(R, lab, x, 680, { size: 12, col: COL.faint, align: 'center', track: 2 });
    });
    const poses = ['callUp', 'callDown', 'ready', 'victory', 'smug', 'slump'];
    poses.forEach((p, i) => {
      const x = 1000 + i * 150;
      drawCompetitor(R, { x, y: 640, scale: 74, yaw: [0.3, -0.3, 0.2, 0, -0.4, 0.3][i], pose: p, cast: CAST.you, defines: S, fov: 0.1 });
      label(R, p.toUpperCase(), x, 680, { size: 12, col: COL.faint, align: 'center', track: 2 });
    });
    const crests = ['you', 'rival', 'deano', 'soup', 'oxtom', 'cope', 'finn'];
    crests.forEach((k, i) => {
      const x = 180 + i * 260;
      drawCompetitor(R, { x, y: 960, scale: 150, anchor: 'head', yaw: 0.5, cast: CAST[k], defines: S, fov: 0.1, clip: [x - 130, 760, x + 130, 1080] });
      label(R, CAST[k].name, x, 1060, { size: 12, col: COL.faint, align: 'center', track: 2 });
    });
    // small: the silhouette at crowd size (full figures, ~70 px tall)
    for (let k = 0; k < 40; k++) drawCompetitor(R, { x: 60 + k * 46, y: 790, scale: 10 + (k % 3) * 1.5, yaw: (k % 7 - 3) * 0.3, cast: CAST[crests[k % 7]], defines: S, fov: 0.1, ss: 3 });
    label(R, 'CROWD SIZE', 60, 712, { size: 12, col: COL.faint, track: 2 });
    return { stats: renderer().stats };
  },
};
