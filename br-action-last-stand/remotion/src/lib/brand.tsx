// Brand tokens re-exported from the 2.5D package (one source), plus the film's type and font loading.
import React, { useLayoutEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
export { SUMI, PAPER, tokens, ALLOWED_KANJI, assertKanji } from '../../../../yochi-2p5d/remotion/src/lib/brand';

export const UP = '#3ddc84';
export const DOWN = '#ff4d6d';
export const UP_PAPER = '#15804a';
export const DOWN_PAPER = '#c2304d';
export const BAND = '#efe7d8';

export const DELA = "'Dela Gothic One', sans-serif";
export const MONO = "'JetBrains Mono', monospace";
export const ZEN = "'Zen Kaku Gothic New', sans-serif";
export const YUJI = 'YujiSyuku';

const FACES: [string, string, string][] = [
  ['Dela Gothic One', 'dela-gothic-one-latin-400-normal.woff2', '400'],
  ['JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'],
  ['JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'],
  ['JetBrains Mono', 'jetbrains-mono-latin-800-normal.woff2', '800'],
  ['Zen Kaku Gothic New', 'zen-kaku-gothic-new-latin-700-normal.woff2', '700'],
  ['YujiSyuku', 'YujiSyuku-Regular.ttf', '400'],
];
let loading: Promise<unknown> | null = null;
/** Loads the kit's fonts once; the render waits for them. */
export function useFonts() {
  const [h] = useState(() => delayRender('fonts'));
  useLayoutEffect(() => {
    loading ??= Promise.all(
      FACES.map(([fam, file, weight]) =>
        new FontFace(fam, `url(${staticFile('fonts/' + file)})`, { weight }).load().then((ff) => {
          (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
        }),
      ),
    );
    loading.then(() => continueRender(h));
  }, [h]);
}

/** Tracked caps label in JetBrains Mono (about 0.2 em). */
export const Label: React.FC<{ size?: number; color?: string; weight?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  size = 30, color, weight = 700, style, children,
}) => (
  <div style={{ fontFamily: MONO, fontWeight: weight, fontSize: size, letterSpacing: '0.2em', textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style }}>
    {children}
  </div>
);
