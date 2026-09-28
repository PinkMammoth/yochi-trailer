// Master character sheet: the whole design on one page.
import { renderer } from '../../src/character/renderer.js';
import { drawCompetitor, CAST, SHELLS, YOCHI, solve, face } from '../../src/character/index.js';
import { HEAD_BUST, HEAD_BOX } from '../../src/character/head.glsl.js';
import { rgba } from '../../src/core/math.js';
import { label, rule, COL, LIGHT } from './lib.js';

function callout(R, from, to, text, align = 'left') {
  const { b } = R;
  b.strokeStyle = 'rgba(168,162,200,0.55)'; b.lineWidth = 1;
  b.beginPath(); b.moveTo(from[0], from[1]); b.lineTo(to[0], to[1]); b.lineTo(to[0] + (align === 'left' ? 16 : -16), to[1]); b.stroke();
  b.fillStyle = 'rgba(245,243,255,0.9)'; b.beginPath(); b.arc(from[0], from[1], 2.6, 0, Math.PI * 2); b.fill();
  label(R, text, to[0] + (align === 'left' ? 22 : -22), to[1] + 5, { size: 13, col: COL.muted, track: 1.2, align, font: '500 13px "Chakra Petch"' });
}
function head(R, o) {
  return renderer().draw(R, { model: HEAD_BUST, box: HEAD_BOX, anchor: [0, 0, 0], ss: 2, elev: 0.04, fov: 0.2, lights: LIGHT.studio,
    shell: SHELLS.pearl, accent: YOCHI.cyan, suit: [22, 21, 32], ...o });
}

