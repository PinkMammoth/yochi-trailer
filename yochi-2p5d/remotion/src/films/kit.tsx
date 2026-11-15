// Shared pieces for the 9:16 films in src/films (NEW CHALLENGER, THE SWAP TAX). Everything is a pure function
// of the frame. Brand values come from lib/brand.ts (the Sumi kit); motion numbers are the style guide's
// (docs/YOCHI_MOTION_STYLE_GUIDE.md section 5): stamp, slam, impact shake, ink flood.
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Easing, Img, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PAPER, SUMI, assertKanji, rgb, type Kanji } from '../lib/brand';
import { clamp, mulberry, vnoise } from '../lib/shot';

export const FPS = 60;
export const W = 1080;
export const H = 1920;
/** Title-safe at 5% of the short side and the long side: 54 px left/right, 96 px top/bottom (1080x1920). */
export const SAFE = { x: 54, y: 96 };

// ---------------------------------------------------------------- fonts (Sumi kit, asset-pack/sumi/fonts)
const FACES: [string, string, string][] = [
  ['Dela', 'dela-gothic-one-latin-400-normal.woff2', '400'],
  ['Mono', 'jetbrains-mono-latin-500-normal.woff2', '500'],
  ['Mono', 'jetbrains-mono-latin-700-normal.woff2', '700'],
  ['Mono', 'jetbrains-mono-latin-800-normal.woff2', '800'],
  ['Zen', 'zen-kaku-gothic-new-latin-700-normal.woff2', '700'],
  ['Zen', 'zen-kaku-gothic-new-latin-900-normal.woff2', '900'],
  ['YujiSyuku', 'YujiSyuku-Regular.ttf', '400'],
];
let fontsP: Promise<void> | null = null;
export function useFilmFonts() {
  const [h] = useState(() => delayRender('film fonts'));
  useLayoutEffect(() => {
    fontsP ??= Promise.all(
      FACES.map(([fam, file, weight]) =>
        new FontFace(fam, `url(${staticFile('fonts/' + file)})`, { weight }).load().then((ff) => {
          (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
        }),
      ),
    ).then(() => undefined);
    fontsP.then(() => continueRender(h));
  }, [h]);
}
export const DELA = "'Dela', sans-serif";
export const MONO = "'Mono', monospace";
export const ZEN = "'Zen', sans-serif";

// ---------------------------------------------------------------- time helpers
export const useT = () => useCurrentFrame() / useVideoConfig().fps;
export const sec = (s: number) => Math.round(s * FPS);
export const ease = Easing.bezier(0.2, 0.9, 0.3, 1.2);
export const easeIO = Easing.bezier(0.65, 0, 0.35, 1);
export const easeO = Easing.bezier(0.16, 1, 0.3, 1);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const prog = (t: number, t0: number, d: number) => clamp((t - t0) / d);

/** The brand stamp (sumi.css yo-stamp): scale 2.8 / -28deg -> 0.9 -> 1.05 -> 1.0 / rest over 0.5 s, contact ~0.07 s in. */
export function stampK(t: number, t0: number, rest = -10) {
  const LEAD = 4 / 30; // contact lands on t0
  const p = clamp((t - (t0 - LEAD)) / 0.5);
  if (t < t0 - LEAD) return { on: false, scale: 2.8, rot: -28, opacity: 0 };
  const keys = [0, 0.55, 0.72, 1];
  const seg = (vals: number[]) => {
    for (let i = 0; i < 3; i++) {
      if (p <= keys[i + 1] || i === 2) return vals[i] + (vals[i + 1] - vals[i]) * ease(Math.min(1, (p - keys[i]) / (keys[i + 1] - keys[i])));
    }
    return vals[3];
  };
  return { on: true, scale: seg([2.8, 0.9, 1.05, 1]), rot: seg([-28, rest + 1, rest, rest]), opacity: p >= 0.55 ? 1 : ease(p / 0.55) };
}
/** Slam (cards, names, callouts): x1.35 -> x1.0 in 0.16 s, first full frame on the hit. */
export function slamK(t: number, t0: number) {
  if (t < t0) return { on: false, scale: 1.35, opacity: 0 };
  const p = clamp((t - t0) / 0.16);
  return { on: true, scale: 1.35 - 0.35 * easeO(p), opacity: 1 };
}
/** Impact shake: decaying band-limited noise with a hard first kick. House: 6 px / 0.38 s. */
export function shake(t: number, t0: number, amp = 6, dur = 0.38, seed = 1): [number, number, number] {
  if (t < t0) return [0, 0, 0];
  const s = t - t0;
  const env = Math.exp(-s * (3 / dur));
  if (env < 0.01) return [0, 0, 0];
  const n = s * FPS * 0.45;
  const kick = s < 1 / FPS ? 1 : 0;
  return [
    amp * env * (vnoise(n, seed) * 2 - 1) + kick * amp * 0.5,
    amp * env * (vnoise(n, seed + 1) * 2 - 1) - kick * amp * 0.4,
    0.027 * amp * env * (vnoise(n, seed + 2) * 2 - 1),
  ];
}
/** Sum of several shakes. */
export const addShake = (...s: [number, number, number][]) => s.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]);

