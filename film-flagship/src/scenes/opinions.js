// FLAGSHIP, Act II "Conviction" (one bar): the cast's takes slam onto the paper and collide, a dry-brush strike line
// tears across the middle, the takes sort themselves UP and DOWN either side of it, and a drop of ink falls onto
// its vermilion node and floods the page into the duel. Borrowed from the OPINIONS concept, kept to one bar.
import { M, BEAT } from '../core/music.js';
import { clamp, lerp, E } from '../core/math.js';
import { PAPER, F } from '../lib/brand.js';
import { paper, text, measure, label } from '../lib/draw.js';
import { drawFace } from '../lib/cast.js';
import { inkFlood } from '../lib/ui.js';
import { makeStroke, drawStroke, headU } from '../lib/brush.js';

const LINE_Y = 540;
// Each take: its words, face, side, entry (in eighths of the bar), where it lands, where each later hit knocks it
// ([x, y, rot, scale] keyed by the hit's entry index), and where it sorts to after the strike line.
// FINAL EDIT: no takes. The same players lock their picks; the strike line sorts them. Face, handle, pick.
const TAKES = [
  { s: 'mamo', f: 'dela', px: 150, face: 'starter-perma-bull', up: true, you: true, ti: 0,
    land: [250, 500, -3, 1], knock: { 1: [120, 290, -6, 0.74], 2: [90, 240, -7, 0.68] }, fin: [150, 250, 104] },
  { s: 'exit_liquidity', f: 'dela', px: 150, face: 'starter-doomer', up: false, ti: 1,
    land: [420, 650, 2, 1], knock: { 2: [560, 830, 4, 0.8], 3: [640, 880, 5, 0.72] }, fin: [150, 720, 96] },
  { s: 'maxlev', f: 'dela', px: 132, face: 'starter-degenerate', up: true, ti: 2,
    land: [1060, 430, -4, 1], knock: { 3: [1260, 250, -8, 0.78] }, fin: [1050, 410, 76] },
  { s: 'fadethis', f: 'dela', px: 140, face: 'starter-contrarian', up: false, ti: 3,
    land: [470, 520, 1.5, 1], knock: {}, fin: [800, 880, 76] },
  { s: 'sunny', f: 'dela', px: 92, face: 'starter-lucky-fool', up: true, ti: 3, land: [1380, 770, 3, 1], knock: {}, fin: [150, 410, 76] },
  { s: 'jitters', f: 'dela', px: 80, face: 'starter-paper-hands', up: false, ti: 3.4, land: [200, 940, -2, 1], knock: {}, fin: [150, 880, 76] },
  { s: 'latecomer', f: 'dela', px: 84, face: 'starter-fomo-v2', up: true, ti: 3.2, land: [1460, 600, 2, 1], knock: {}, fin: [1050, 250, 80] },
  { s: '+ 17 MORE', f: 'mono', px: 40, up: true, ti: 3.6, land: [1500, 330, 0, 1], knock: {}, fin: [1600, 400, 30] },
  { s: '+ 9 MORE', f: 'mono', px: 40, up: false, ti: 3.7, land: [1450, 900, 0, 1], knock: {}, fin: [1450, 870, 30] },
];

let LINE = null;
const line = (R) => LINE || (LINE = makeStroke({ pts: [[70, LINE_Y + 6], [R.VW * 0.3, LINE_Y - 2], [R.VW * 0.7, LINE_Y + 3], [R.VW - 70, LINE_Y - 2]],
  width: 24, t0: M.STRIKE, dur: 0.18, seed: 7, bristles: 26, load: 1.7, dry: 0.6, lift: 0.18, splat: 7, ease: E.outQuart }));

const font = (k, px) => (k === 'dela' ? F.dela(px) : k === 'mono' ? F.mono(px, 800) : F.zen(px, 900));