export const MASTER = {
  async master(R, P) {
    const { b } = R;
    const bg = b.createRadialGradient(560, 560, 30, 700, 560, 1300);
    bg.addColorStop(0, '#1b1932'); bg.addColorStop(1, '#07060c');
    b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
    label(R, 'THE CALLER', 56, 74, { size: 40, col: COL.text, track: 8, font: '700 40px "Chakra Petch"' });
    label(R, 'YOCHI COMPETITOR  ·  MASTER DESIGN', 58, 104, { size: 14, col: COL.cyan, track: 4 });

    // ---- hero figure with callouts (all in the gutter to its right) -----------------------------
    const pose = 'neutral', yaw = 0.42, x = 330, y = 1010, scale = 136;
    const rig = solve(pose);
    const r = drawCompetitor(R, { x, y, scale, yaw, elev: 0.04, pose, cast: CAST.you, call: 1, lights: LIGHT.studio, ss: 2 });
    const P2 = (pt) => r.cam.project(pt);
    const L = [
      [rig.joint('head', [0.0, 0.97, 0.12]), 150, 'twin crown stripes: the Y\u2019s double stroke'],
      [rig.joint('head', [0.1, 0.95, -0.25]), 196, 'lacquer hood: a cut gem, chamfered at 30\u00b0'],
      [rig.joint('head', [0.3, 0.58, 0.06]), 242, 'seam at the logo\u2019s 30\u00b0: a V over the brow'],
      [rig.joint('head', [0.06, 0.52, 0.38]), 288, 'one black-glass face: the call, in LEDs'],
      [rig.joint('head', [0.34, 0.47, 0.14]), 334, 'cheek status slit and taillight: the pick'],
      [rig.joint('chest', [0, 0.95, 0.16]), 392, 'gunmetal collar: a light ring where the helmet docks'],
      [rig.joint('uarmL', [0.06, 0.02, 0.02]), 440, 'faceted pauldrons: the harness anchors'],
      [rig.joint('chest', [0.0, 0.34, 0.27]), 488, 'Y-harness; the hex knot wears the pick'],
      [rig.joint('pelvis', [0.0, 0.27, 0.23]), 560, 'belt: the Y\u2019s stem ends at the buckle'],
      [rig.joint('thighL', [0.12, -0.7, 0.12]), 660, 'satin suit, dark-lacquer tonal panels'],
      [rig.joint('footL', [0.0, -0.1, 0.3]), 960, 'sneakers: lacquer upper, lit midsole'],
    ];
    for (const [pt, ly, text] of L) { const s2 = P2(pt); callout(R, [s2[0], s2[1]], [600, ly], text, 'left'); }

    // ---- turnaround + proportion ruler ----------------------------------------------------------
    const ty = 1010, ts = 112, rx = 1000;
    rule(R, 1000, 1510, 150, COL.faint, 0.25);
    label(R, 'TURNAROUND', 1000, 140, { size: 13, col: COL.cyan, track: 4 });
    [[0, 1128], [Math.PI / 2, 1282], [Math.PI, 1432]].forEach(([yw, xx]) => drawCompetitor(R, { x: xx, y: ty, scale: ts, yaw: yw, elev: 0.02, fov: 0.1, cast: CAST.you, call: 1, lights: LIGHT.studio, ss: 2 }));
    for (let k = 0; k <= 6; k++) {
      const yy = ty - k * ts;
      b.fillStyle = 'rgba(141,135,176,0.5)'; b.fillRect(rx, yy, k % 6 === 0 ? 24 : 12, 1);
      if (k) label(R, String(k), rx + 30, yy + 5, { size: 11, col: COL.faint, track: 0 });
    }
    b.fillStyle = 'rgba(141,135,176,0.35)'; b.fillRect(rx, ty - ts * 6.06, 1, ts * 6.06);
    label(R, '6.1 HEADS TALL', rx, ty - ts * 6.06 - 14, { size: 11, col: COL.faint, track: 1 });

    // ---- visor states -------------------------------------------------------------------------------
    label(R, 'VISOR', 1560, 140, { size: 13, col: COL.cyan, track: 4 });
    rule(R, 1560, 1880, 150, COL.faint, 0.25);
    const vs = [['up', COL.green, 'UP'], ['down', COL.red, 'DOWN'], ['watch', COL.text, 'WATCH'], ['smug', COL.red, 'SMUG'], ['win', COL.green, 'WIN'], ['out', COL.red, 'OUT']];
    vs.forEach(([gl, c, lab], i) => {
      const hx = 1612 + (i % 3) * 110, hy = 225 + Math.floor(i / 3) * 150;
      head(R, { x: hx, y: hy, scale: 92, yaw: 0.1, face: face(gl, c), pick: c });
      label(R, lab, hx, hy + 82, { size: 11, col: COL.faint, align: 'center', track: 2 });
    });
    // ---- crest modules ---------------------------------------------------------------------------------
    label(R, 'CREST MODULES', 1560, 555, { size: 13, col: COL.cyan, track: 4 });
    rule(R, 1560, 1880, 565, COL.faint, 0.25);
    const cr = [['rival', 'BEAR'], ['deano', 'BULL'], ['soup', 'ANTENNA'], ['oxtom', 'FROG'], ['cope', 'CAT'], ['finn', 'FIN']];
    cr.forEach(([k, lab], i) => {
      const c = CAST[k];
      const hx = 1612 + (i % 3) * 110, hy = 650 + Math.floor(i / 3) * 150;
      head(R, { x: hx, y: hy + 12, scale: 72, yaw: 0.45, shell: c.shell, accent: c.accent, crest: c.crest, face: face('watch', c.accent), pick: c.accent,
        box: [[-0.64, -0.78, -0.66], [0.64, 1.0, 0.5]] });
      label(R, lab, hx, hy + 78, { size: 11, col: COL.faint, align: 'center', track: 2 });
    });
    // ---- palette ---------------------------------------------------------------------------------------
    const sw = [['PEARL', SHELLS.pearl], ['SLATE', SHELLS.slate], ['OBSIDIAN', SHELLS.obsidian], ['SUIT', [22, 21, 32]], ['CYAN', YOCHI.cyan], ['UP', YOCHI.green], ['DOWN', YOCHI.red], ['RANK', YOCHI.gold]];
    sw.forEach(([n, c], i) => {
      const sx = 1560 + (i % 4) * 82, sy = 960 + Math.floor(i / 4) * 52;
      b.fillStyle = rgba(c); b.fillRect(sx, sy - 22, 24, 24);
      b.strokeStyle = 'rgba(245,243,255,0.25)'; b.strokeRect(sx + 0.5, sy - 21.5, 23, 23);
      label(R, n, sx + 30, sy - 5, { size: 10, col: COL.faint, track: 1 });
    });
    P.vignette = 0.45;
    return { stats: renderer().stats };
  },
};
