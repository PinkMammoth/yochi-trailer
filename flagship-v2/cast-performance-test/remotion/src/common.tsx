// Shared pieces for the three cast performance tests: the camera, the arena world (as in the Last Legend test),
// ink motes, the win amount. Every frame is a pure function of t.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Canvas2D } from '../../../film/remotion/src/lib/frame';
import { clamp, easeInOut, lerp, mulberry, riseK } from '../../../film/remotion/src/lib/motion';
import { DELA, MONO } from '../../../film/remotion/src/lib/brand';

export const FPS = 60;
export const BEAT = 0.34095;
export const C: [number, number] = [960, 540];
export type Cam = [number, number, number]; // stage cx, cy, zoom

export function camAt(keys: { t: number; c: Cam; ease?: (x: number) => number }[], t: number): Cam {
  if (t <= keys[0].t) return keys[0].c;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const e = (b.ease ?? easeInOut)((t - a.t) / (b.t - a.t));
      return [lerp(a.c[0], b.c[0], e), lerp(a.c[1], b.c[1], e), a.c[2] * Math.pow(b.c[2] / a.c[2], e)];
    }
  }
  return keys[keys.length - 1].c;
}
export const stageTf = ([cx, cy, z]: Cam) => `translate(${C[0]}px, ${C[1]}px) scale(${z}) translate(${-cx}px, ${-cy}px)`;
const parTf = ([cx, cy, z]: Cam, par: number) =>
  `translate(${C[0]}px, ${C[1]}px) scale(${1 + (z - 1) * par}) translate(${-(C[0] + (cx - C[0]) * par)}px, ${-(C[1] + (cy - C[1]) * par)}px)`;

/** The approved arena behind a figure: the UP or DOWN side out of focus, mist, optionally the paved landing as floor. */
export const ArenaWorld: React.FC<{ cam: Cam; side: 'up' | 'down'; grey: number; floor?: boolean; blur?: number; floorY?: number; children?: React.ReactNode }> = ({
  cam, side, grey, floor = true, blur = 5, floorY = 742, children,
}) => {
  const wf = `grayscale(${grey}) brightness(${0.97 - 0.07 * grey})`;
  return (
    <>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: parTf(cam, 0.32), filter: wf }}>
        <Img src={staticFile(`cp/arena-${side}.png`)} style={{ position: 'absolute', left: -180, top: -560, width: 2280, height: 1620, filter: `blur(${blur}px)` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: stageTf(cam) }}>
        {floor && (
          <div style={{ filter: wf }}>
            <Img src={staticFile('cp/arena-floor.png')} style={{ position: 'absolute', left: -200, top: floorY, width: 2320, height: (2320 * 95) / 374, filter: 'blur(1.4px)' }} />
            <div style={{ position: 'absolute', left: -600, top: floorY - 182, width: 3200, height: 260, background: 'linear-gradient(180deg, rgba(220,212,198,0) 0%, rgba(220,212,198,0.92) 55%, rgba(214,206,192,0) 100%)' }} />
          </div>
        )}
        {children}
      </AbsoluteFill>
    </>
  );
};

/** Ink motes on the air: drifting flecks (wind to the left by default), `life` 0..1 scales the count. `freeze` stops time. */
export const Motes: React.FC<{ t: number; n?: number; seed?: number; wind?: number; life?: number; col?: string; cam?: Cam; freezeAt?: number; freezeFor?: number }> = ({
  t, n = 60, seed = 5, wind = -60, life = 1, col = '#16130f', cam = [960, 540, 1], freezeAt = 1e9, freezeFor = 0,
}) => {
  // time as the motes feel it: stopped during the freeze, then resumed
  const tm = t < freezeAt ? t : t < freezeAt + freezeFor ? freezeAt : t - freezeFor;
  return (
    <Canvas2D draw={(ctx) => {
      const r = mulberry(seed);
      for (let i = 0; i < n; i++) {
        const depth = 0.5 + r() * 1.5, x0 = r() * 2200 - 140, y0 = r() * 1180 - 50, ph = r() * 6.28, size = (0.9 + Math.pow(r(), 3) * 3.5) * depth;
        if (r() > life) continue;
        const x = ((x0 + tm * wind * depth - (cam[0] - 960) * 0.25 * depth) % 2240 + 2240) % 2240 - 160;
        const y = y0 + Math.sin(tm * 0.8 + ph) * 18 * depth - (cam[1] - 540) * 0.25 * depth;
        ctx.globalAlpha = (depth > 1.4 ? 0.28 : 0.55) * clamp(life * 2);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(x, y, size * 1.6, size, 0.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }} />
  );
};

/** The win amount (flagship X3 grammar): handle line in Mono, the amount in Dela, green, rising with the film's only glow. */
export const WinAmount: React.FC<{ t: number; at: number; x: number; y: number; handle: string; amount: string; ground: 'paper' | 'sumi' | 'arena'; align?: 'left' | 'right'; size?: number }> = ({
  t, at, x, y, handle, amount, ground, align = 'right', size = 132,
}) => {
  const r = riseK(t, at);
  const green = ground === 'sumi' ? '#3ddc84' : '#15804a';
  const muted = ground === 'sumi' ? '#a39a8a' : '#5d5548';
  return (
    <div style={{ position: 'absolute', [align]: x, top: y, textAlign: align, opacity: r.a, transform: `translateY(${r.y}px)` } as React.CSSProperties}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.18em', color: muted }}>{handle}</div>
      <div style={{ fontFamily: DELA, fontSize: size, lineHeight: 1.1, color: green, textShadow: `0 0 26px ${ground === 'sumi' ? 'rgba(61,220,132,0.45)' : 'rgba(21,128,74,0.35)'}` }}>{amount}</div>
    </div>
  );
};

export const k01 = (t: number, a: number, b: number) => easeInOut((t - a) / (b - a));
