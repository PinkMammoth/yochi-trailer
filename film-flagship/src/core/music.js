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
  // FINAL EDIT (5 Nov): Competition -> Players -> Gameplay -> Consequences -> Yochi. Same track, same edit,
  // same 54.6 s; only these events moved. Old values in the comments are the approved flagship's.

  // 1. players lock their picks (paper): one starter per hit, no catchphrases; the pick is the line
  DOOMER: 0,                             // the thumbnail: Doomer, DOWN, 決
  PERMA: bar(1),                         // 1.687 bass entry: smash cut to Perma-Bull, UP (you)
  ROSTER: [6, 7, 8, 9, 10, 11].map(beat), // 2.530 ... 4.638 six more starters, one per beat (was 8 over 8.4 s)
  // 2. the line: the room's picks collide, the strike line sorts them (was Act II "Conviction" at 11.806)
  OPIN: bar(3),                          // 5.060
  TAKES: [0, 0.5, 1, 1.5].map((b) => bar(3) + beat(b)),
  STRIKE: bar(3) + beat(2),              // 5.903
  INK: bar(4),                           // 6.746 the drop floods the page into the duel (was 13.493)
  // 3. the duel standoff (the app's components/moment/duel-standoff.tsx)
  SO_IN: bar(4) + beat(1),               // 7.168 the halves slide in along the slash
  SO_NAME: bar(4.5),                     // 7.589 names brushed in
  SO_VS: bar(5),                         // 8.433 対 stamps on the seam (the build starts)
  COLLAPSE: bar(6),                      // 10.120 the splash collapses into the versus band
  VS: bar(6) + beat(1),                  // 10.541 the band is up, fighters breaking its edge
  ROUND: bar(6) + beat(2),               // 10.963 ROUND 1 (was 15.179)
  // 4. best of 3: round 1 is yours, the ROUND 2 call-out, then the approved final second
  BOARD: bar(7),                         // 11.806 the band rises into the board header (was 16.022)
  R1_YOU: bar(7) + beat(2),              // 12.650 you lock UP
  R1_THEM: bar(7) + beat(3),             // 13.071 they lock DOWN
  R1_CLOSE: bar(8),                      // 13.493 round 1 closes UP
  R1_WIN: bar(8) + beat(1),              // 13.914 勝 into your tally
  CALLOUT: bar(8.5),                     // 14.336 the round call-out (components/moment/round-callout.tsx, 1.6 s)
  BOARD2: bar(9),                        // 15.179 round 2's board under the call-out
  PICK_YOU: bar(10),                     // 16.866 UP locks (決)
  PICK_THEM: bar(10) + beat(1),          // 17.287 DOWN locks
  FOCUS: src2film(22.85) - 0.55,         // 17.744 the board strips away to the candle and the strike
  FREEZE: src2film(22.85),               // 18.294 0:01, hard silence
  DROP: src2film(23.72),                 // 19.164 the drop kick: the candle snaps closed UP
  STAMP: src2film(24.326),               // 19.770 CALLED IT makes contact

  // 5. consequences: climbing
  RISE: src2film(24.326) + 0.24,
  LOSER: bar(12),                        // 20.239 Doomer to grey, 敗
  FFA: bar(13),                          // 21.926
  FFA_CLOSE: bar(13) + beat(1.5),        // 22.558
  BR: bar(14) + beat(1.5),               // 24.244 whip into the Battle Royale
  VERDICT: bar(15),                      // 25.298 the round verdict takeover (components/moment/br-verdict.tsx)
  JUDGE: [2, 3, 4, 5, 6].map((i) => bar(15) + beat(i)), // each player judged in turn, one per beat
  TALLY: bar(15) + beat(7),              // 28.250 "You're still in"
  V_EXIT: bar(17),                       // 28.672 collapses onto the roster
  BR_LAST: bar(17) + beat(1),            // 29.093 the final round: mira out
  BR_WIN: bar(17.5),                     // 29.515 last one standing (was 28.672)
  // 6. the legendary unlock (components/achievement-unlock-host.tsx, LEGENDARY tier)
  UNLOCK: bar(18),                       // 30.358 連勝: 6, 7, 8, 9, 10, one per beat
  STREAK: [0, 1, 2, 3, 4].map((i) => bar(18) + beat(i)),
  TAKEOVER: bar(19.5),                   // 32.889 the screen to ink, 氷 in gold leaf
  SHEET: bar(19.5) + 1.05,               // 33.939 the app's t0: the sheet unrolls, the badge washes in
  // 7. the new face
  LADDER: bar(21.5),                     // 36.262
  HEROES: [0, 4].map((i) => bar(21.5) + beat(i)), // Cold Blooded (a bar, the face swap), Duel Master (two beats)
  SWAP: bar(21.5) + beat(2.5),           // 37.316 the player chip's face swaps
  GALLERY: bar(23),                      // 38.791
  LADDER_GRID: bar(24),                  // 40.478
  // 8. the product
  PRODUCT: bar(25),                      // 42.165
  PRESS: bar(26) + beat(1),              // 44.274
  // 9. the ink signature
  TEAR: [0, 0.5, 1].map((b) => bar(26) + beat(2 + b)),
  GATHER: bar(27),                       // 45.539
  // 10. end card
  END: bar(28),                          // 47.225
  LOCKUP: bar(28) + beat(1.5),           // 47.857
};

// heartbeat: an impulse on every kick of the drop pattern (1 and the "and" of 2)
export function kick(t, decay = 0.12) {
  if (t < M.DROP) return 0;
  if (t < bar(12)) return Math.exp(-(t - M.DROP) / decay);
  const p = ((t - bar(12)) % BAR + BAR) % BAR;
  const d = p >= 1.5 * BEAT ? p - 1.5 * BEAT : p;
  return Math.exp(-d / decay);
}
