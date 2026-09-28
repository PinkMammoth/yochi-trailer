// Poster and profile-image tests: does the character hold up alone?
import { renderer } from '../../src/character/renderer.js';
import { rgba } from '../../src/core/math.js';
import { drawCaller, CAST } from './body.js';
import { solve, HEAD_OFS } from '../../src/character/index.js';
import { label, COL } from './lib.js';

function stage(R, o = {}) {
  const { b, g } = R;
  const bg = b.createLinearGradient(0, 0, 0, 1080);
  bg.addColorStop(0, '#06050b'); bg.addColorStop(0.62, '#0e0c1c'); bg.addColorStop(1, '#07060c');
  b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
  const fy = o.floor ?? 900, cx = o.cx ?? 960;
  // floor glow and the strike line
  const fg = b.createRadialGradient(cx, fy, 10, cx, fy, 700);
  fg.addColorStop(0, rgba(o.glow || COL.cyan, 0.16)); fg.addColorStop(1, 'rgba(0,0,0,0)');
  b.save(); b.translate(cx, fy); b.scale(1, 0.18); b.translate(-cx, -fy); b.fillStyle = fg; b.fillRect(0, fy - 700, 1920, 1400); b.restore();
  for (let x = 40; x < 1880; x += 34) { b.fillStyle = rgba(COL.cyan, 0.55); b.fillRect(x, fy, 20, 2); g.fillStyle = rgba(COL.cyan, 0.35); g.fillRect(x, fy - 1, 20, 4); }
}
function tag(R, text, x, y, col) {
  const { b, g } = R;
  b.save(); b.font = '600 22px "Chakra Petch"'; b.letterSpacing = '3px';
  const w = b.measureText(text).width + 30, h = 36, c = 8;
  const path = (ctx) => { ctx.beginPath(); ctx.moveTo(x - w / 2 + c, y - h / 2); ctx.lineTo(x + w / 2, y - h / 2); ctx.lineTo(x + w / 2, y + h / 2 - c); ctx.lineTo(x + w / 2 - c, y + h / 2); ctx.lineTo(x - w / 2, y + h / 2); ctx.lineTo(x - w / 2, y - h / 2 + c); ctx.closePath(); };
  b.fillStyle = 'rgba(7,6,12,0.75)'; path(b); b.fill();
  b.strokeStyle = rgba(col, 0.9); b.lineWidth = 2; path(b); b.stroke();
  g.strokeStyle = rgba(col, 0.5); g.lineWidth = 3; path(g); g.stroke();
  b.fillStyle = rgba(col); b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillText(text, x + 1.5, y + 1);
  b.restore();
}

export const POSTER = {
  async poster(R, P, which) {
    const rival = which === 'rival';
    const floor = 1040;
    stage(R, { floor, glow: rival ? COL.red : COL.cyan });
    const cast = rival ? CAST.rival : CAST.you;
    const pose = rival ? 'smug' : 'victory';
    const lights = {
      key: { x: rival ? 0.5 : -0.62, y: -0.5, z: 0.45, col: [205, 228, 255], k: 1.0 },
      rim: { x: rival ? -0.85 : 0.85, y: -0.4, z: -0.6, col: rival ? COL.red : COL.cyan, k: 1.15 },
      rim2: { x: rival ? 0.9 : -0.9, y: 0.2, z: -0.5, col: rival ? [255, 60, 90] : [57, 255, 20], k: 0.55 },
      fill: { x: 0, y: 1, z: 0.4, col: rival ? [70, 20, 40] : [20, 60, 60], k: 1.0 },
      amb: [16, 14, 30],
    };
    const r = drawCaller(R, {
      x: 960, y: floor, scale: rival ? 146 : 128, yaw: rival ? -0.42 : 0.3, elev: -0.14, fov: 0.42, pose,
      cast, glyph: rival ? 'smug' : 'up', led: rival ? COL.red : COL.green, pick: rival ? COL.red : COL.green, lights,
      mirror: { y: floor, alpha: 0.18 },
    });
    // the name tag sits beside the head, the way the film tags players
    const hp = r ? r.cam.project(solve(pose).joint('head', [0, HEAD_OFS, 0])) : [960, 300];
    // YOU: inside the Y the raised arms make; the rival: beside the head
    tag(R, rival ? 'EXIT_LIQUIDITY' : 'YOU', rival ? hp[0] - 250 : hp[0], rival ? hp[1] - 40 : hp[1] - 140, rival ? COL.red : COL.cyan);
    P.vignette = 0.7;
    return { stats: renderer().stats };
  },
  // square profile image, as an avatar would be cropped
  async pfp(R, P, which) {
    const { b } = R;
    b.fillStyle = '#07060c'; b.fillRect(0, 0, 1920, 1080);
    const sets = [['you', 'up', COL.green, 0.4], ['rival', 'smug', COL.red, -0.4], ['deano', 'focus', COL.gold, 0.35], ['soup', 'nervous', COL.gold, -0.3]];
    sets.forEach(([k, glyph, led, yaw], i) => {
      const x0 = 30 + i * 470, y0 = 300, S = 440;
      const bg = b.createRadialGradient(x0 + S / 2, y0 + S * 0.42, 10, x0 + S / 2, y0 + S / 2, S * 0.75);
      bg.addColorStop(0, '#1d1a36'); bg.addColorStop(1, '#09080f');
      b.fillStyle = bg; b.fillRect(x0, y0, S, S);
      drawCaller(R, { x: x0 + S / 2, y: y0 + S * 0.47, scale: 205, yaw, elev: 0.02, cast: CAST[k], glyph, led, pick: led, anchorAt: 'head', clip: [x0, y0, x0 + S, y0 + S], ss: 2 });
      b.strokeStyle = rgba(CAST[k].accent, 0.5); b.lineWidth = 2; b.strokeRect(x0 + 1, y0 + 1, S - 2, S - 2);
      label(R, CAST[k].name, x0 + 14, y0 + S + 34, { size: 16, col: CAST[k].accent, track: 3 });
    });
    label(R, 'PROFILE IMAGE TEST', 30, 240, { size: 20, col: COL.muted, track: 5 });
    return { stats: renderer().stats };
  },
};
