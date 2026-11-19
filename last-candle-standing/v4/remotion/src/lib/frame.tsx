// Shared scene helpers: the format context (16:9 master, 9:16 recomposed), global time, a redraw-every-frame 2D
// canvas, and the slammed headline block.
import React, { createContext, useContext, useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { DELA, MONO, SUMI } from './brand';
import { FPS } from '../data';
import { clamp, easeOut, lerp, slamK } from './motion';

export type Fmt = '16:9' | '9:16';
export const DIMS: Record<Fmt, { W: number; H: number; safe: { x: number; y: number } }> = {
  // title-safe: 5% of each dimension
  '16:9': { W: 1920, H: 1080, safe: { x: 96, y: 54 } },
  '9:16': { W: 1080, H: 1920, safe: { x: 54, y: 96 } },
};
export const FmtCtx = createContext<Fmt>('16:9');
export const useFmt = () => {
  const fmt = useContext(FmtCtx);
  return { fmt, land: fmt === '16:9', ...DIMS[fmt] };
};
/** pick a value per format */
export const pick = <A,>(fmt: Fmt, land: A, port: A) => (fmt === '16:9' ? land : port);

/** Global film time (s) for a scene mounted in a <Sequence from={start}>. */
export const useT = (start: number) => (useCurrentFrame() + Math.round(start * FPS)) / FPS;

export const Canvas2D: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; style?: React.CSSProperties }> = ({ draw, style }) => {
  const { W, H } = useFmt();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    draw(ctx);
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, ...style }} />;
};

/** A headline that slams in at t0 and (optionally) fades by t1. Centred unless align is set. */
export const Slam: React.FC<{
  t: number; t0: number; t1?: number; y: number; size: number; color?: string; font?: 'dela' | 'mono';
  children: React.ReactNode; align?: 'center' | 'left' | 'right'; x?: number; from?: number; tracking?: string; weight?: number;
  /** centre column for align=center (default: the frame) */
  cx?: number; cw?: number; glow?: string;
}> = ({ t, t0, t1, y, size, color = SUMI.ink, font = 'dela', children, align = 'center', x, from = 1.35, tracking, weight, cx, cw, glow }) => {
  const { W, safe } = useFmt();
  const k = slamK(t, t0, from);
  if (k.a <= 0) return null;
  const out = t1 !== undefined ? clamp((t - t1) / 0.12) : 0;
  if (out >= 1) return null;
  const colW = cw ?? W;
  const colL = cx !== undefined ? cx - colW / 2 : 0;
  // centred: an explicit column (left + width), relative to whatever box the headline sits in
  const left = align === 'center' ? colL : align === 'left' ? x ?? safe.x : undefined;
  const right = align === 'right' ? W - (x ?? W - safe.x) : undefined;
  const width = align === 'center' ? colW : undefined;
  const tr = tracking ?? (font === 'mono' ? '0.2em' : '0');
  return (
    <div
      style={{
        position: 'absolute', top: y, left, right, width, boxSizing: 'border-box', textAlign: align, whiteSpace: 'nowrap',
        fontFamily: font === 'dela' ? DELA : MONO, fontWeight: font === 'mono' ? weight ?? 700 : 400, fontSize: size, lineHeight: 1.05,
        letterSpacing: tr, color, paddingLeft: align === 'center' && font === 'mono' ? tr : undefined,
        transform: `scale(${lerp(k.s, 0.96, easeOut(out))})`, transformOrigin: align === 'left' ? 'left center' : align === 'right' ? 'right center' : 'center',
        opacity: 1 - out, textShadow: glow,
      }}
    >
      {children}
    </div>
  );
};
