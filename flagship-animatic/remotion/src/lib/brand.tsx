// Brand tokens (Sumi kit, asset-pack/sumi/README.md), fonts, grounds and the obvious placeholder style.
// Self-contained on purpose: this animatic does not import THE LAST STAND or yochi-2p5d, so neither can break it.
import React, { useLayoutEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile } from 'remotion';

export const SUMI = { bg: '#0f0d0b', s1: '#1a1714', s2: '#221e1a', ink: '#efe7d8', muted: '#a39a8a', out: '#8f8676', red: '#ff5436' };
export const PAPER = { bg: '#f2ece0', ink: '#16130f', muted: '#5d5548', out: '#6e665a', red: '#d6402b', redText: '#b3301e' };
export const UP = '#3ddc84';
export const DOWN = '#ff4d6d';
export const UP_P = '#15804a';
export const DOWN_P = '#c2304d';
export const BAND = '#efe7d8';
export const GOLD = '#e0b25a';

export const DELA = "'Dela Gothic One', sans-serif";
export const MONO = "'JetBrains Mono', monospace";
export const ZEN = "'Zen Kaku Gothic New', sans-serif";
export const YUJI = 'YujiSyuku';

/** Kanji used by this film. Every one is on the house allowed list (SHARED-RULES). */
export const KANJI = { vs: '対', lock: '決', win: '勝', loss: '敗', master: '師' } as const;

const FACES: [string, string, string][] = [
  ['Dela Gothic One', 'dela-gothic-one-latin-400-normal.woff2', '400'],
  ['JetBrains Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'],
  ['JetBrains Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'],
  ['JetBrains Mono', 'jetbrains-mono-latin-800-normal.woff2', '800'],
  ['Zen Kaku Gothic New', 'zen-kaku-gothic-new-latin-700-normal.woff2', '700'],
  ['Zen Kaku Gothic New', 'zen-kaku-gothic-new-latin-900-normal.woff2', '900'],
  ['YujiSyuku', 'YujiSyuku-Regular.ttf', '400'],
];
let loading: Promise<unknown> | null = null;
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

export const Label: React.FC<{ size?: number; color?: string; weight?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  size = 30, color = SUMI.ink, weight = 700, style, children,
}) => (
  <div style={{ fontFamily: MONO, fontWeight: weight, fontSize: size, letterSpacing: '0.2em', textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style }}>
    {children}
  </div>
);

export const Moment: React.FC<{ size?: number; color?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ size = 120, color = SUMI.ink, style, children }) => (
  <div style={{ fontFamily: DELA, fontSize: size, lineHeight: 1, color, whiteSpace: 'nowrap', ...style }}>{children}</div>
);

/** Paper ground with washi fibre (procedural, SVG turbulence). */
export const Paper: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill style={{ background: PAPER.bg, opacity }}>
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <filter id="fibre">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves={3} seed={4} />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.16 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#fibre)" />
    </svg>
  </AbsoluteFill>
);

export const Sumi: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${SUMI.s2} 0%, ${SUMI.bg} 70%)`, opacity }} />
);

/** Grain + vignette over everything (the house look, restrained). */
export const Grade: React.FC<{ seed: number }> = ({ seed }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.18 }}>
      <filter id={`g${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={seed % 97} />
      </filter>
      <rect width="100%" height="100%" filter={`url(#g${seed})`} />
    </svg>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)' }} />
  </AbsoluteFill>
);

/** The seal: vermilion rounded square with a glyph (or the Yochi seal art). */
export const Seal: React.FC<{ glyph: string; size: number; color?: string; ink?: string }> = ({ glyph, size, color = SUMI.red, ink = '#140f0c' }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.14, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.08)' }}>
    <span style={{ fontFamily: YUJI, fontSize: size * 0.72, color: ink, lineHeight: 1, marginTop: size * 0.04 }}>{glyph}</span>
  </div>
);

/**
 * PLACEHOLDER for artwork that doesn't exist yet. Deliberately ugly and obvious: hatched, outlined, labelled with
 * the brief id from docs/IMAGE_BRIEFS.md. Never disguise it with effects.
 */
export const Placeholder: React.FC<{ id: string; what: string; style?: React.CSSProperties; dark?: boolean }> = ({ id, what, style, dark }) => (
  <div style={{ position: 'absolute', border: '4px dashed #00c8d7', background: `repeating-linear-gradient(45deg, rgba(0,200,215,0.20) 0 14px, rgba(0,200,215,0.05) 14px 28px)`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12, boxSizing: 'border-box',
    color: dark ? '#0b3b40' : '#7ff3fb', fontFamily: MONO, fontWeight: 800, ...style }}>
    <div style={{ fontSize: 26, letterSpacing: '0.15em' }}>PLACEHOLDER · {id}</div>
    <div style={{ fontSize: 20, fontWeight: 500, marginTop: 6, maxWidth: 700 }}>{what}</div>
  </div>
);

/** Small animatic slate in the corner: shot id and act. Off in a clean render. */
export const Slate: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 24, bottom: 18, fontFamily: MONO, fontSize: 18, fontWeight: 700, color: '#7ff3fb', background: 'rgba(0,0,0,0.55)',
    padding: '4px 10px', letterSpacing: '0.1em' }}>{text}</div>
);
