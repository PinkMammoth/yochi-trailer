// THE CANDLE DOESN'T CARE: the one timing map. Picture (Film.tsx) and sound (tools/make_audio.py reads
// timing.json, which `npm run timing` writes from this file) share it, so a retime is one edit here.
// All times in seconds.

export const FPS = 60;

export const T = {
  dur: 14.25,
  // act one: played completely straight
  s1: [0.0, 2.5] as const, //   wide: the blood moon, slow tilt down and push
  cap1: [0.3, 2.35] as const, // "I have studied the markets for twenty years..."
  s2: [2.5, 5.0] as const, //   medium: the push toward his hand on the mask
  cap2: [2.7, 4.85] as const, // "I have mastered technical analysis..."
  s3: [5.0, 6.4] as const, //   the eyes, letterboxed
  cap3: [5.2, 6.3] as const, //  "I cannot lose."
  // act two: the silence, the candle
  silence: 6.4, //  back to the wide; the music cuts to true digital silence
  shadow: 7.12, //  a shadow falls over him
  candleIn: 7.46, // the candle enters the top of frame
  impact: 7.7, //   contact
  // act three: aftermath
  sandalsOut: 8.3, // both sandals have left the top of frame
  returnStart: 8.9, // one sandal falls back in
  land1: 9.18, //   lands on the candle (squeak)
  land2: 9.36, //   small bounce lands (smaller squeak)
  settle: 9.66, //  rocking stops
  title: 10.0, //   THE CANDLE DOESN'T CARE.
  end: 11.6, //     cut to paper: the end card
  stamp: 11.75, //  seal contact
} as const;

export const DURATION_FRAMES = Math.round(T.dur * FPS);
