// Every timing for the six test cuts (seconds, 60 fps). Audio reads the same numbers via tools/timing.mts.
export const FPS = 60;
export const BEAT = 0.34095;

// ---------------------------------------------------------------- High Roller (win)
export interface HRCut { dur: number; toss: number; hang: number; fall: number; laughs: number[]; amount: number; cams: { t: number; c: [number, number, number] }[] }
export const HR_CINEMATIC: HRCut = {
  dur: 5.2, toss: 0.35, hang: 0.62, fall: 3.3, laughs: [0.4, 0.78, 1.12], amount: 1.7,
  cams: [{ t: 0, c: [900, 545, 1.0] }, { t: 1.5, c: [945, 330, 1.5] }, { t: 5.2, c: [960, 300, 1.58] }],
};
export const HR_TRAILER: HRCut = { // 4 beats
  dur: 4 * BEAT, toss: 0.06, hang: 0.3, fall: 2 * BEAT + 0.1, laughs: [0.1, 0.4], amount: BEAT,
  cams: [{ t: 0, c: [920, 470, 1.2] }, { t: 4 * BEAT, c: [955, 310, 1.55] }],
};

// ---------------------------------------------------------------- Cold Blooded (defeat)
export interface CBCut {
  dur: number; card: boolean;      // card: open on the v2 card (mask at the chest) and cut on the gesture
  greyIn: number; greyFull: number; cut: number; settle: number; seal?: number; exit0: number;
  cams1: { t: number; c: [number, number, number] }[]; cams2: { t: number; c: [number, number, number] }[];
}
export const CB_CINEMATIC: CBCut = {
  dur: 6.4, card: true, greyIn: 0.6, greyFull: 2.0, cut: 2.05, settle: 2.4, exit0: 6.0,
  cams1: [{ t: 0, c: [900, 560, 1.0] }, { t: 1.9, c: [880, 520, 1.06] }, { t: 2.05, c: [880, 430, 1.07] }],
  cams2: [{ t: 2.05, c: [960, 640, 1.0] }, { t: 2.35, c: [960, 600, 1.0] }, { t: 6.4, c: [930, 520, 1.14] }],
};
export const CB_SINGLE: CBCut = { // the new painting alone: start on the mask, tilt down to the bowed face
  dur: 5.4, card: false, greyIn: 0.2, greyFull: 2.2, cut: 0, settle: 1.2, exit0: 99,
  cams1: [{ t: 0, c: [0, 0, 1] }],
  cams2: [{ t: 0, c: [985, 300, 1.55] }, { t: 2.4, c: [930, 420, 1.3] }, { t: 5.4, c: [930, 540, 1.04] }],
};
export const CB_TRAILER: CBCut = { // 6 beats: card 2 beats, the gesture cut on beat 2, 敗 on beat 3
  dur: 6 * BEAT, card: true, greyIn: 0.05, greyFull: 0.6, cut: 2 * BEAT, settle: 2 * BEAT + 0.3, seal: 3 * BEAT, exit0: 99,
  cams1: [{ t: 0, c: [895, 545, 1.02] }, { t: 2 * BEAT - 0.12, c: [880, 520, 1.06] }, { t: 2 * BEAT, c: [880, 430, 1.07] }],
  cams2: [{ t: 2 * BEAT, c: [960, 640, 1.0] }, { t: 2 * BEAT + 0.25, c: [960, 600, 1.0] }, { t: 6 * BEAT, c: [945, 560, 1.08] }],
};

// ---------------------------------------------------------------- Untouchable (win)
export interface UNCut {
  dur: number; reveal0: number; reveal1: number; gust: number; freeze: number; freezeFor: number; amount: number;
  ribbons: number; // ribbon motion amplitude (canvas px at the tips); 0 = the painting held rigid (A/B)
  cams: { t: number; c: [number, number, number] }[];
}
export const UN_CINEMATIC: UNCut = {
  dur: 7.6, reveal0: 0.15, reveal1: 2.4, gust: 4.1, freeze: 4.45, freezeFor: 0.5, amount: 4.5, ribbons: 9,
  cams: [{ t: 0, c: [960, 560, 1.0] }, { t: 2.6, c: [990, 560, 1.03] }, { t: 7.6, c: [1080, 330, 1.62] }],
};
export const UN_TRAILER: UNCut = { // 6 beats: ink bloom in 1.5 beats, the freeze on beat 3
  dur: 6 * BEAT, reveal0: 0.0, reveal1: 0.6, gust: 2 * BEAT + 0.2, freeze: 3 * BEAT, freezeFor: 0.3, amount: 3 * BEAT + 0.02, ribbons: 10,
  cams: [{ t: 0, c: [985, 545, 1.04] }, { t: 6 * BEAT, c: [1070, 360, 1.5] }],
};
