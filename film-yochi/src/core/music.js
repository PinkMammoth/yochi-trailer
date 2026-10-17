// Timing map: the ONLY place in the film that knows when anything happens.
//
// asset-pack/audio/yochi.wav does not exist yet, so this is a placeholder grid at 90 BPM with the hit
// list the placeholder score (tools/score.mjs) and the click track are generated from. When the real
// track lands, run `python3 tools/measure.py ../asset-pack/audio/yochi.wav`, then move BPM, T0 and the
// event times below onto what it measures. Scenes ask for M.* and never hard-code a time.

export const BPM = 90;
export const BEAT = 60 / BPM;          // 0.6667 s
export const BAR = BEAT * 4;           // 2.6667 s
export const T0 = 0.0;                 // first downbeat
export const bar = (n) => T0 + n * BAR;
export const beat = (n) => T0 + n * BEAT;
export const DURATION = 34.0;

export const beatPhase = (t) => (((t - T0) / BEAT) % 1 + 1) % 1;

// Key events ----------------------------------------------------------------
export const M = {
  // 1. the tear: frame 0 is already mid-stroke (the thumbnail), the hit is on frame 0
  TEAR: 0.0,
  TEAR_START: -0.36,         // the stroke started before the film did: frame 0 catches it two thirds across
  TEAR_END: 0.22,
  PULLBACK: [beat(1.25), bar(1)],           // 0.83 .. 2.67: the stroke becomes the strike line
  LABELS: beat(3.25),                       // 2.17: UP / DOWN / HYPE

  // 2. calm
  CALM: bar(1),                             // 2.667
  CALM_BRUSH: [bar(1) + beat(1), bar(2) + beat(3) - 0.15], // the slow brush
  TAPS: [bar(1) + beat(2), bar(2), bar(2) + beat(2)],      // soft taps on 1 and 3
  SILENCE_1: [bar(2) + beat(3), bar(3)],    // 7.33 .. 8.00: held

  // 3. sudden
  SUDDEN: bar(3),                           // 8.00
  SUDDEN_2: bar(3) + beat(0.5),             // 8.33: the snap up
  SUDDEN_END: bar(3) + beat(0.6),
  FADE_1: [bar(3) + beat(2.5), bar(4) - 0.05],

  // 4. foresight, UP
  FS1: bar(4),                              // 10.667: fresh sheet
  FS1_GHOST: [bar(4), bar(4) + beat(1.4)],  // the ghost draws
  FS1_PICK: bar(4) + beat(1.1),             // UP marks its tip
  SILENCE_2: [bar(4) + beat(1.5), bar(4) + beat(3)], // ghost hangs
  FS1_FOLLOW: [bar(4) + beat(3), bar(5) - 0.04],     // 12.667 .. the brush follows exactly
  FS1_CLOSE: bar(5),                        // 13.333 HIT: green candle
  FS1_PAY: bar(5) + beat(0.25),
  FS1_OUT: [bar(6) - beat(0.6), bar(6)],

  // 5. foresight, DOWN, faster
  FS2: bar(6),                              // 16.0
  FS2_GHOST: [bar(6), bar(6) + beat(0.5)],
  FS2_PICK: bar(6) + beat(0.4),
  FS2_FOLLOW: [bar(6) + beat(1), bar(6) + beat(1.95)],  // 16.667
  FS2_CLOSE: bar(6) + beat(2),              // 17.333 HIT: red candle
  FS2_PAY: bar(6) + beat(2.25),

  // 6. gather and write 予知 (stroke windows, in stroke order; on beats and eighths)
  GATHER: bar(7),                           // 18.667
  KANJI: {
    yo: [
      [bar(7) + beat(0.0), bar(7) + beat(0.75)],   // ① ㇇
      [bar(7) + beat(1.0), bar(7) + beat(1.3)],    // ② 丶
      [bar(7) + beat(1.5), bar(7) + beat(2.2)],    // ③ ㇖
      [bar(7) + beat(2.5), bar(7) + beat(3.6)],    // ④ 亅
    ],
    chi: [
      [bar(8) + beat(0.0), bar(8) + beat(0.3)],    // ① ノ
      [bar(8) + beat(0.5), bar(8) + beat(0.85)],   // ② 一
      [bar(8) + beat(1.0), bar(8) + beat(1.45)],   // ③ 一
      [bar(8) + beat(1.5), bar(8) + beat(2.1)],    // ④ ノ
      [bar(8) + beat(2.25), bar(8) + beat(2.45)],  // ⑤ 丶
      [bar(8) + beat(2.75), bar(8) + beat(3.05)],  // ⑥ 丨
      [bar(8) + beat(3.15), bar(8) + beat(3.65)],  // ⑦ 𠃍
      [bar(8) + beat(3.8), bar(8) + beat(4.15)],   // ⑧ 一
    ],
  },
  KANJI_SUB: bar(9) + beat(0.5),            // 24.33: yochi · knowing before
  DISSOLVE: [bar(9) + beat(2), bar(10)],    // 26.0 .. 26.667
  YMARK: bar(10),                           // 26.667 HIT
  CARD: {
    word: bar(10) + beat(1),                // YOCHI
    sub: bar(10) + beat(2),                 // 予知: foresight
    tag: bar(10) + beat(3),                 // Call it right. Take the pool.
    url: bar(11),                           // yochigg.xyz
  },
  END: 34.0,
};

// The hit list (for the placeholder score and the click track). kind: big | mid | soft | accent
export const HITS = [
  [M.TEAR, 'big'],
  ...M.TAPS.map((t) => [t, 'soft']),
  [M.SUDDEN, 'big'], [M.SUDDEN_2, 'mid'],
  [M.FS1_FOLLOW[0], 'accent'], [M.FS1_CLOSE, 'big'],
  [M.FS2_FOLLOW[0], 'accent'], [M.FS2_CLOSE, 'big'],
  [M.GATHER, 'big'],
  ...M.KANJI.yo.slice(1).map(([a]) => [a, 'soft']),
  [bar(8), 'mid'],
  ...M.KANJI.chi.slice(1).map(([a]) => [a, 'soft']),
  [M.YMARK, 'big'],
  [M.CARD.word, 'soft'], [M.CARD.url, 'mid'],
];
// Silences the score must keep empty (and the picture holds still in)
export const SILENCES = [M.SILENCE_1, M.SILENCE_2, [M.CARD.url + BAR * 1.2, M.END]];
// Fast strokes that get a brush swish in the score: [start, end, loudness]
export const SWISHES = [
  [M.TEAR_START, M.TEAR_END, 1.0],
  [M.SUDDEN - 0.02, M.SUDDEN_END, 1.0],
  [M.FS1_FOLLOW[0], M.FS1_FOLLOW[1], 0.5], [M.FS1_CLOSE - 0.03, M.FS1_CLOSE + 0.12, 0.8],
  [M.FS2_FOLLOW[0], M.FS2_FOLLOW[1], 0.5], [M.FS2_CLOSE - 0.03, M.FS2_CLOSE + 0.12, 0.8],
  ...M.KANJI.yo.map(([a, b]) => [a, b, 0.35]),
  ...M.KANJI.chi.map(([a, b]) => [a, b, 0.3]),
];
