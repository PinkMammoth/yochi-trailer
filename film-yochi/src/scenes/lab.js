// Review sheet (t >= 100): the brush's vocabulary side by side.
import { makeStroke, drawStroke, drawGhost, samplePath, CYAN, GREEN, RED, WHITE } from '../ink/brush.js';
import { E } from '../core/math.js';
import { screen } from './common.js';

export function labScene(R) {
  const S = [
    makeStroke({ pts: [[80, 140], [500, 120], [900, 150], [1300, 130], [1840, 140]], width: 70, prof: 'harai', seed: 3, dry: 0.9, load: 1, hot: 0.6, wet: 0.3, t1: 0.35, splatter: { amount: 1, size: 0.6 } }),
    makeStroke({ pts: [[80, 330], [600, 320], [1100, 335], [1500, 330]], width: 46, prof: 'tome', seed: 4, dry: 0.2, load: 1, hot: 0.4, wet: 0.7, t1: 2.0 }),
    makeStroke({ pts: [[200, 900], [210, 700], [230, 520]], width: 60, prof: 'slash', seed: 5, col: GREEN, dry: 0.5, hot: 0.3, t1: 0.2, splatter: { amount: 0.8, size: 0.5 } }),
    makeStroke({ pts: [[420, 480], [430, 650], [425, 760]], width: 60, prof: 'tome', seed: 6, col: RED, dry: 0.3, hot: 0.2, t1: 0.25, drips: { n: 6, len: 200, width: 9 } }),
    makeStroke({ pts: [[620, 520], [660, 560], [690, 610]], width: 50, prof: 'dot', seed: 7, dry: 0.1, hot: 0.5, t1: 0.3 }),
    makeStroke({ pts: [[800, 520], [1000, 515], [1180, 520], [1150, 580], [1080, 640], [990, 700]], width: 34, prof: 'tome', seed: 8, dry: 0.3, hot: 0.5, t1: 0.6 }),
    makeStroke({ pts: [[1300, 480], [1310, 700], [1300, 900], [1270, 930], [1230, 900]], width: 40, prof: PH(0.9), seed: 9, dry: 0.4, hot: 0.5, t1: 0.7 }),
    makeStroke({ pts: [[1450, 600], [1550, 640], [1650, 560], [1750, 480], [1850, 520]], width: 14, prof: 'even', seed: 10, dry: 0.1, wet: 0.8, hot: 0.3, t1: 3 }),
  ];
  const gh = samplePath([[1450, 900], [1600, 860], [1700, 760], [1850, 700]]);
  return (t, P) => {
    screen(R);
    for (const s of S) drawStroke(R, s, 50);
    drawGhost(R, gh, 0, 0.8);
  };
}
function PH(at) { return [[0, 0.4], [0.04, 1.06], [0.12, 0.92], [at - 0.06, 0.9], [at, 1.08], [at + (1 - at) * 0.35, 0.6], [1, 0.02]]; }

// t >= 101: 予知 written out, for checking the calligraphy
import { writeGlyph, GLYPHS } from '../ink/kanji.js';
export function kanjiLab(R) {
  const T = (n) => Array.from({ length: n }, () => [0, 0.5]);
  const yo = writeGlyph('yo', { x: 200, y: 40, size: 1000 * 0.98 }, T(4));
  const chi = writeGlyph('chi', { x: 980, y: 40, size: 1000 * 0.98 }, T(8));
  return (t) => {
    screen(R);
    for (const s of [...yo, ...chi]) drawStroke(R, s, 10);
  };
}
