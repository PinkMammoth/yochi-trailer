// Our own layers for the action grammar (rung 3: they never touch a painting): manga panels with ink gutters,
// focus lines, speed lines, the 命 life pips, a seconds-based stamp, a placed 2.5D shot and an image loader.
import React, { useLayoutEffect, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile } from 'remotion';
import { CharacterShot, FORMATS, type ShotSpec } from '../../../../yochi-2p5d/remotion/src/lib';
import { PAPER, SUMI, YUJI, assertKanji } from './brand';
import { clamp, easeOut, hash, mulberry, stampK } from './motion';

export type Pt = [number, number];

/** A panel: children clipped to a polygon, with a cream (sumi) or ink (paper) border. */
export const Panel: React.FC<{ poly: Pt[]; border?: string; bw?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ poly, border = SUMI.ink, bw = 5, children, style }) => {
  const clip = `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
  return (
    <>
      <AbsoluteFill style={{ clipPath: clip, ...style }}>{children}</AbsoluteFill>
      {bw > 0 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <polygon points={poly.map((p) => p.join(',')).join(' ')} fill="none" stroke={border} strokeWidth={bw} strokeLinejoin="miter" />
        </svg>
      )}
    </>
  );
};

/** A CharacterShot rendered at its native format size and placed (x, y, scale) in the frame. */
export const Shot: React.FC<{ spec: ShotSpec; x: number; y: number; scale: number; style?: React.CSSProperties }> = ({ spec, x, y, scale, style }) => {
  const { width, height } = FORMATS[spec.format];
  return (
    <div style={{ position: 'absolute', left: x, top: y, width, height, transform: `scale(${scale})`, transformOrigin: '0 0', ...style }}>
      <CharacterShot spec={spec} />
    </div>
  );
};

/** Load an image once; the render waits for it. */
const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function useImage(path: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [h] = useState(() => delayRender('image ' + path));
  useLayoutEffect(() => {
    if (!imgCache.has(path)) {
      imgCache.set(path, new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = staticFile(path);
      }));
    }
    imgCache.get(path)!.then((im) => {
      setImg(im);
      continueRender(h);
    });
  }, [path, h]);
  return img;
}

/** Manga focus lines (集中線) converging on c, leaving an ellipse clear. Drawn as tapered wedges. */
export function focusLines(ctx: CanvasRenderingContext2D, W: number, H: number, c: Pt, clear: [number, number], n: number, col: string, alpha: number, seed: number, phase = 0) {
  if (alpha <= 0) return;
  const rnd = mulberry(seed + Math.floor(phase * 30));
  const R = Math.hypot(W, H);
  ctx.save();
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * (Math.PI * 2 / n) * 1.4;
    const inner = 1 + rnd() * 0.55;
    const w = (0.002 + rnd() * 0.009) * 1.0;
    const cx = Math.cos(a), sy = Math.sin(a);
    const x0 = c[0] + cx * clear[0] * inner, y0 = c[1] + sy * clear[1] * inner;
    ctx.globalAlpha = alpha * (0.55 + 0.45 * rnd());
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(c[0] + Math.cos(a - w) * R, c[1] + Math.sin(a - w) * R);
    ctx.lineTo(c[0] + Math.cos(a + w) * R, c[1] + Math.sin(a + w) * R);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Horizontal speed lines streaking toward -x: thin tapered strokes, moving with time. */
export function speedLines(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, n: number, col: string, alpha: number, seed: number, band: [number, number] = [0, 1]) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const r1 = hash(seed + i * 1.37), r2 = hash(seed + i * 2.91), r3 = hash(seed + i * 4.13);
    const y = H * (band[0] + (band[1] - band[0]) * r1);
    const len = W * (0.15 + 0.5 * r2);
    const speed = W * (2.2 + 2.5 * r3);
    const x = W * 1.2 - ((t * speed + r3 * W * 3) % (W * 1.8 + len));
    const th = 1.5 + 5 * Math.pow(r2, 2);
    ctx.globalAlpha = alpha * (0.35 + 0.65 * r1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y - th / 2);
    ctx.lineTo(x + len, y + th / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** A hanko seal in seconds (house stamp curve, 0.5 s), one allowed glyph. Contact ~0.07 s after t0. */
export const StampSeal: React.FC<{ t: number; t0: number; glyph: string; x: number; y: number; size: number; fill: string; ink: string; rest?: number; shake?: Pt }> = ({ t, t0, glyph, x, y, size, fill, ink, rest = -10, shake = [0, 0] }) => {
  assertKanji(glyph);
  const k = stampK(t, t0, rest);
  if (k.a <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - size / 2 + shake[0], top: y - size / 2 + shake[1], width: size, height: size, transform: `scale(${k.s}) rotate(${k.r}deg)`, opacity: k.a,
      background: fill, borderRadius: size * 0.14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 0 0 ${size * 0.045}px ${ink}` }}>
      <div style={{ fontFamily: YUJI, fontSize: size * (glyph.length > 1 ? 0.42 : 0.66), lineHeight: 1, color: ink, marginTop: -size * 0.04 }}>{glyph}</div>
    </div>
  );
};

/** 命 life pips. `lost` cracks and drops the last one at t = lostAt. */
export const Pips: React.FC<{ t: number; lives: number; lostAt?: number; size?: number; ground?: 'sumi' | 'paper'; align?: 'left' | 'right'; appear?: number }> = ({ t, lives, lostAt, size = 46, ground = 'sumi', align = 'left', appear = -1 }) => {
  const tk = ground === 'sumi' ? SUMI : PAPER;
  return (
    <div style={{ display: 'flex', gap: size * 0.28, flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
      {Array.from({ length: lives }).map((_, i) => {
        const last = i === lives - 1;
        const since = lostAt !== undefined && last ? t - lostAt : -1;
        const pop = appear >= 0 ? easeOut((t - appear - i * 0.05) / 0.12) : 1;
        const fall = since > 0.12 ? since - 0.12 : 0;
        const crack = since >= 0;
        const col = crack ? tk.out : tk.ink;
        return (
          <div key={i} style={{ width: size, height: size, position: 'relative', opacity: pop * (1 - clamp(fall / 0.5)), transform: `translateY(${fall * fall * 900}px) rotate(${fall * 120}deg) scale(${(crack && since < 0.12 ? 1.25 - since * 2 : 1) * (0.6 + 0.4 * pop)})` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: size * 0.14, border: `${Math.max(2, size * 0.07)}px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: YUJI, fontSize: size * 0.66, lineHeight: 1, color: col, marginTop: -size * 0.05 }}>命</div>
            </div>
            {crack && (
              <svg width={size} height={size} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                <polyline points={`${size * 0.62},${-size * 0.1} ${size * 0.44},${size * 0.38} ${size * 0.6},${size * 0.52} ${size * 0.38},${size * 1.1}`} fill="none" stroke={ground === 'sumi' ? SUMI.bg : PAPER.bg} strokeWidth={size * 0.12} />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};