// ---------------------------------------------------------------- grounds
/** Paper with washi fibre (procedural, as lib/draw.js paper and the approved Elysium card). Static. */
export const Paper: React.FC<{ w?: number; h?: number; seed?: number; style?: React.CSSProperties }> = ({ w = W, h = H, seed = 11, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.fillStyle = PAPER.bg;
    ctx.fillRect(0, 0, w, h);
    const r = mulberry(seed);
    // long horizontal fibres, light and dark
    for (let i = 0; i < (w * h) / 900; i++) {
      const x = r() * w, y = r() * h, len = 20 + r() * 160;
      ctx.strokeStyle = r() < 0.55 ? `rgba(120,104,80,${0.03 + r() * 0.06})` : `rgba(255,252,245,${0.25 + r() * 0.35})`;
      ctx.lineWidth = 0.6 + r() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (r() - 0.5) * 3);
      ctx.stroke();
    }
    // a few sumi specks
    for (let i = 0; i < (w * h) / 40000; i++) {
      ctx.fillStyle = `rgba(22,19,15,${0.08 + r() * 0.2})`;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 0.5 + r() * 1.6, 0, 6.283);
      ctx.fill();
    }
    // soft bokashi at the edges
    const g = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.5, h * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(90,72,48,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, [w, h, seed]);
  return <canvas ref={ref} width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, ...style }} />;
};

/** Sumi ground: warm black with a faint surface mottle (no raster textures exist in the kit). Static. */
export const Sumi: React.FC<{ w?: number; h?: number; seed?: number; style?: React.CSSProperties }> = ({ w = W, h = H, seed = 5, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.fillStyle = SUMI.bg;
    ctx.fillRect(0, 0, w, h);
    const r = mulberry(seed);
    for (let i = 0; i < 90; i++) {
      const x = r() * w, y = r() * h, rad = 80 + r() * 380;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(34,30,26,${0.15 + r() * 0.25})`);
      g.addColorStop(1, 'rgba(34,30,26,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < (w * h) / 1400; i++) {
      ctx.strokeStyle = `rgba(239,231,216,${0.008 + r() * 0.02})`;
      ctx.lineWidth = 0.6 + r();
      const x = r() * w, y = r() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 20 + r() * 120, y + (r() - 0.5) * 2);
      ctx.stroke();
    }
  }, [w, h, seed]);
  return <canvas ref={ref} width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, ...style }} />;
};

/** Grain + vignette over everything (static grain pattern shifted per frame). */
export const FilmGrade: React.FC<{ vignette?: number; grain?: number }> = ({ vignette = 0.35, grain = 0.06 }) => {
  const f = useCurrentFrame();
  const url = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(256, 256);
    const r = mulberry(99);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.round(r() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }, []);
  const ox = Math.floor(mulberry(f * 7 + 1)() * 256), oy = Math.floor(mulberry(f * 13 + 3)() * 256);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${url})`, backgroundPosition: `${ox}px ${oy}px`, opacity: grain, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(8,6,4,${vignette}) 100%)`, pointerEvents: 'none' }} />
    </>
  );
};

// ---------------------------------------------------------------- marks
/** The Yochi seal (asset-pack/sumi/logo/yochi-seal-*.svg, never redrawn) stamping down on t0. */
export const SealStamp: React.FC<{ t: number; t0: number; x: number; y: number; size: number; ground: 'paper' | 'sumi' }> = ({ t, t0, x, y, size, ground }) => {
  const k = stampK(t, t0, -6);
  if (!k.on) return null;
  return (
    <Img
      src={staticFile(`brand/yochi-seal-${ground}.svg`)}
      style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${k.scale}) rotate(${k.rot}deg)`, opacity: k.opacity, filter: 'drop-shadow(0 8px 14px rgba(22,19,15,0.22))' }}
    />
  );
};

