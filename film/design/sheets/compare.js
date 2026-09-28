// Before / after: the film's current characters (drawn by the film's own code) beside the new design.
import { renderer } from '../../src/character/renderer.js';
import { drawHelmet, RGB } from '../../src/elements/helmet.js';
import { drawPlayer } from '../../src/elements/body.js';
import { CAST as OLD_CAST, PEARL } from '../../src/acts/common.js';
import { drawCompetitor, CAST } from '../../src/character/index.js';
import { label, COL, LIGHT } from './lib.js';

function halves(R, title) {
  const { b } = R;
  for (const [x0, inner] of [[0, '#15132a'], [960, '#1a1832']]) {
    const bg = b.createRadialGradient(x0 + 480, 520, 30, x0 + 480, 520, 800);
    bg.addColorStop(0, inner); bg.addColorStop(1, '#07060c');
    b.fillStyle = bg; b.fillRect(x0, 0, 960, 1080);
  }
  b.fillStyle = 'rgba(141,135,176,0.3)'; b.fillRect(959, 60, 2, 960);
  label(R, 'BEFORE', 60, 80, { size: 26, col: COL.muted, track: 8, font: '700 26px "Chakra Petch"' });
  label(R, 'AFTER', 1020, 80, { size: 26, col: COL.text, track: 8, font: '700 26px "Chakra Petch"' });
  if (title) label(R, title, 1860, 80, { size: 15, col: COL.faint, align: 'right', track: 3 });
}
const oldKey = { x: -0.6, y: -0.5, col: [190, 225, 255], k: 0.6 }, oldRim = { x: 0.85, y: -0.45, col: RGB.cyan, k: 1.0 };

export const COMPARE = {
  // hero framing: YOU and the rival, busts
  async compareHero(R) {
    halves(R, 'HERO FRAMING');
    drawHelmet(R, { x: 290, y: 420, s: 150, type: 'dome', shell: PEARL, accent: COL.cyan, stripes: 'y', face: { eyes: 'up' }, led: RGB.green, yaw: 0.25, body: 'bust', status: RGB.green, key: oldKey, rim: oldRim });
    drawHelmet(R, { x: 680, y: 420, s: 150, type: 'bear', shell: OLD_CAST.exit.shell, accent: COL.red, stripes: 'one', face: { eyeL: 'smugR', eyeR: 'smugR', mouth: 'smirk' }, led: RGB.red, yaw: -0.25, body: 'bust', status: RGB.red, key: oldKey, rim: { ...oldRim, x: -0.85, col: RGB.red } });
    drawCompetitor(R, { x: 1250, y: 470, scale: 300, anchor: 'head', yaw: 0.35, elev: 0.03, cast: CAST.you, call: 1, lights: LIGHT.studio, clip: [960, 90, 1480, 1080] });
    drawCompetitor(R, { x: 1650, y: 470, scale: 300, anchor: 'head', yaw: -0.35, elev: 0.03, cast: CAST.rival, glyph: 'smug', led: COL.red, pick: COL.red, pose: 'smug', clip: [1440, 90, 1920, 1080],
      lights: { ...LIGHT.studio, rim: { x: -0.85, y: -0.45, z: -0.55, col: COL.red, k: 1.0 } } });
    return { stats: renderer().stats };
  },
  // full figures at the same height on screen
  async compareBody(R) {
    halves(R, 'FULL FIGURE');
    const poses = [['idle', 'up', RGB.green], ['cheer', 'dollar', RGB.green], ['point', 'down', RGB.red]];
    // keep the old figures (and the rival's pointing arm) inside the BEFORE half
    for (const c of [R.b, R.g]) { c.save(); c.beginPath(); c.rect(0, 0, 956, 1080); c.clip(); }
    poses.forEach(([p, e, led], i) => {
      drawPlayer(R, { x: 170 + i * 300, y: 980, s: 132, pose: p, cast: i === 2 ? OLD_CAST.exit : OLD_CAST.you, face: { eyes: e, mouth: e === 'dollar' ? 'grin' : undefined }, led, yaw: 0.15, key: oldKey, rim: oldRim });
    });
    for (const c of [R.b, R.g]) c.restore();
    const neu = [['neutral', 1, 'you', 0.3], ['victory', 1, 'you', 0.0], ['callDown', -1, 'rival', -0.3]];
    neu.forEach(([p, call, k, yaw], i) => {
      drawCompetitor(R, { x: 1130 + i * 300, y: 980, scale: 140, pose: p, cast: CAST[k], call, yaw, lights: LIGHT.studio, glyph: k === 'rival' ? 'down' : undefined });
    });
    return { stats: renderer().stats };
  },
};
