// All timings for the two editorial treatments live here (seconds, 60 fps). Audio is built from the same numbers
// (../audio/build.py reads timing.json, written by `npm run timing`). Beat = the flagship's 142.3 BPM grid.
export const FPS = 60;
export const BEAT = 0.34095;

export type Method = 'cut-smear' | 'smear' | 'dissolve-masked' | 'cut-masked' | 'dissolve-full';

export interface Cut {
  dur: number;
  // Beat A: the ink wave clears (brushWipe p 0.55 -> 1 between wave0 and wave1), the reveal hit, the settle
  wave0: number; wave1: number; hit: number; settle: number;
  // Beat B: the push in; breathing fades out to stillness
  push0: number; push1: number; still: number;
  // Beat C: the inhale (rigid rise), the swap (pose A -> pose B in the change region), the body crossfade, the hold
  rise0: number; swap: number; swapFrames: number; body0: number; body1: number; lift1: number;
  // the exit, and the camera keys [cx, cy, z] in stage px (stage = 1920x1080 at z = 1)
  exit0: number;
  cams: { t: number; c: [number, number, number] }[];
  greyMax: number; // the loss grade on the figure (0..1); the world greys a little less
  seal?: number;   // the grey 敗 seal and the amount (trailer only)
}

// Version A, cinematic: 6.0 s. Long, deliberate stillness; the head comes up on a slow tilt; 1.5 s on the face.
export const CINEMATIC: Cut = {
  dur: 6.0,
  wave0: 0, wave1: 0.55, hit: 0.22, settle: 0.8,
  push0: 1.6, push1: 3.7, still: 3.1,
  rise0: 3.45, swap: 3.86, swapFrames: 8, body0: 4.2, body1: 5.2, lift1: 4.7,
  exit0: 5.62,
  cams: [
    { t: 0.0, c: [972, 548, 1.0] },
    { t: 1.6, c: [984, 530, 1.05] },
    { t: 3.45, c: [1072, 392, 1.36] },
    { t: 4.6, c: [1050, 318, 1.62] },
    { t: 6.0, c: [1046, 312, 1.68] },
  ],
  greyMax: 0.5,
};

// Version B, trailer-paced: 8 beats (2.73 s). The wave clears fast, one push, the head comes up on beat 3, the grey
// 敗 seal stamps on beat 4, hard cut out (the montage cuts to the next reaction).
export const TRAILER: Cut = {
  dur: 8 * BEAT,
  wave0: 0, wave1: 0.3, hit: 0.1, settle: 0.45,
  push0: 0.2, push1: 1.0, still: 0.85,
  rise0: 0.78, swap: 3 * BEAT - 0.03, swapFrames: 5, body0: 1.15, body1: 1.9, lift1: 1.5,
  exit0: 99,
  cams: [
    { t: 0.0, c: [972, 548, 1.0] },
    { t: 0.95, c: [1060, 410, 1.3] },
    { t: 1.5, c: [1040, 330, 1.56] },
    { t: 8 * BEAT, c: [1036, 322, 1.62] },
  ],
  greyMax: 0.55,
  seal: 4 * BEAT,
};

// Version B-6, the X2 slot as it stands (2.04 s = 6 beats, flagship 65.31-67.35): the same performance compressed.
// Reveal and push in 2 beats, the head comes up on beat 2, the 敗 seal on beat 3, held to the cut.
export const TRAILER6: Cut = {
  dur: 6 * BEAT,
  wave0: 0, wave1: 0.24, hit: 0.08, settle: 0.36,
  push0: 0.12, push1: 0.66, still: 0.55,
  rise0: 0.46, swap: 2 * BEAT - 0.03, swapFrames: 5, body0: 0.85, body1: 1.5, lift1: 1.2,
  exit0: 99,
  cams: [
    { t: 0.0, c: [972, 548, 1.0] },
    { t: 0.66, c: [1060, 410, 1.3] },
    { t: 1.15, c: [1040, 330, 1.56] },
    { t: 6 * BEAT, c: [1036, 324, 1.6] },
  ],
  greyMax: 0.55,
  seal: 3 * BEAT,
};
