// Standard OHLC candles (green up, crimson down), never stylised. SVG, pure function of time.
import React from 'react';
import { DOWN, MONO, SUMI, UP } from './brand';

export interface OHLC { o: number; h: number; l: number; c: number }

/** A deterministic, plausible one-minute HYPE series (fictional: no real market data). */
export function series(n: number, seed: number, start = 41.8, vol = 0.035): OHLC[] {
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: OHLC[] = [];
  let p = start;
  for (let i = 0; i < n; i++) {
    const o = p;
    const c = o + (r() - 0.5) * vol * 2;
    const h = Math.max(o, c) + r() * vol * 0.6;
    const l = Math.min(o, c) - r() * vol * 0.6;
    out.push({ o, h, l, c });
    p = c;
  }
  return out;
}

/** The live candle so far: opens at o, price path px(u) for u in 0..progress (u = 0..1 across the minute). */
export function liveCandle(o: number, px: (u: number) => number, progress: number): OHLC {
  let h = o, l = o;
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const v = px((i / N) * progress);
    h = Math.max(h, v);
    l = Math.min(l, v);
  }
  return { o, h, l, c: px(progress) };
}

export const Candles: React.FC<{
  w: number; h: number; data: OHLC[]; live?: OHLC | null; strike?: number; lo: number; hi: number;
  bodyW?: number; gap?: number; reveal?: number; strikeLabel?: boolean; liveGlow?: number; fade?: number; centerLast?: boolean;
}> = ({ w, h, data, live, strike, lo, hi, bodyW = 34, gap = 16, reveal = 1, strikeLabel = true, liveGlow = 0, fade = 1, centerLast = false }) => {
  const Y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const all = live ? [...data, live] : data;
  const step = bodyW + gap;
  const x0 = centerLast ? w / 2 - (all.length - 1) * step - bodyW / 2 : w - all.length * step + gap / 2;
  const shown = Math.ceil(all.length * reveal);
  return (
    <svg width={w} height={h} style={{ overflow: 'visible', position: 'absolute', left: 0, top: 0 }}>
      {strike !== undefined && (
        <g opacity={0.75}>
          <line x1={0} x2={w} y1={Y(strike)} y2={Y(strike)} stroke={SUMI.ink} strokeWidth={3} strokeDasharray="12 10" />
          {strikeLabel && (
            <text x={4} y={Y(strike) - 14} fill={SUMI.ink} style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.12em' }}>
              STRIKE {strike.toFixed(2)}
            </text>
          )}
        </g>
      )}
      {all.slice(0, shown).map((k, i) => {
        const isLive = live && i === all.length - 1;
        const up = k.c >= k.o;
        const col = up ? UP : DOWN;
        const x = x0 + i * step;
        const top = Y(Math.max(k.o, k.c));
        const bot = Y(Math.min(k.o, k.c));
        const a = isLive ? 1 : fade;
        return (
          <g key={i} opacity={a}>
            <line x1={x + bodyW / 2} x2={x + bodyW / 2} y1={Y(k.h)} y2={Y(k.l)} stroke={col} strokeWidth={Math.max(3, bodyW * 0.09)} />
            <rect x={x} y={top} width={bodyW} height={Math.max(3, bot - top)} fill={col} rx={Math.min(4, bodyW * 0.06)} />
            {isLive && liveGlow > 0 && (
              <rect x={x - 10} y={top - 10} width={bodyW + 20} height={Math.max(3, bot - top) + 20} fill="none" stroke={SUMI.ink} strokeWidth={3} opacity={liveGlow} rx={6} />
            )}
          </g>
        );
      })}
    </svg>
  );
};
