// Camera-on-painting shots, the candle, the versus band, the timer. Rebuilt from the kit's reference screens.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { BAND, DELA, DOWN, MONO, SUMI, UP } from './brand';

/**
 * A painting under a camera. The image point (fx, fy) (image px) sits at screen (sx, sy); zoom = screen px per
 * image px; rot in degrees. Whole-image transform only: the painting itself is never altered.
 */
export const Shot: React.FC<{ src: string; w: number; h: number; fx: number; fy: number; zoom: number; sx?: number; sy?: number; rot?: number;
  opacity?: number; filter?: string; style?: React.CSSProperties }> = ({ src, w, h, fx, fy, zoom, sx = 960, sy = 540, rot = 0, opacity = 1, filter, style }) => (
  <Img src={staticFile(src)} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transformOrigin: `${fx}px ${fy}px`,
    transform: `translate(${sx - fx}px, ${sy - fy}px) rotate(${rot}deg) scale(${zoom})`, opacity, filter, ...style }} />
);

export type OHLC = { o: number; h: number; l: number; c: number };

/** A candle chart: past candles for context, a live candle, the strike as a dashed line. Standard OHLC colours. */
export const Chart: React.FC<{ W: number; H: number; past: OHLC[]; live?: OHLC; strike?: number; lo: number; hi: number; liveScale?: number; grid?: boolean;
  strikeLabel?: string }> = ({ W, H, past, live, strike, lo, hi, liveScale = 1, grid = true, strikeLabel }) => {
  const n = past.length + (live ? 1 : 0);
  const cw = W / (n + 1);
  const y = (p: number) => H - ((p - lo) / (hi - lo)) * H;
  const candle = (c: OHLC, i: number, big = 1, key?: string) => {
    const x = cw * (i + 0.5) + cw * 0.5;
    const col = c.c >= c.o ? UP : DOWN;
    const bw = cw * 0.62 * big;
    return (
      <g key={key ?? i}>
        <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth={2.5 * big} />
        <rect x={x - bw / 2} width={bw} y={Math.min(y(c.o), y(c.c))} height={Math.max(3, Math.abs(y(c.o) - y(c.c)))} fill={col} />
      </g>
    );
  };
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {grid && [0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke="rgba(239,231,216,0.07)" />)}
      {past.map((c, i) => candle(c, i))}
      {live && candle(live, past.length, liveScale, 'live')}
      {strike !== undefined && <line x1={0} x2={W} y1={y(strike)} y2={y(strike)} stroke={SUMI.ink} strokeDasharray="10 8" strokeWidth={2} opacity={0.7} />}
      {strike !== undefined && strikeLabel && (
        <text x={6} y={y(strike) - 10} fill={SUMI.ink} fontFamily={MONO} fontWeight={700} fontSize={20} letterSpacing={3}>{strikeLabel}</text>
      )}
    </svg>
  );
};

/** Deterministic pseudo-random. */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Fictional context candles around a level. */
export const pastCandles = (n: number, base: number, vol: number, seed: number): OHLC[] => {
  let p = base;
  return Array.from({ length: n }, (_, i) => {
    const o = p, c = p + (rnd(seed + i) - 0.5) * vol * 2;
    const h = Math.max(o, c) + rnd(seed + i + 50) * vol * 0.6, l = Math.min(o, c) - rnd(seed + i + 90) * vol * 0.6;
    p = c;
    return { o, h, l, c };
  });
};
/** A live candle from a price path sampled up to progress u (0..1). */
export const liveFrom = (path: (u: number) => number, u: number): OHLC => {
  const o = path(0);
  let h = o, l = o;
  for (let i = 0; i <= 60; i++) {
    const v = path((u * i) / 60);
    h = Math.max(h, v); l = Math.min(l, v);
  }
  return { o, h, l, c: path(u) };
};

/** The versus band: paper band, two sides, one vermilion diagonal slash in the centre (the scene's one skew). */
export const VersusBand: React.FC<{ y: number; h: number; left: React.ReactNode; right: React.ReactNode; centre?: React.ReactNode; slashW?: number }> = ({
  y, h, left, right, centre, slashW = 220,
}) => (
  <div style={{ position: 'absolute', left: 0, top: y, width: 1920, height: h, background: BAND, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 96, top: 0, height: h, display: 'flex', alignItems: 'center' }}>{left}</div>
    <div style={{ position: 'absolute', right: 96, top: 0, height: h, display: 'flex', alignItems: 'center' }}>{right}</div>
    <div style={{ position: 'absolute', left: 960 - slashW / 2, top: -20, width: slashW, height: h + 40, background: SUMI.red, transform: 'skewX(-18deg)' }} />
    <div style={{ position: 'absolute', left: 960 - 200, width: 400, top: 0, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{centre}</div>
  </div>
);

/** The arcade timer: Dela, huge, with a vermilion drain bar. */
export const Timer: React.FC<{ text: string; drain: number; size?: number; label?: string }> = ({ text, drain, size = 150, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    {label && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.2em', color: SUMI.muted }}>{label}</div>}
    <div style={{ fontFamily: DELA, fontSize: size, color: SUMI.ink, lineHeight: 1 }}>{text}</div>
    <div style={{ width: size * 2.6, height: 10, background: 'rgba(239,231,216,0.12)', marginTop: 10 }}>
      <div style={{ width: `${(1 - drain) * 100}%`, height: '100%', background: SUMI.red }} />
    </div>
  </div>
);

export const fmtClock = (s: number) => {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};