export function opinionsShot(t, R, P) {
  const { b, VW, VH } = R;
  paper(R);
  const tStrike = M.STRIKE;
  // after the sort, a slow push towards the vermilion node, where the drop will land
  const zp = 1 + 0.1 * E.inOutSine(clamp((t - tStrike - 0.2) / 0.85));
  b.save(); b.translate(VW / 2, LINE_Y); b.scale(zp, zp); b.translate(-VW / 2, -LINE_Y);
  const sort = (i) => E.outExpo(clamp((t - tStrike - 0.04 - i * 0.025) / 0.3));
  TAKES.forEach((k, i) => {
    const te = M.OPIN + k.ti * (BEAT / 2);
    if (t < te) return;
    const dt = t - te;
    // the slam: from big to its landing size
    const sl = lerp(1.55, 1, E.outCubic(clamp(dt / 0.1)));
    let [x, y, rot, sc] = k.land;
    // knocked aside by the takes that land after it
    for (const [h, to] of Object.entries(k.knock)) {
      const th = M.OPIN + TAKES[+h].ti * (BEAT / 2);
      if (t < th) continue;
      const e = E.outBack(clamp((t - th) / 0.16), 1.8);
      x = lerp(x, to[0], e); y = lerp(y, to[1], e); rot = lerp(rot, to[2], e); sc = lerp(sc, to[3], e);
    }
    // sorting to its side of the line
    const so = sort(i);
    const size = lerp(k.px * sc, k.fin[2], so);
    x = lerp(x, k.fin[0], so); y = lerp(y, k.fin[1], so); rot = lerp(rot, 0, so);
    b.save();
    b.translate(x, y); b.rotate(rot * Math.PI / 180); b.scale(sl, sl);
    const col = k.f === 'mono' ? PAPER.muted : k.you ? PAPER.redText : PAPER.ink;
    let tx = 0;
    if (k.face) { drawFace(b, k.face, size * 0.34, -size * 0.34, size * 0.34); tx = size * 0.82; }
    text(b, k.s, tx, 0, { font: font(k.f, size), color: col });
    if (k.f !== 'mono') {
      // the pick: an arrow and UP / DOWN in mono, in the candle colours
      const px = tx + measure(b, k.s, font(k.f, size)) + size * 0.22, ps = size * 0.34, ay = -size * 0.3;
      b.fillStyle = k.up ? PAPER.up : PAPER.down; b.beginPath();
      if (k.up) { b.moveTo(px, ay + ps * 0.45); b.lineTo(px + ps, ay + ps * 0.45); b.lineTo(px + ps / 2, ay - ps * 0.45); }
      else { b.moveTo(px, ay - ps * 0.45); b.lineTo(px + ps, ay - ps * 0.45); b.lineTo(px + ps / 2, ay + ps * 0.45); }
      b.fill();
      text(b, k.up ? 'UP' : 'DOWN', px + ps * 1.25, 0, { font: F.mono(size * 0.42, 800), color: k.up ? PAPER.up : PAPER.down });
    }
    b.restore();
  });
  // the strike line: one dry-brush stroke, the vermilion node, UP and DOWN at its end
  const L = line(R);
  drawStroke(b, L, t);
  const hu = headU(L, t);
  if (hu > 0.5) {
    const na = clamp((hu - 0.5) / 0.1);
    b.save(); b.globalAlpha = na; b.fillStyle = PAPER.red; b.beginPath(); b.arc(VW / 2, LINE_Y, 13, 0, Math.PI * 2); b.fill(); b.restore();
  }
  if (t >= tStrike + 0.1) {
    const a = clamp((t - tStrike - 0.1) / 0.12);
    b.save(); b.globalAlpha = a; b.fillStyle = PAPER.ink; b.fillRect(110, LINE_Y + 24, 420, 40); b.restore();
    label(b, 'STRIKE 41.83 · NEXT CANDLE', 320, LINE_Y + 51, { size: 17, color: PAPER.bg, align: 'center', alpha: a });
    text(b, 'UP', VW - 80, LINE_Y - 30, { font: F.dela(76), color: PAPER.up, align: 'right', alpha: a });
    text(b, 'DOWN', VW - 80, LINE_Y + 96, { font: F.dela(76), color: PAPER.down, align: 'right', alpha: a });
  }
  // the drop falls onto the node and floods the page
  b.restore();
  inkFlood(b, R, VW / 2, LINE_Y, t, M.INK, { dur: 0.42, seed: 4 });
}
