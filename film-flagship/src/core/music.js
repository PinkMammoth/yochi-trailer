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

export const src2film = (s) => s - SRC_START;
export const bar = (n) => n * BAR;      // film time of film bar n (film bar n = source bar n + 2)
export const beat = (n) => n * BEAT;

export const AUDIO = {
  file: 'Victory Stamp.mp3',
  start: SRC_START,
  dropout: [22.85, 23.70],              // source seconds, muted
  dropoutFade: 0.006,
  fadeOut: [52.2, 54.6],                // film seconds
};
export const DURATION = 54.6;

// Beat helpers --------------------------------------------------------------
export const beatPhase = (t) => ((t / BEAT) % 1 + 1) % 1;
export const barPhase = (t) => ((t / BAR) % 1 + 1) % 1;

// Key events, film seconds --------------------------------------------------
export const M = {
  // 1. thumbnail and the joke
  DOOMER: 0,
  PERMA: bar(1),                         // 1.687 bass entry: smash cut to Perma-Bull

  // 2. the roster: one starter per hit, accelerating into the grid
  ROSTER: [6, 8, 10, 12, 14, 16, 17, 18].map(beat), // Night Shift ... Contrarian
  GRID: bar(5),                          // 8.433 the build starts: character select
  CURSOR: beat(21),                      // 8.854 the cursor steps on the eighths (THE CAST: on the beats from 9.28)
  LOCK_YOU: beat(24),                    // 10.120 決 on Perma-Bull (THE CAST: 11.806)
  LOCK_THEM: beat(26),                   // 10.963 the opponent locks Doomer (THE CAST: 12.650)

  // 3b. FLAGSHIP, Act II "Conviction": the takes become the game, one bar
  OPIN: bar(7),                          // 11.806
  TAKES: [0, 0.5, 1, 1.5].map((b) => bar(7) + beat(b)), // we're so back / it's over / send it / never selling
  STRIKE: bar(7) + beat(2),              // 12.650 the dry-brush strike line tears across; the takes sort UP / DOWN

  // 4. the fight (sumi)
  INK: bar(8),                           // 13.493 paper floods to sumi
  VS: bar(8) + beat(1),                  // 13.914 the versus band slams
  ROUND: bar(9),                         // 15.179 ROUND 1
  BOARD: bar(9) + beat(2),               // 16.022 chart, timer, picks
  PICK_YOU: bar(10),                     // 16.866 UP locks (決)
  PICK_THEM: bar(10) + beat(1),          // 17.287 DOWN locks
  FOCUS: src2film(22.85) - 0.55,         // 17.744 FLAGSHIP: the board strips away to the candle and the strike
  FREEZE: src2film(22.85),               // 18.294 0:01, hard silence
  DROP: src2film(23.72),                 // 19.164 the drop kick: the candle snaps closed UP
  STAMP: src2film(24.326),               // 19.770 the next kick: CALLED IT makes contact (its motion starts 0.275 s before)

  // 5-6. the drop: climbing
  RISE: src2film(24.326) + 0.24,         // +19 USDC rises as the stamp settles
  LOSER: bar(12),                        // 20.239 Doomer to grey, 敗
  FFA: bar(13),                          // 21.926
  FFA_CLOSE: bar(13) + beat(1.5),        // 22.558 on the kick: the FFA candle closes UP
  BR: bar(14) + beat(1.5),               // 24.244 on the kick: whip into the Battle Royale
  BR_WIN: bar(17),                       // 28.672 last one standing
  // 7. the unlock (paper)
  UNLOCK: bar(17.5),                     // 29.515
  STREAK: [0, 1, 2, 3, 4].map((i) => bar(17.5) + beat(i)), // five 勝 seals, one per beat
  BANNER: bar(18.5) + beat(1),           // 31.624 UNTOUCHABLE · WIN 5 IN A ROW, the card deals
  FLIP: bar(19),                         // 32.045
  GLORY: bar(19.5),                      // 32.889 into the painting
  SWAP: bar(20) + beat(1),               // 34.154 the player chip's face swaps
  GLORY_END: bar(21),                    // 35.419
  // 8. the ladder
  LADDER: bar(21),
  HEROES: [0, 2, 4, 6].map((i) => bar(21) + beat(i)), // FLAGSHIP: four singles (THE CAST: six)
  GALLERY: bar(23),                      // 38.791 FLAGSHIP: three rewards in one composition, one per beat
  LADDER_GRID: bar(24),                  // 40.478 one bar (THE CAST: two)
  // 9. the product
  PRODUCT: bar(25),                      // 42.165 (THE CAST: 43.852)
  PRESS: bar(26) + beat(1),              // 44.274 ENTER YOCHI pressed
  // 9b. FLAGSHIP, the ink signature
  TEAR: [0, 0.5, 1].map((b) => bar(26) + beat(2 + b)), // 44.696 the loaded brush tears across, three strokes on the eighths
  GATHER: bar(27),                       // 45.539 the ink pulls in to the Y mark
  // 10. end card
  END: bar(28),                          // 47.225 the seal stamps over the ink Y on the downbeat (THE CAST's end-card hit)
  LOCKUP: bar(28) + beat(1.5),           // 47.857 the sealed mark slides into the lockup
};

// heartbeat: an impulse on every kick of the drop pattern (1 and the "and" of 2)
export function kick(t, decay = 0.12) {
  if (t < M.DROP) return 0;
  if (t < bar(12)) return Math.exp(-(t - M.DROP) / decay);
  const p = ((t - bar(12)) % BAR + BAR) % BAR;
  const d = p >= 1.5 * BEAT ? p - 1.5 * BEAT : p;
  return Math.exp(-d / decay);
}
