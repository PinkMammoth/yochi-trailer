// 予知, written with the brush. No font: every stroke is authored as a centreline in a 1000-unit box,
// in standard stroke order, with the entry, body and ending (止め stop, 跳ね hook, 払い sweep) its
// stroke calls for. Proportions were checked against a reference glyph laid under the strokes.
//
// 予 (4): ① ㇇ horizontal, turn, sweep down-left  ② 丶 long dot  ③ horizontal, turn, hook down-left
//         ④ 亅 vertical with a hook to the left
// 知 (8): 矢 ① ノ  ② 一  ③ 一  ④ ノ (from the top, through both horizontals)  ⑤ 丶
//         口 ⑥ 丨  ⑦ 𠃍 (top and right side in one)  ⑧ 一 (closing base)
import { makeStroke, PROFILES } from './brush.js';

// width is in box units (1000 = the character's em box)
export const GLYPHS = {
  yo: [
    { pts: [[168, 128], [300, 120], [450, 112], [600, 104], [698, 98], [722, 104], [716, 122], [655, 172], [570, 232], [482, 292]],
      w: 60, prof: [[0, 0.5], [0.03, 1.12], [0.1, 0.78], [0.5, 0.7], [0.62, 1.12], [0.68, 0.95], [0.9, 0.7], [1, 0.18]] },
    { pts: [[300, 208], [370, 240], [440, 280], [500, 320], [548, 356]],
      w: 74, prof: [[0, 0.25], [0.2, 0.6], [0.6, 0.95], [0.86, 1.15], [0.96, 0.9], [1, 0.4]] },
    { pts: [[88, 412], [300, 406], [520, 398], [740, 388], [794, 384], [818, 396], [800, 428], [745, 495], [680, 560], [612, 612]],
      w: 62, prof: [[0, 0.5], [0.025, 1.12], [0.08, 0.8], [0.55, 0.68], [0.66, 1.12], [0.72, 0.98], [0.9, 0.72], [1, 0.12]] },
    { pts: [[468, 402], [470, 520], [470, 640], [466, 740], [454, 782], [418, 796], [376, 782]],
      w: 90, prof: [[0, 0.55], [0.04, 1.12], [0.12, 0.95], [0.72, 0.9], [0.8, 1.05], [0.86, 0.85], [1, 0.05]] },
  ],
  chi: [
    { pts: [[212, 62], [196, 140], [168, 212], [124, 274], [72, 326]], w: 64, prof: PROFILES.harai },
    { pts: [[178, 204], [300, 199], [440, 190]], w: 50, prof: PROFILES.tome },
    { pts: [[58, 432], [250, 425], [480, 414]], w: 54, prof: PROFILES.tome },
    { pts: [[290, 178], [292, 300], [286, 430], [268, 540], [228, 640], [160, 735], [72, 818]],
      w: 82, prof: [[0, 0.5], [0.04, 1.12], [0.12, 0.96], [0.42, 0.95], [0.75, 0.62], [1, 0.03]] },
    { pts: [[312, 568], [362, 620], [412, 680], [462, 744]], w: 70, prof: [[0, 0.3], [0.25, 0.7], [0.7, 1.05], [0.92, 1.0], [1, 0.4]] },
    { pts: [[548, 178], [552, 400], [550, 620], [546, 822]], w: 72, prof: [[0, 0.5], [0.04, 1.1], [0.15, 0.9], [0.9, 0.86], [0.97, 0.95], [1, 0.4]] },
    { pts: [[552, 192], [680, 186], [790, 176], [818, 184], [816, 214], [812, 420], [808, 620], [804, 812]],
      w: 62, prof: [[0, 0.5], [0.03, 1.1], [0.1, 0.82], [0.3, 0.78], [0.37, 1.14], [0.44, 0.96], [0.92, 0.88], [0.97, 0.98], [1, 0.4]] },
    { pts: [[572, 740], [690, 736], [790, 732]], w: 50, prof: PROFILES.tome },
  ],
};

// Build a character's strokes. box: { x, y, size } (top-left corner and em size in stage px),
// times: [[t0, t1], ...] per stroke, o: extra brush params.
export function writeGlyph(key, box, times, o = {}) {
  const k = box.size / 1000;
  return GLYPHS[key].map((g, i) => makeStroke({
    pts: g.pts.map(([x, y]) => [box.x + x * k, box.y + y * k]),
    width: g.w * k * (o.wk ?? 1), prof: g.prof, seed: (o.seed ?? 50) + i * 7 + (key === 'chi' ? 100 : 0),
    t0: times[i][0], t1: times[i][1],
    ease: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2) * 0.7 + u * 0.3,
    load: 1, dry: o.dry ?? 0.45, reach: o.reach ?? 1400 * k * 1.6, hot: o.hot ?? 0.55, wet: o.wet ?? 0.55, glow: o.glow ?? 0.1,
    startSkew: 0.7, bristles: o.bristles, col: o.col,
  }));
}
