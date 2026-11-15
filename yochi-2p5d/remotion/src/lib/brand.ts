// Brand tokens and guards, from asset-pack/sumi/README.md and SHARED-RULES.md (the source of truth).
// Only what the 2.5D components need; never invent new colours here.

export const SUMI = { bg: '#0f0d0b', surface1: '#1a1714', surface2: '#221e1a', ink: '#efe7d8', muted: '#a39a8a', out: '#8f8676', red: '#ff5436', onRed: '#140f0c' } as const;
export const PAPER = { bg: '#f2ece0', surface1: '#fbf8f2', surface2: '#f1eadc', ink: '#16130f', muted: '#5d5548', out: '#6e665a', red: '#d6402b', redText: '#b3301e', onRed: '#fff8ef' } as const;
export type Ground = 'paper' | 'sumi';
export const tokens = (g: Ground) => (g === 'paper' ? PAPER : SUMI);

/** SHARED-RULES kanji (native review done, Nov 2026). Anything else needs review before use. */
export const ALLOWED_KANJI = ['予知', '対', '決', '勝', '敗', '命', '連勝', '氷', '師'] as const;
export type Kanji = (typeof ALLOWED_KANJI)[number];
export function assertKanji(g: string): asserts g is Kanji {
  if (!(ALLOWED_KANJI as readonly string[]).includes(g)) {
    throw new Error(`Glyph "${g}" is not on the SHARED-RULES allowed list (${ALLOWED_KANJI.join(' ')}). Get it reviewed first.`);
  }
}

export const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgb01 = (hex: string): [number, number, number] => rgb(hex).map((v) => v / 255) as [number, number, number];

/** House motion limits (docs/YOCHI_MOTION_STYLE_GUIDE.md section 5, rung 4: whole-figure transforms). */
export const LIMITS = {
  breathScale: 0.015, // <=1.5% breathing scale, anchored at the frame edge
  swayDeg: 2, //         <=2 deg tilt
  houseShakePx: 6, //    impact shake on the stamped surface
  houseShakeS: 0.38,
  flashFrames: 2, //     at most 2 frames of paper-white
} as const;
