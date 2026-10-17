// Sheet 1 (0 .. bar 4): the tear, calm, the held silence, sudden.
import { makeStroke, drawStroke, strokeU, CYAN, WHITE, css, inkColor } from '../ink/brush.js';
import { M } from '../core/music.js';
import { keys, E, noise1, clamp, shake, rngFrom } from '../core/math.js';
import { cam, label, wipeLabel, veil } from './common.js';

export const strikeY = (R) => (R.vertical ? 675 : 540);

// The strike line: one heavy horizontal stroke, laid down left to right.
export function makeStrike(R, o = {}) {
  const y = o.y ?? strikeY(R);
  const x0 = -140, x1 = R.VW + 140;
  const pts = [];
  for (let k = 0; k <= 8; k++) {
    const f = k / 8;
    pts.push([x0 + (x1 - x0) * f, y - Math.sin(f * Math.PI) * 5 + noise1(f * 5 + 3) * 3]);
  }
  return makeStroke({
    pts, width: R.vertical ? 30 : 34, prof: [[0, 0.5], [0.02, 1.15], [0.12, 1.0], [0.6, 0.86], [0.88, 0.72], [1, 0.3]],
    seed: 11, load: 1.0, dry: 0.55, reach: 6000, hot: 0.7, wet: 0.45, glow: 0.12,
    t0: M.TEAR_START, t1: M.TEAR_END, ease: (u) => E.inOutSine(u) * 0.35 + u * 0.65,
    splatter: { amount: 2.4, spread: 0.6, size: 0.32, impact: 22 }, startSkew: 0.9, bristles: 96,
    ...o,
  });
}

// A meandering price path from (x0, y0) to (x1, y1)
export function pricePts(x0, y0, x1, y1, n, amp, seed) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const wob = k === 0 || k === n ? 0 : noise1(seed + f * 4.3) * amp + noise1(seed * 2 + f * 11) * amp * 0.35;
    pts.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + wob]);
  }
  return pts;
}

