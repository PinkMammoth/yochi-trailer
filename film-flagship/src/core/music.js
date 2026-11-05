// Timing map for asset-pack/audio/Victory Stamp.mp3, measured from the audio (low-band kick onsets,
// band energy per bar, onset flux), not by ear. Every timing in the film lives here, so a new track
// drops in by remeasuring this file, not by re-editing scenes.
//
// The track: 142.3 BPM (bar 1.6866 s), downbeats at 1.183 + n * BAR in the source file.
//   source bars 0-2   intro, no bass
//   source bar 3      (6.243) bass enters: the groove
//   source bars 7-12  (12.99-23.11) the build: bass thins out, then goes
//   23.11-23.70       a swell into the drop
//   23.72             the drop: the first big kick (a pickup kick, 1.5 beats after bar 13's downbeat)
//   source bar 14     (24.797) the drop proper, kick pattern on 1 and the "and" of 2
//   source bar 30     (51.78) the bass dips: the end-card bars
//   60.05             the file ends, still at full mid/high energy: it needs a fade
//
// THE EDIT (reproducible: tools/audio.mjs reads AUDIO below and builds the ffmpeg graph)
//   1. Start at source bar 2 (4.556 s) so the film's 0 is a downbeat and the bass entry lands on film bar 1.
//   2. A hard dropout from source 22.85 to 23.70 (the fight's 0:01 freeze): it cuts the swell, so the
//      drop kick at 23.72 hits out of silence. 6 ms fades either side so nothing clicks.
//   3. Fade the tail over the end card; the file runs out under the hold.

export const BPM = 142.3;
export const BAR = 1.6866;
export const BEAT = BAR / 4;            // 0.42165
export const SRC_T0 = 1.183;            // first downbeat in the source file
export const SRC_START = SRC_T0 + 2 * BAR; // 4.556: source bar 2 is film 0

// FIRST AD (5 Nov): two whole 4-bar phrases are cut from the track, so the film runs 39.7 s instead of 54.6:
//   source bars 7-10  (12.99-19.74, the first half of the build: the groove now drops straight into its last two
//                      bars, where the bass thins out; the splice lands under the DUEL slam)
//   source bars 22-25 (38.29-45.03, one phrase of the drop groove; the splice lands on the cut to Cold Blooded)
// Everything else is the approved edit: start at source bar 2, the 0:01 dropout, the drop, the end card on source
// bar 30 (the bass dip). Whole bars only, so the film's bar grid stays regular: bar(n) = n * BAR.
// HOOK (5 Nov): the film now starts one bar earlier in the source, on source bar 1 (the intro's hats, no bass),
// for the UP OR DOWN opening. It is the music that already led into the old first frame, so there is no splice:
// every later event moves by exactly one bar (HOOK) and keeps its sync.
export const HOOK = BAR;
export const SEGMENTS = [                // [source start, source end], played in order
  [SRC_T0 + 1 * BAR, SRC_T0 + 7 * BAR],
  [SRC_T0 + 11 * BAR, SRC_T0 + 22 * BAR],
  [SRC_T0 + 26 * BAR, 60.0],
];
export function src2film(s) {
  let f = 0;
  for (const [a, b] of SEGMENTS) { if (s < b) return f + Math.max(0, s - a); f += b - a; }
  return f;
}
export const beat = (n) => n * BEAT;
const fb = (n) => HOOK + n * BAR;       // film time of the first ad's bar n (bar 0 = Doomer, as before)
export const bar = fb;

export const AUDIO = {
  file: 'Victory Stamp.mp3',
  segments: SEGMENTS,
  spliceFade: 0.012,                    // a short equal-power crossfade at each splice, so nothing clicks
  dropout: [22.85, 23.70],              // source seconds, muted
  dropoutFade: 0.006,
  fadeIn: 0.01,
  fadeOut: [37.3 + BAR, 39.7 + BAR],    // film seconds
};
export const DURATION = 39.7 + BAR;  // 41.39

// Beat helpers --------------------------------------------------------------
export const beatPhase = (t) => ((t / BEAT) % 1 + 1) % 1;
export const barPhase = (t) => ((t / BAR) % 1 + 1) % 1;