/** The seal as an inline element (for a centred lockup row): same stamp curve, its own box keeps the layout. */
export const InlineSeal: React.FC<{ t: number; t0: number; size: number; ground?: 'paper' | 'sumi' }> = ({ t, t0, size, ground = 'sumi' }) => {
  const k = stampK(t, t0, -6);
  return (
    <div style={{ width: size, height: size, flex: 'none' }}>
      {k.on && <Img src={staticFile(`brand/yochi-seal-${ground}.svg`)} style={{ width: size, height: size, transform: `scale(${k.scale}) rotate(${k.rot}deg)`, opacity: k.opacity, filter: 'drop-shadow(0 8px 14px rgba(22,19,15,0.22))' }} />}
    </div>
  );
};

/** Ink splatter around a point (lib/draw.js splatter idea), appearing on t0. Deterministic. */
export const Splatter: React.FC<{ t: number; t0: number; x: number; y: number; spread: number; color: string; n?: number; seed?: number }> = ({ t, t0, x, y, spread, color, n = 14, seed = 3 }) => {
  if (t < t0) return null;
  const r = mulberry(seed);
  const k = easeO(clamp((t - t0) / 0.12));
  const dots = Array.from({ length: n }, () => {
    const a = r() * 6.283, d = spread * (0.55 + r() * 0.6), s = 3 + Math.pow(r(), 2.5) * 16;
    return { x: x + Math.cos(a) * d * k, y: y + Math.sin(a) * d * k, s, e: 1 + r() * 1.4, rot: a };
  });
  return (
    <>
      {dots.map((d, i) => (
        <div key={i} style={{ position: 'absolute', left: d.x - d.s, top: d.y - d.s / 2, width: d.s * 2 * d.e, height: d.s, borderRadius: '50%', background: color, transform: `rotate(${d.rot}rad)` }} />
      ))}
    </>
  );
};

