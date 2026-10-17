// The strokes gather and write 予知; the kanji's ink settles into the Y; the end card.
import { drawStroke, makeStroke, css, inkColor, CYAN, WHITE, GREEN, RED } from '../ink/brush.js';
import { writeGlyph } from '../ink/kanji.js';
import { makeFlow, drawFlow, inkPoints, writePoints } from '../ink/flow.js';
import { logoPath, inLogo } from '../ink/logo.js';
import { M } from '../core/music.js';
import { E, clamp, rngFrom, shake, lerp } from '../core/math.js';
import { cam, screen, label, wipeLabel, measure } from './common.js';

export function finale(R, sheet3) {
  const V = R.vertical;
  // 予知: side by side in landscape, top to bottom (as vertical writing) in 4:5
  const ks = V ? 520 : 640;
  const boxYo = V ? { x: R.VW / 2 - ks / 2, y: 90, size: ks } : { x: R.VW / 2 - ks + 30, y: 130, size: ks };
  const boxChi = V ? { x: R.VW / 2 - ks / 2, y: 90 + ks + 10, size: ks } : { x: R.VW / 2 - 30, y: 130, size: ks };
  const yo = writeGlyph('yo', boxYo, M.KANJI.yo, { seed: 50 });
  const chi = writeGlyph('chi', boxChi, M.KANJI.chi, { seed: 50 });
  const kanji = [...yo, ...chi];

  // the gather: sheet 3's ink lifts and flies to where 予 is being written
  const srcs = [];
  sheet3.strokes.forEach((st, i) => srcs.push(...inkPoints(st, i === 0 ? 400 : 220, 70 + i)));
  const tg = [];
  yo.forEach((st, i) => tg.push(...writePoints(st, i === 0 ? 420 : 200, 80 + i)));
  const gather = makeFlow(srcs, tg, { seed: 3, flight: [0.35, 1.0], depart: [M.GATHER, M.GATHER + 1.0], swirl: 0.9, lift: 120 });

  // the Y mark
  const yH = V ? 330 : 290;
  const yC = V ? [R.VW / 2, 330] : [R.VW / 2, 285];
  const rnd = rngFrom('ypts');
  const yPts = [];
  while (yPts.length < 900) {
    const px = rnd() * 1.9 - 0.95, py = rnd() * 1.6 - 0.8;
    if (inLogo(px, py)) yPts.push({ x: yC[0] + (px * yH) / 1.56, y: yC[1] + (py * yH) / 1.56, t: lerp(M.DISSOLVE[0] + 0.3, M.YMARK + 0.02, Math.pow(rnd(), 0.6)) });
  }
  const kSrc = [];
  kanji.forEach((st, i) => kSrc.push(...inkPoints(st, 90, 200 + i, CYAN)));
  const toY = makeFlow(kSrc, yPts, { seed: 9, flight: [0.3, 0.6], depart: [M.DISSOLVE[0], M.YMARK - 0.15], swirl: 0.5, lift: 40 });

  // end card
  const small = (x, y, s) => [writeGlyph('yo', { x, y, size: s }, Array(4).fill([0, 0.1]), { seed: 300, bristles: 12, reach: 4000, dry: 0.1 }),
    writeGlyph('chi', { x: x + s * 0.92, y, size: s }, Array(8).fill([0, 0.1]), { seed: 300, bristles: 12, reach: 4000, dry: 0.1 })].flat();
  const wordY = V ? 640 : 560;
  const subS = V ? 62 : 60;
  const subY = V ? 742 : 650;
  const subText = ': foresight';
  const subW = subS * 1.92 + measure(R, subText, subS, 500, '"Chakra Petch"');
  const subX = R.VW / 2 - subW / 2;
  const subK = small(subX, subY - subS * 0.86, subS);
  const tagY = V ? 850 : 745;
  const urlY = V ? 1090 : 905;
  const urlS = V ? 84 : 80;
  const uw = measure(R, 'yochigg.xyz', urlS, 700);
  const urlUnder = makeStroke({ pts: [[R.VW / 2 - uw / 2 - 20, urlY + 30], [R.VW / 2, urlY + 25], [R.VW / 2 + uw / 2 + 20, urlY + 28]], width: 12, prof: 'harai', seed: 400,
    t0: M.CARD.url + 0.1, t1: M.CARD.url + 0.42, ease: E.outCubic, dry: 0.7, wet: 0.4, hot: 0.4 });

  return (t, P, s3draw) => {
    const [sx, sy] = shake(t, M.GATHER, 8, 0.3, 20, 7);
    // sheet 3 lifting away
    if (t < M.GATHER + 1.4) {
      const k = clamp((t - M.GATHER) / 1.0);
      s3draw(t, P, { fade: 1 - E.inQuad(k) * 0.6, u0: E.inOutCubic(k), textFade: 1 - clamp((t - M.GATHER) / 0.35) });
    }
    screen(R);
    cam(R, R.VW / 2, R.VH / 2, 1 + 0.02 * clamp((t - M.GATHER) / 7), sx, sy);
    // the kanji, written; then lifting into the Y
    const kf = 1 - E.inQuad(clamp((t - M.DISSOLVE[0] - 0.1) / (M.YMARK - M.DISSOLVE[0] - 0.05)));
    if (kf > 0) for (const st of kanji) drawStroke(R, st, t, { fade: kf });
    drawFlow(R, gather, t);
    const su = clamp((t - M.KANJI_SUB) / 0.6);
    if (su > 0 && kf > 0) wipeLabel(R, 'yochi · knowing before', R.VW / 2, V ? 1290 : 975, su, { size: V ? 46 : 48, weight: 500, align: 'center', col: WHITE, a: 0.85 * kf, track: 0.08 });
    drawFlow(R, toY, t);
    // the Y settles in
    const ya = E.outCubic(clamp((t - (M.YMARK - 0.2)) / 0.3));
    if (ya > 0) {
      const { b, g } = R;
      b.fillStyle = css(inkColor(CYAN, ya)); logoPath(b, yC[0], yC[1], yH); b.fill();
      g.fillStyle = css(CYAN.map((v) => v * 0.45 * ya)); logoPath(g, yC[0], yC[1], yH); g.fill();
    }
    P.exposure *= 1 + 0.18 * Math.exp(-Math.max(0, t - M.YMARK) / 0.15) * (t >= M.YMARK ? 1 : 0);
    // end card copy, on the beats
    const wu = clamp((t - M.CARD.word) / 0.45);
    if (wu > 0) wipeLabel(R, 'YOCHI', R.VW / 2, wordY, wu, { size: V ? 140 : 128, weight: 700, font: '"Chakra Petch"', align: 'center', col: WHITE, track: 0.14 });
    const bu = clamp((t - M.CARD.sub) / 0.45);
    if (bu > 0) {
      const a = E.outCubic(bu);
      for (const st of subK) drawStroke(R, st, 10, { fade: a });
      label(R, subText, subX + subS * 1.92, subY, { size: subS, weight: 500, font: '"Chakra Petch"', col: WHITE, a: a * 0.9 });
    }
    const tu = clamp((t - M.CARD.tag) / 0.5);
    if (tu > 0) wipeLabel(R, 'Call it right. Take the pool.', R.VW / 2, tagY, tu, { size: V ? 60 : 60, weight: 600, font: '"Chakra Petch"', align: 'center', col: WHITE, a: 0.9 });
    const uu = clamp((t - M.CARD.url) / 0.4);
    if (uu > 0) {
      wipeLabel(R, 'yochigg.xyz', R.VW / 2, urlY, uu, { size: urlS, weight: 700, align: 'center', col: CYAN, glow: 0.3 });
      drawStroke(R, urlUnder, t);
    }
  };
}
