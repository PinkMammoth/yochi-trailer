// Sheets 2 and 3: the foresight beat. A ghost stroke draws the future, the loaded brush follows it
// exactly, the candle closes in colour, and the money lands.
import { makeStroke, drawStroke, drawGhost, samplePath, strokeU, CYAN, WHITE, GREEN, RED } from '../ink/brush.js';
import { E, clamp, shake, keys } from '../core/math.js';
import { cam, label, wipeLabel, measure } from './common.js';
import { strikeY, makeStrike, pricePts } from './sheet1.js';

// cfg: { dir: 1 (UP) | -1 (DOWN), T: { start, ghost, pick, follow, close, pay }, kicker, amount, seed }
export function foresight(R, cfg) {
  const V = R.vertical;
  const { dir, T } = cfg;
  // the line sits low when the future is UP and high when it is DOWN, so the move gets the room
  const y = strikeY(R) + dir * (V ? 110 : 100);
  const strike = makeStrike(R, { y, t0: T.start - 3, t1: T.start - 2.5, splatter: null });
  // the price so far, already on the paper
  const H = V ? [450, y + dir * 24] : [780, y + dir * 26];
  const past = makeStroke({ pts: pricePts(V ? 70 : 130, y, H[0], H[1], 8, V ? 44 : 48, cfg.seed), width: V ? 10 : 11, prof: 'even',
    seed: cfg.seed, wet: 0.7, dry: 0.1, hot: 0, col: WHITE, t0: T.start - 3, t1: T.start - 2 });
  // the future: where the price is going
  const end = V ? [800, y - dir * 430] : [1440, y - dir * 330];
  const gPts = V
    ? [H, [H[0] + 90, H[1] + dir * 34], [H[0] + 180, H[1] - dir * 50], [H[0] + 270, H[1] - dir * 230], end]
    : [H, [H[0] + 150, H[1] + dir * 36], [H[0] + 330, H[1] - dir * 60], [H[0] + 500, H[1] - dir * 220], end];
  const gsmp = samplePath(gPts);
  // the loaded brush follows the ghost exactly: the same samples
  const follow = makeStroke({ samples: samplePath(gPts), width: V ? 14 : 16, col: WHITE, prof: [[0, 0.7], [0.05, 1], [0.85, 1.15], [1, 0.9]], seed: cfg.seed + 1,
    t0: T.follow[0], t1: T.follow[1], ease: E.inQuad, dry: 0.55, wet: 0.5, hot: 0, reach: 3000,
    splatter: { amount: 0.5, size: 0.5, spread: 0.6 } });
  // the candle closes: a bold stroke from the strike to the close, in the colour of the result
  const cx = V ? 940 : 1590;
  const cy1 = end[1] + (V ? 0 : 0);
  const candle = makeStroke({
    pts: dir > 0 ? [[cx - 4, y + 14], [cx - 1, (y + cy1) / 2], [cx + 3, cy1 + 10], [cx + 6, cy1 - 26]]
      : [[cx + 4, y - 14], [cx, (y + cy1) / 2], [cx - 3, cy1]],
    width: V ? 70 : 78,
    // UP: pressed down at the line and swept up and off; DOWN: pressed at the line and dragged down to a heavy stop
    prof: dir > 0 ? [[0, 0.55], [0.06, 1.15], [0.2, 1.02], [0.7, 0.96], [0.9, 0.8], [1, 0.3]] : [[0, 0.6], [0.06, 1.12], [0.7, 1.0], [0.92, 1.12], [1, 0.6]],
    seed: cfg.seed + 2, col: dir > 0 ? GREEN : RED, hot: 0.22, dry: 0.65, wet: 0.5, reach: 2400,
    t0: T.close - 0.075, t1: T.close + 0.04, ease: E.outCubic,
    splatter: { amount: 1.0, size: 0.6, spread: 0.7, impact: 12, boost: 1.2 },
    drips: dir < 0 ? { n: 7, len: V ? 300 : 230, width: 10, delay: 0.12, dur: 1.4, from: 0.55, to: 1 } : null,
  });
  // payout
  const ps = V ? 88 : 84;
  const text = `+${cfg.amount.toFixed(2)} USDC`;
  const tw = measure(R, text, ps, 700);
  const px = V ? R.VW / 2 - tw / 2 : Math.min(R.VW - 90 - tw, cx - tw / 2);
  const py = dir > 0 ? y + (V ? 200 : 170) : y - (V ? 140 : 120);
  const under = makeStroke({ pts: [[px - 14, py + 26], [px + tw * 0.5, py + 22], [px + tw + 18, py + 25]], width: 9, prof: 'harai', seed: cfg.seed + 3,
    col: GREEN, hot: 0.2, dry: 0.6, wet: 0.4, t0: T.pay + 0.12, t1: T.pay + 0.38, ease: E.outCubic });
  const pickXY = dir > 0 ? [end[0] - 34, end[1] - 26] : [end[0] - 34, end[1] + 26 + 52];

  const sheet = {
    strokes: [strike, past, follow, candle, under],
    draw(t, P, o = {}) {
      const f = o.fade ?? 1;     // the gather lifts this sheet's ink away
      const u0 = o.u0 ?? 0;      // ...pulling each stroke in from its start
      const tf = o.textFade ?? 1;
      // camera: a slow lean toward the future, a jolt on the close
      const lean = E.inOutSine(clamp((t - T.start) / (T.close - T.start)));
      const [sx, sy] = shake(t, T.close, 12, 0.3, 22, cfg.seed);
      cam(R, R.VW / 2 + lean * (V ? 10 : 30), R.VH / 2 - dir * lean * 10, 1 + 0.04 * lean, sx, sy);
      drawStroke(R, strike, t, { fade: f, u0 });
      drawStroke(R, past, t, { fade: f, u0 });
      // the ghost
      const gu = E.outCubic(clamp((t - T.ghost[0]) / (T.ghost[1] - T.ghost[0])));
      const fu = strokeU(follow, t);
      if (gu > 0) {
        const breathe = 0.82 + 0.18 * Math.sin((t - T.ghost[1]) * 6.5);
        drawGhost(R, gsmp, Math.max(0, fu - 0.004), gu, { alpha: (t > T.ghost[1] ? breathe : 1) * f, tip: true });
      }
      drawStroke(R, follow, t, { fade: f, u0 });
      // the pick: UP or DOWN, marked at the ghost's tip
      const pu = clamp((t - T.pick) / 0.35);
      if (pu > 0) wipeLabel(R, dir > 0 ? 'UP' : 'DOWN', pickXY[0], pickXY[1], pu, { size: V ? 68 : 70, weight: 700, align: 'right', col: WHITE, a: 0.95 * tf * (1 - 0.35 * clamp((t - T.close) / 0.3)) });
      drawStroke(R, candle, t, { fade: f, u0 });
      // kicker
      const ku = clamp((t - T.start - 0.1) / 0.5);
      if (ku > 0) wipeLabel(R, cfg.kicker, V ? 70 : 120, V ? 170 : 140, ku, { size: V ? 44 : 48, weight: 500, col: CYAN, a: 0.9 * tf, track: 0.1 });
      // payout, counting up
      const cu = clamp((t - T.pay) / 0.4);
      if (cu > 0) {
        const v = cfg.amount * E.outCubic(cu);
        label(R, `+${v.toFixed(2)} USDC`, px, py, { size: ps, weight: 700, col: GREEN, a: tf * clamp(cu * 4), glow: 0.35 });
        drawStroke(R, under, t, { fade: tf });
      }
    },
  };
  return sheet;
}