/** A hanko with one allowed kanji (SHARED-RULES list, checked), stamping on t0 with the brand curve. */
export const KanjiSeal: React.FC<{ t: number; t0: number; glyph: Kanji; x: number; y: number; size: number; ground: 'paper' | 'sumi'; tone?: 'red' | 'out' }> = ({ t, t0, glyph, x, y, size, ground, tone = 'red' }) => {
  assertKanji(glyph);
  const k = stampK(t, t0, -8);
  if (!k.on) return null;
  const tk = ground === 'paper' ? PAPER : SUMI;
  const fill = tone === 'red' ? tk.red : 'transparent';
  const col = tone === 'red' ? tk.onRed : tk.out;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${k.scale}) rotate(${k.rot}deg)`, opacity: k.opacity,
      background: fill, border: tone === 'out' ? `${size * 0.05}px solid ${tk.out}` : undefined, borderRadius: size * 0.16, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'YujiSyuku', serif", fontSize: size * ([...glyph].length > 1 ? 0.4 : 0.62), color: col, lineHeight: 1, boxShadow: tone === 'red' ? '0 6px 12px rgba(0,0,0,0.25)' : undefined }}>
      {glyph}
    </div>
  );
};

// ---------------------------------------------------------------- type
/** A line of type that slams in on t0 (first full frame on the hit). Centre-anchored. */
export const SlamText: React.FC<{
  t: number; t0: number; x: number; y: number; size: number; color: string; font?: string; tracking?: number;
  weight?: number; children: React.ReactNode; align?: 'center' | 'left'; out?: number; style?: React.CSSProperties;
}> = ({ t, t0, x, y, size, color, font = DELA, tracking = 0, weight = 400, children, align = 'center', out, style }) => {
  const k = slamK(t, t0);
  if (!k.on || (out !== undefined && t >= out)) return null;
  return (
    <div
      style={{
        position: 'absolute', left: align === 'center' ? 0 : x, top: y, width: align === 'center' ? W : undefined,
        textAlign: align, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1, color,
        letterSpacing: `${tracking}em`, whiteSpace: 'nowrap', transform: `translateY(-50%) scale(${k.scale})`,
        transformOrigin: align === 'center' ? `${x}px 50%` : 'left center', ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Tracked mono caps label. */
export const Label: React.FC<{ x: number; y: number; size?: number; color: string; children: React.ReactNode; align?: 'left' | 'center' | 'right'; weight?: number; tracking?: number; style?: React.CSSProperties }> = ({
  x, y, size = 30, color, children, align = 'left', weight = 700, tracking = 0.2, style,
}) => (
  <div
    style={{
      position: 'absolute', top: y, left: align === 'left' ? x : align === 'center' ? 0 : undefined, right: align === 'right' ? W - x : undefined,
      width: align === 'center' ? W : undefined, textAlign: align, fontFamily: MONO, fontWeight: weight, fontSize: size,
      letterSpacing: `${tracking}em`, color, lineHeight: 1, whiteSpace: 'nowrap', transform: 'translateY(-50%)', ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------- parchment
/** One parchment fragment: paper with ruled mono marks, torn edge. Drawn once per seed. */
export type Fragment = { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; flip: number; seed: number; delay: number };
export function makeFragments(n: number, seed: number, cx: number, cy: number, spreadX: number, spreadY: number, power = 1): Fragment[] {
  const r = mulberry(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = r() * 6.283;
    const v = (500 + r() * 1700) * power;
    return {
      x: cx + (r() - 0.5) * spreadX, y: cy + (r() - 0.5) * spreadY,
      vx: Math.cos(a) * v * 1.2, vy: Math.sin(a) * v - 500 * power,
      w: 40 + Math.pow(r(), 1.6) * 190, h: 30 + Math.pow(r(), 1.6) * 130,
      rot: r() * 360, vr: (r() - 0.5) * 900, flip: r() * 6.283, seed: seed * 1000 + i, delay: r() * 0.05,
    };
  });
}
/** Fragment position at time s after the burst: drag, gravity, flutter. */
export function fragAt(fr: Fragment, s: number) {
  const drag = 3.2;
  const e = (1 - Math.exp(-drag * s)) / drag;
  const flutter = Math.sin(s * 7 + fr.flip) * 40 * Math.min(1, s * 2);
  return {
    x: fr.x + fr.vx * e + flutter,
    y: fr.y + fr.vy * e + 260 * s * s + 120 * s,
    rot: fr.rot + fr.vr * e + Math.sin(s * 5 + fr.flip) * 25,
    sx: Math.cos(s * 6 + fr.flip), // a turning sheet: its width foreshortens
  };
}
export const FragmentSprite: React.FC<{ fr: Fragment; grey?: boolean }> = ({ fr, grey }) => {
  const url = useMemo(() => {
    const c = document.createElement('canvas');
    const w = Math.round(fr.w), h = Math.round(fr.h);
    c.width = w + 8;
    c.height = h + 8;
    const ctx = c.getContext('2d')!;
    const r = mulberry(fr.seed);
    ctx.translate(4, 4);
    ctx.beginPath();
    const pts: [number, number][] = [];
    const jag = (n: number, f: (u: number) => [number, number]) => { for (let i = 0; i <= n; i++) pts.push(f(i / n)); };
    jag(6, (u) => [u * w, (r() - 0.5) * 6]);
    jag(5, (u) => [w + (r() - 0.5) * 6, u * h]);
    jag(6, (u) => [w - u * w, h + (r() - 0.5) * 6]);
    jag(5, (u) => [(r() - 0.5) * 6, h - u * h]);
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = grey ? '#d9d2c4' : '#efe7d8';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(22,19,15,0.55)';
    for (let y = 10; y < h - 6; y += 9 + r() * 4) {
      const x0 = 6 + r() * 6, len = (w - 18) * (0.4 + r() * 0.6);
      ctx.fillRect(x0, y, len, 2);
    }
    ctx.restore();
    return c.toDataURL();
  }, [fr, grey]);
  return <Img src={url} style={{ position: 'absolute', left: 0, top: 0 }} />;
};

export const rgba = (hex: string, a: number) => `rgba(${rgb(hex).join(',')},${a})`;
export { PAPER, SUMI };
