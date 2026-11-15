// Small shared scene helpers: global time, a redraw-every-frame 2D canvas, the slammed headline block.
import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { DELA, MONO, SUMI } from './brand';
import { FPS } from '../data';
import { clamp, easeOut, lerp, slamK } from './motion';

export const W = 1080;
export const H = 1920;
/** title-safe at 1080x1920: 5% */
export const SAFE = { x: 54, y: 96 };

/** Global film time (s) for a scene mounted in a <Sequence from={start}>. */
export const useT = (start: number) => (useCurrentFrame() + Math.round(start * FPS)) / FPS;

export const Canvas2D: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; style?: React.CSSProperties }> = ({ draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    draw(ctx);
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, ...style }} />;
};

/** A headline that slams in at t0 and (optionally) fades by t1. Centred on x = W/2 unless align is set. */
export const Slam: React.FC<{
  t: number; t0: number; t1?: number; y: number; size: number; color?: string; font?: 'dela' | 'mono';
  children: React.ReactNode; align?: 'center' | 'left' | 'right'; x?: number; from?: number; tracking?: string; weight?: number;
}> = ({ t, t0, t1, y, size, color = SUMI.ink, font = 'dela', children, align = 'center', x, from = 1.35, tracking, weight }) => {
  const k = slamK(t, t0, from);
  if (k.a <= 0) return null;
  const out = t1 !== undefined ? clamp((t - t1) / 0.12) : 0;
  if (out >= 1) return null;
  const left = align === 'center' ? 0 : align === 'left' ? x ?? SAFE.x : undefined;
  const right = align === 'right' ? W - (x ?? W - SAFE.x) : align === 'center' ? 0 : undefined;
  return (
    <div
      style={{
        position: 'absolute', top: y, left, right, textAlign: align, whiteSpace: 'nowrap',
        fontFamily: font === 'dela' ? DELA : MONO, fontWeight: font === 'mono' ? weight ?? 700 : 400, fontSize: size, lineHeight: 1.05,
        letterSpacing: tracking ?? (font === 'mono' ? '0.2em' : '0'), color,
        paddingLeft: align === 'center' && font === 'mono' ? tracking ?? '0.2em' : undefined,
        transform: `scale(${lerp(k.s, 0.96, easeOut(out))})`, transformOrigin: align === 'left' ? 'left center' : align === 'right' ? 'right center' : 'center',
        opacity: 1 - out,
      }}
    >
      {children}
    </div>
  );
};
