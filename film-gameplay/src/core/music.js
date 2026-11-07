// Timing map for asset-pack/audio/Victory Stamp.mp3 (the track every Sumi film uses), measured by the flagship
// (film-flagship/src/core/music.js on claude/yochi-first-ad-order-a): 142.3 BPM, bar 1.6866 s, downbeats at
// 1.183 + n * BAR in the source file. Bass enters on source bar 3; the build is bars 7 to 12; the swell into the
// drop is cut to silence (22.85 to 23.70) so the drop kick at 23.72 hits out of nothing; bar 14 is the drop
// proper; bar 30 is the bass dip the approved films land their end cards on.
//
// THE GAMEPLAY EDIT (whole bars, so the film's bar grid stays regular: bar(n) = n * BAR)
//   1. source bars 3-7    the groove, from the bass entry (film 0 is the first bass hit): the Duel
//   2. source bars 11-19  the last two bars of the build, the silence, the drop and five bars of the groove:
//                          Battle Royale, the verdict on the drop, the wins, the social beats
//   3. source bar 30-     the bass dip: the end card, faded out
// Each splice is a 12 ms equal-power crossfade on a downbeat (tools/audio.mjs).
export const BPM = 142.3;
export const BAR = 1.6866;
export const BEAT = BAR / 4;
export const SRC_T0 = 1.183;
const sb = (n) => SRC_T0 + n * BAR;
export const SEGMENTS = [[sb(3), sb(7)], [sb(11), sb(19)], [sb(30), 60.0]];
export function src2film(s) {
  let f = 0;
  for (const [a, b] of SEGMENTS) { if (s < b) return f + Math.max(0, s - a); f += b - a; }
  return f;
}
export const bar = (n) => n * BAR;
export const beat = (n) => n * BEAT;

export const DURATION = 24.6;
export const AUDIO = {
  file: 'Victory Stamp.mp3',
  segments: SEGMENTS,
  spliceFade: 0.012,
  dropout: [22.85, 23.70],     // source seconds, muted
  dropoutFade: 0.006,
  fadeIn: 0.004,
  fadeOut: [22.9, DURATION],   // film seconds
};

export const M = {
  SILENCE: src2film(22.85),    // 9.861
  SILENCE_END: src2film(23.70),
  DROP: src2film(23.72),       // 10.731 the verdict band lands
  END: bar(12),                // 20.239 the hanko's contact on the bass dip
};
