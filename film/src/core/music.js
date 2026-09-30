// Timing map for asset-pack/audio/trailer.wav, measured from the audio itself
// (onset flux + band energy), not from the approximate notes.
// 130.42 BPM; the track feels like 65 BPM half-time, accents on 1 and 3.

export const BPM = 130.42;
export const BEAT = 60 / BPM;          // 0.46005 s
export const BAR = BEAT * 4;           // 1.8402 s
export const S16 = BEAT / 4;           // 0.1150 s
export const T0 = 0.5533;              // first downbeat
export const bar = (n) => T0 + n * BAR;
export const beat = (n) => T0 + n * BEAT;
export const DURATION = 62.0;

// Beat phase helpers ------------------------------------------------------
export const beatPhase = (t) => (((t - T0) / BEAT) % 1 + 1) % 1;
export const halfBarPhase = (t) => (((t - T0) / (BAR / 2)) % 1 + 1) % 1;
export const barPhase = (t) => (((t - T0) / BAR) % 1 + 1) % 1;
// heartbeat: decays after every downbeat ("1 and 3" of the half-time bar)
export const heart = (t, decay = 0.22) => {
  const p = (t - T0) / BAR; const f = p - Math.floor(p);
  return Math.exp(-(f * BAR) / decay);
};

// Key events ----------------------------------------------------------------
export const M = {
  RISER_END: 1.33,
  HIT1: 1.33, HIT2: 1.50, HIT3: 1.86, HIT4: 2.22,
  BASS_OUT_1: 2.40,
  CLAP_A: 3.66, CLAP_B: 4.00,
  HIT_A: 5.15, HIT_B: 5.495, HIT_C: 5.84,
  GROOVE: bar(3),          // 6.074
  BACK_IT: bar(3) + 1.5 * BEAT, // 6.764: off-beat hit in the groove; UP / OR / DOWN holds until here
  PREDROP: bar(5),         // 9.754
  ROLL: bar(6),            // 11.595
  BUILD_END: 14.47,
  GAP: 14.55,
  STAB: 14.81,
  // the stab figure plays out inside the silence, over a swelling bass: false starts for the candle
  STABS: [15.268, 15.388, 15.502, 15.734],
  // the drop is the kick on bar 8's third beat: its attack starts at 16.196 in the audio (16.19 by ear
  // in a DAW). The release must land with it, never ahead: this puts the first release frame at 16.200
  // (the first frame after the attack starts) and keeps the freeze through the frame before it.
  DROP1: 16.19,
  // the eruption cuts on the 808 roll after the kick, and the payouts fly on beat 4
  ERUPT2: 16.30, ERUPT3: 16.40, ERUPT4: 16.647,
  // the bass drops out on bar 9 (17.14) and returns on its fourth beat (18.496): the winner is cut on
  // the hit at 17.338, the loser on the snare at 18.264, and the loser's visor cries as the bass returns
  PAYOFF: 17.338, LOSER: 18.264, CRY: 18.496,
  BASS_GAP_A: [17.14, 18.496],
  BASS_GAP_B: [20.9, 21.9],
  RISE: bar(10),           // 18.955
  DUEL: bar(14),           // 26.316
  ROLL2: 27.47,
  ROLL2_END: bar(16),      // 29.997
  DROP2: 30.90,
  BR: bar(17),             // 31.837
  BASS_GAP_C: [33.5, 34.3],
  LAST: bar(24),           // 44.718
  IMPACT_45: 45.89,
  KNOWN: bar(25),          // 46.558
  BUILD: bar(27),          // 50.239
  BASS_OUT_END: bar(31),   // 57.599
  CLICK: bar(32),          // 59.440
  END: 62.0,
};
