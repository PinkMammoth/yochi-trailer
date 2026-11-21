// V4: foreground motes for depth: paper dust and a few large out-of-focus ink blobs drifting across the frame at
// different speeds (near = faster, bigger, softer). Pure function of time. Kept off the centre third, sparse.
import React from 'react';
import { Canvas2D, useFmt } from './frame';
import { hash } from './motion';

export const Motes: React.FC<{ t: number; n?: number; tint?: string; strength?: number }> = ({ t, n = 70, tint = '239,231,216', strength = 1 }) => {
  const { W, H } = useFmt();
  return (
    <Canvas2D style={{ pointerEvents: 'none' }} draw={(ctx) => {
      for (let i = 0; i < n; i++) {
        const z = 0.3 + hash(i * 3.1) * 1.2;          // depth
        const big = i % 9 === 0;
        const r = big ? 14 + hash(i * 5.7) * 26 : 1 + hash(i * 7.3) * 2.6 * z;
        const sp = (14 + 40 * z) * (big ? 1.6 : 1);
        const x = ((hash(i * 1.7) * (W + 200) + t * sp) % (W + 200)) - 100;
        const y = hash(i * 2.9) * H + Math.sin(t * (0.6 + z) + i) * 18 * z;
        const a = strength * (big ? 0.05 + 0.05 * hash(i * 9.1) : (0.18 + 0.3 * hash(i * 4.4)) * (0.6 + 0.4 * Math.sin(t * 2 + i)));
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${tint},${a})`);
        gr.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }} />
  );
};
