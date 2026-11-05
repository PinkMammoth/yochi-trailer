// The end card, paper: the ten starters faded behind, the Yochi seal stamping down like CALLED IT,
// YOCHI, the question, the URL and the no-wallet line.
import { M } from '../core/music.js';
import { clamp, E } from '../core/math.js';
import { PAPER, F, GRID_ORDER } from '../lib/brand.js';
import { paper, text, label, measure, stampK, impactK, riseK, splatter, CONTACT } from '../lib/draw.js';
import { drawCard } from '../lib/cast.js';

export const LOGO = {};

export function endShot(t, R, P) {
  const { b, VW, VH } = R;
  const dt = t - M.END;
  paper(R);
  const [ix, iy] = impactK(dt, 1);
  b.save(); b.translate(ix, iy);
  // the cast, small and faded
  const cw = R.TALL ? 180 : 230, gap = 26, x0 = (VW - (5 * cw + 4 * gap)) / 2, y0 = (VH - (2 * cw * 4 / 3 + gap)) / 2;
  GRID_ORDER.forEach((id, i) => drawCard(b, id, x0 + (i % 5) * (cw + gap), y0 + Math.floor(i / 5) * (cw * 4 / 3 + gap), cw, { a: 0.13 }));
  b.fillStyle = 'rgba(242,236,224,0.35)'; b.fillRect(0, 0, VW, VH);
  // lockup: seal + YOCHI
  const cy = R.TALL ? 470 : 400;
  const ws = R.TALL ? 150 : 170, ss = R.TALL ? 190 : 210;
  const ww = measure(b, 'YOCHI', F.dela(ws), 4);
  const lx = (VW - (ss + 40 + ww)) / 2;
  const k = stampK(dt + CONTACT, -6);
  b.save(); b.translate(lx + ss / 2, cy); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s); b.globalAlpha = k.a;
  b.drawImage(LOGO.sealPaper, -ss / 2, -ss / 2, ss, ss);
  b.restore();
  if (dt > 0) splatter(b, lx + ss / 2, cy, ss, PAPER.red, 31, clamp(dt / 0.05));
  const wa = clamp((dt - 0.05) / 0.25);
  text(b, 'YOCHI', lx + ss + 40, cy + ws * 0.36, { font: F.dela(ws), color: PAPER.ink, track: 4, alpha: wa });
  const r1 = riseK(dt - 0.42), r2 = riseK(dt - 0.84), r3 = riseK(dt - 1.05);
  text(b, 'Which one are you?', VW / 2, cy + (R.TALL ? 250 : 235) + r1.y, { font: F.dela(R.TALL ? 74 : 84), color: PAPER.ink, align: 'center', alpha: r1.a });
  text(b, 'yochigg.xyz', VW / 2, cy + (R.TALL ? 380 : 365) + r2.y, { font: F.mono(R.TALL ? 70 : 76, 800), color: PAPER.redText, align: 'center', alpha: r2.a });
  label(b, 'NEXT CANDLE · YOUR CALL', VW / 2, cy + (R.TALL ? 455 : 442) + r3.y, { size: 36, color: PAPER.ink, align: 'center', alpha: r3.a });
  b.restore();
}