export function sheet1(R) {
  const V = R.vertical;
  const y = strikeY(R);
  const rx = R.VW - (V ? 70 : 120);
  const clear = [[0, y - 130, 360, y - 8], [rx - 260, y - 140, R.VW, y - 8], [rx - 330, y + 8, R.VW, y + 150]];
  const strike = makeStrike(R, { splatter: { amount: 2.4, spread: 0.6, size: 0.32, impact: 22, avoid: clear } });  // laid down at frame 0
  // calm: a slow wet brush drifting out of the line
  const cx0 = V ? 110 : 250, cx1 = V ? 520 : 1080;
  const calmPts = pricePts(cx0, y, cx1, y + 30, 9, V ? 50 : 58, 4.2);
  const calm = makeStroke({ pts: calmPts, width: V ? 9 : 10, prof: 'even', seed: 21, load: 1, dry: 0.1, wet: 0.75, hot: 0, col: WHITE, reach: 4000,
    t0: M.CALM_BRUSH[0], t1: M.CALM_BRUSH[1], ease: (u) => u + 0.025 * Math.sin(u * 18.8), startSkew: 0.3 });
  const end = calm.smp[calm.smp.length - 1];
  // small marks where the brush dips on the taps
  const taps = M.TAPS.map((tt, i) => {
    const u = clamp((tt - M.CALM_BRUSH[0]) / (M.CALM_BRUSH[1] - M.CALM_BRUSH[0]));
    const p = calm.smp[Math.floor(u * (calm.smp.length - 1))];
    const up = i % 2 === 0 ? -1 : 1;
    const len = (V ? 34 : 40) + i * 8;
    return makeStroke({ pts: [[p.x + 18, p.y + up * 10], [p.x + 20, p.y + up * (10 + len)]], width: V ? 11 : 13, prof: 'dot', seed: 30 + i,
      t0: tt, t1: tt + 0.12, dry: 0.2, wet: 0.6, hot: 0, col: WHITE, ease: E.outCubic });
  });
  // sudden: rips down, then snaps up and out of frame
  const P0 = [end.x, end.y];
  const down = makeStroke({
    pts: V ? [P0, [P0[0] + 60, P0[1] + 120], [P0[0] + 130, P0[1] + 240], [P0[0] + 170, P0[1] + 262]]
      : [P0, [P0[0] + 90, P0[1] + 110], [P0[0] + 190, P0[1] + 215], [P0[0] + 250, P0[1] + 236]],
    width: V ? 36 : 40, prof: [[0, 0.3], [0.08, 0.9], [0.7, 1.05], [0.93, 1.2], [1, 0.7]], seed: 41, dry: 0.7, wet: 0.35, hot: 0, col: WHITE, reach: 2600,
    t0: M.SUDDEN, t1: M.SUDDEN + 0.18, ease: E.outQuad,
    splatter: { amount: 1.3, spread: 1.0, size: 0.7, impact: 28, boost: 1.3 },
    drips: { n: 6, len: V ? 210 : 170, width: 8, delay: 0.25, dur: 1.6, from: 0.4, to: 1 },
  });
  const B0 = down.smp[down.smp.length - 1];
  const upS = makeStroke({
    pts: V ? [[B0.x, B0.y], [B0.x + 80, B0.y - 200], [B0.x + 200, B0.y - 470], [B0.x + 330, B0.y - 700], [B0.x + 560, B0.y - 900]]
      : [[B0.x, B0.y], [B0.x + 120, B0.y - 170], [B0.x + 300, B0.y - 400], [B0.x + 520, B0.y - 560], [B0.x + 900, B0.y - 700]],
    width: V ? 46 : 52, prof: [[0, 0.8], [0.06, 1.2], [0.5, 1.0], [1, 0.75]], seed: 43, dry: 1.0, wet: 0.25, hot: 0, col: WHITE, reach: 2400,
    t0: M.SUDDEN_2, t1: M.SUDDEN_2 + 0.24, ease: E.inQuad,
    splatter: { amount: 2.0, spread: 1.4, size: 0.85, impact: 20, boost: 1.4 },
  });
  const rest = [end.x, end.y];

  return (t, P) => {
    // camera: frame 0 sits close on the tearing stroke, then pulls back so it becomes a line
    const k = E.inOutCubic(clamp((t - M.PULLBACK[0]) / (M.PULLBACK[1] - M.PULLBACK[0])));
    const z0 = V ? 3.6 : 4.2, rot0 = V ? -0.24 : -0.17;
    const z = Math.exp(keys(k, [[0, Math.log(z0)], [1, 0]]));
    const rot = rot0 * (1 - k);
    // keep the head of the tear two thirds across at frame 0, the stroke tilted across the black
    const head0 = strike.smp[Math.floor(strokeU(strike, 0.012) * (strike.smp.length - 1))];
    // solve for the camera centre that puts the head at (ox, oy) from the screen centre
    const ox = (V ? 0.26 : 0.27) * R.VW, oy = (V ? -0.06 : -0.1) * R.VH;
    const ix = ox / z0, iy = oy / z0;
    const camX0 = head0.x - (ix * Math.cos(rot0) + iy * Math.sin(rot0));
    const camY0 = head0.y - (-ix * Math.sin(rot0) + iy * Math.cos(rot0));
    const cx = keys(k, [[0, camX0 + t * 30], [1, R.VW / 2]]);
    const cy = keys(k, [[0, camY0], [1, y]]);
    const [s1x, s1y] = shake(t, M.SUDDEN, 16, 0.3, 24, 1);
    const [s2x, s2y] = shake(t, M.SUDDEN_2, 22, 0.4, 20, 2);
    const [s0x, s0y] = shake(t, M.TEAR, 10, 0.25, 26, 3);
    const zz = z * (1 + 0.012 * clamp((t - M.CALM) / 6));
    cam(R, cx, cy, zz, s0x + s1x + s2x, s0y + s1y + s2y, rot);
    P.zoom = zz;

    drawStroke(R, strike, t);
    drawStroke(R, calm, t);
    for (const s of taps) drawStroke(R, s, t);
    // the held silence: the brush rests on the paper and trembles
    if (t >= M.CALM_BRUSH[1] && t < M.SUDDEN) {
      const tr = clamp((t - M.SILENCE_1[0]) / (M.SILENCE_1[1] - M.SILENCE_1[0]));
      const jx = noise1(t * 30) * 1.4 * tr, jy = noise1(t * 30 + 9) * 1.4 * tr;
      R.b.fillStyle = css(inkColor(WHITE, 0.85));
      R.b.beginPath(); R.b.ellipse(rest[0] + jx, rest[1] + jy, 7 + tr * 1.5, 8.5 + tr * 2, 0.4, 0, Math.PI * 2); R.b.fill();
      R.g.fillStyle = css(CYAN.map((v) => v * (0.35 + 0.3 * tr)));
      R.g.beginPath(); R.g.arc(rest[0] + jx, rest[1] + jy, 16, 0, Math.PI * 2); R.g.fill();
    }
    drawStroke(R, down, t);
    drawStroke(R, upS, t);
    // the impact frames: a breath of exposure on the hits
    P.exposure *= 1 + 0.25 * Math.exp(-Math.max(0, t - M.SUDDEN_2) / 0.12) * (t >= M.SUDDEN_2 ? 1 : 0);
    // labels: the first words of the film
    const lu = clamp((t - M.LABELS) / 0.6);
    if (lu > 0) {
      const ls = V ? 66 : 70;
      const rx = R.VW - (V ? 70 : 120);
      wipeLabel(R, 'UP', rx, y - (V ? 64 : 62), lu, { size: ls, weight: 700, align: 'right', col: WHITE, a: 0.9 });
      wipeLabel(R, 'DOWN', rx, y + (V ? 64 : 62) + ls * 0.73, clamp(lu * 1.3 - 0.3), { size: ls, weight: 700, align: 'right', col: WHITE, a: 0.9 });
      wipeLabel(R, 'HYPE', V ? 70 : 120, y - (V ? 60 : 62), clamp(lu * 1.2 - 0.2), { size: V ? 46 : 50, weight: 500, col: CYAN, a: 0.9, track: 0.12 });
    }
    veil(R, E.inOutSine(clamp((t - M.FADE_1[0]) / (M.FADE_1[1] - M.FADE_1[0]))));
  };
}