// Key events, film seconds --------------------------------------------------
// The story is the player's: a stranger picks DOWN, you pick UP, one candle decides; the duel; two more ways to
// play; the streak and the face it earns; the real site; the mark.
export const M = {
  // 0. HOOK: the question, one bar, a word on each of the first three beats (paper, over the HYPE chart)
  HOOK_WORDS: [0, 1, 2].map(beat),       // UP, OR, DOWN?
  // 1. the premise (paper). Every time below is the approved first ad's plus one bar.
  DOOMER: bar(0),                        // 1.687 a stranger, DOWN (the old thumbnail, now the answer)
  PERMA: bar(1),                         // 1.687 bass entry: you, UP
  OPIN: bar(2),                          // 3.373 the line: the two picks, the strike line sorts them
  TAKES: [0, 0.5].map((b) => bar(2) + beat(b)),
  STRIKE: bar(2) + beat(1.5),            // 4.006
  SUPER: bar(2) + beat(2.5),             // 4.427 "Whoever's right takes the pot."
  INK: bar(3),                           // 5.060 the drop floods the page into the duel
  // 2. the duel (sumi)
  SO_IN: bar(3) + beat(1),               // 5.481 the standoff's halves slide in
  SO_NAME: bar(3.5),                     // 5.903
  SO_VS: bar(4),                         // 6.746 対
  COLLAPSE: bar(4.75),                   // 8.012 into the versus band
  VS: bar(4.75) + beat(1),               // 8.433
  ROUND: bar(5),                         // 8.433 DUEL (the build: the first splice is under this hit)
  BOARD: bar(5.5),                       // 9.276 the band rises, the board
  BOARD2: bar(5.5),                      // (one round: the board's clock starts with it)
  PICK_YOU: bar(6),                      // 10.120
  PICK_THEM: bar(6) + beat(1),           // 10.541
  FOCUS: src2film(22.85) - 0.55,         // 10.996
  FREEZE: src2film(22.85),               // 11.546 0:01, hard silence
  DROP: src2film(23.72),                 // 12.416 the candle snaps closed UP
  STAMP: src2film(24.326),               // 13.022 CALLED IT
  RISE: src2film(24.326) + 0.24,
  LOSER: bar(8),                         // 13.493 敗
  // 3. two more ways to play
  FFA: bar(9),                           // 15.179
  FFA_CLOSE: bar(9) + beat(1.5),         // 15.812
  BR: bar(10) + beat(1.5),               // 17.498
  VERDICT: bar(11),                      // 18.553 the final round's verdict
  JUDGE: [2, 3, 4, 5, 6].map((i) => bar(11) + beat(i)),
  TALLY: bar(11) + beat(7),              // 21.504
  V_EXIT: bar(13),                       // 21.926
  BR_WIN: bar(13) + beat(1),             // 22.347 last one standing
  // 4. the streak and the face it earns
  UNLOCK: bar(14),                       // 23.612
  STREAK: [0, 0.5, 1, 1.5].map((b) => bar(14) + beat(b)), // 7, 8, 9, 10 on the eighths
  SHEET: bar(14.75),                     // HOOK revision: Duel Master is EPIC, no takeover; the sheet a beat after 10
  LADDER: bar(16),                       // 26.986 Cold Blooded (the second splice is under this cut)
  HEROES: [bar(16)],
  SWAP: bar(16) + beat(2.5),             // 28.040 your face swaps
  // 5. the product, the mark
  PRODUCT: bar(17),                      // 28.672
  PRESS: bar(18) + beat(1),              // 30.781
  TEAR: [0, 0.5, 1].map((b) => bar(18) + beat(2 + b)),
  GATHER: bar(19),                       // 32.045
  END: bar(20),                          // 33.732 the seal, on source bar 30's downbeat as before
  LOCKUP: bar(20) + beat(1.5),           // 34.365
};

// heartbeat: an impulse on every kick of the drop pattern (1 and the "and" of 2)
export function kick(t, decay = 0.12) {
  if (t < M.DROP) return 0;
  if (t < bar(8)) return Math.exp(-(t - M.DROP) / decay);
  const p = ((t - bar(8)) % BAR + BAR) % BAR;
  const d = p >= 1.5 * BEAT ? p - 1.5 * BEAT : p;
  return Math.exp(-d / decay);
}
