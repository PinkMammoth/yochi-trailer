// Every timing for the v2 cuts (seconds, 60 fps). Audio reads the same numbers via tools/timing.mts.
export const FPS = 60;
export const BEAT = 0.34095;
type Key = { t: number; c: [number, number, number] };

// ---------------------------------------------------------------- Untouchable v2 (win)
export interface UNCut {
  dur: number; reveal0: number; reveal1: number;
  breeze: number;            // the standing wind (0..1)
  gusts: { t: number; k: number; w: number }[]; // wind gusts: time, strength, width (s)
  freeze: number; freezeFor: number; amount: number;
  ribbons: number;           // global ribbon amplitude scale (1 = the authored per-strand amplitudes; 0 = rigid A/B)
  sweep: [number, number];   // the light sweep: start, end (s)
  cams: Key[];
}
export const UN_CINEMATIC: UNCut = {
  dur: 6.8, reveal0: 0.1, reveal1: 2.1, breeze: 0.55,
  gusts: [{ t: 3.0, k: 0.45, w: 0.7 }, { t: 4.05, k: 0.9, w: 0.42 }],
  freeze: 4.35, freezeFor: 0.55, amount: 4.38, ribbons: 1, sweep: [1.4, 4.4],
  cams: [{ t: 0, c: [960, 540, 1.0] }, { t: 2.4, c: [975, 540, 1.04] }, { t: 4.35, c: [990, 470, 1.22] }, { t: 6.8, c: [985, 360, 1.52] }],
};
export const UN_TRAILER: UNCut = { // 6 beats: the bloom in 1.5 beats, the gust into the freeze on beat 3
  dur: 6 * BEAT, reveal0: 0, reveal1: 0.55, breeze: 0.65,
  gusts: [{ t: 3 * BEAT - 0.22, k: 0.9, w: 0.3 }],
  freeze: 3 * BEAT, freezeFor: 0.3, amount: 3 * BEAT + 0.02, ribbons: 1, sweep: [0.1, 1.0],
  cams: [{ t: 0, c: [980, 545, 1.05] }, { t: 6 * BEAT, c: [990, 400, 1.42] }],
};

// ---------------------------------------------------------------- Cold Blooded v2 (defeat): the mask gesture
export interface CBCut {
  dur: number; method: 'concealed' | 'layered';
  greyIn: number; greyFull: number;          // the loss reaches the world, then him
  tilt0: number; tilt1: number;              // (concealed) the camera rises from the chest to the face
  lift0: number; lift1: number;              // the mask rises (A's own hand starts it; B's mask arrives)
  swap: number;                              // (layered) the masked cut A -> B; (concealed) the head settles into the mask
  settle: number; washIn: number; exit0: number;
  seal?: number;
  cams: Key[];
}
// B (chosen): concealed. Medium on the lowered mask and his face; the camera rises with his hand; the mask rises into
// frame over his face; the head settles into it; pull back to the whole painting as the grey washes in.
export const CB_CONCEALED: CBCut = {
  dur: 6.2, method: 'concealed', greyIn: 0.5, greyFull: 1.6,
  tilt0: 1.45, tilt1: 2.35, lift0: 2.05, lift1: 3.5, swap: 3.7, settle: 3.7, washIn: 4.1, exit0: 99,
  cams: [{ t: 0, c: [700, 560, 1.75] }, { t: 1.45, c: [705, 520, 1.82] }, { t: 2.35, c: [690, 330, 2.25] }, { t: 3.9, c: [688, 322, 2.3] }, { t: 6.2, c: [640, 520, 1.36] }],
};
export const CB_CONCEALED_TRAILER: CBCut = { // 7 beats
  dur: 7 * BEAT, method: 'concealed', greyIn: 0.05, greyFull: 0.7,
  tilt0: 0.25, tilt1: 0.8, lift0: 0.62, lift1: 1.5, swap: 1.62, settle: 1.62, washIn: 1.8, exit0: 99, seal: 5 * BEAT,
  cams: [{ t: 0, c: [705, 540, 1.8] }, { t: 0.25, c: [705, 525, 1.82] }, { t: 0.8, c: [690, 330, 2.25] }, { t: 1.75, c: [688, 322, 2.3] }, { t: 7 * BEAT, c: [655, 470, 1.6] }],
};
// A: layered, registered. The whole figure; A's arm and mask rise (rigid, the forearm stretching a little out of the
// sleeve), then a masked cut with smear frames to B over the change region.
export const CB_LAYERED: CBCut = {
  dur: 6.0, method: 'layered', greyIn: 0.5, greyFull: 1.6,
  tilt0: 0, tilt1: 0, lift0: 2.05, lift1: 3.0, swap: 2.62, settle: 2.8, washIn: 3.9, exit0: 99,
  cams: [{ t: 0, c: [640, 640, 1.18] }, { t: 2.0, c: [650, 600, 1.24] }, { t: 3.0, c: [660, 520, 1.36] }, { t: 6.0, c: [650, 520, 1.4] }],
};
