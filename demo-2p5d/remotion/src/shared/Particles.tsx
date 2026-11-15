// Atmosphere in front of the figure: paper dust and ink motes on the wind, a few large
// out-of-focus ink blobs very close to the lens, and the ink burst thrown off at the hit.
// Pure function of the frame; parallaxed with the same camera as the plates.
import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { FPS, H, IMPACT, W, WINDOW, camera, performance } from './timeline';
import { mulberry, slashCenter } from './slash';

type Mote = { x: number; y: number; z: number; r: number; kind: 'dust' | 'ink' | 'bokeh'; ph: number; a: number };

const motes: Mote[] = (() => {
  const r = mulberry(4242);
  const out: Mote[] = [];
  for (let i = 0; i < 120; i++) out.push({ x: r() * 2600 - 200, y: r() * 1300 - 110, z: 0.3 + r() * 0.9, r: 0.8 + r() * 2.2, kind: 'dust', ph: r() * 6.28, a: 0.35 + r() * 0.5 });
  for (let i = 0; i < 34; i++) out.push({ x: r() * 2600 - 200, y: r() * 1300 - 110, z: 0.5 + r() * 0.8, r: 1.5 + Math.pow(r(), 2) * 5, kind: 'ink', ph: r() * 6.28, a: 0.55 + r() * 0.4 });
  for (let i = 0; i < 6; i++) out.push({ x: r() * 2600 - 200, y: r() * 1300 - 110, z: 1.6 + r() * 0.6, r: 26 + r() * 50, kind: 'bokeh', ph: r() * 6.28, a: 0.12 + r() * 0.14 });
  return out;
})();

// integral of the wind, so motes speed up with the gust and never jump
const windInt = (() => {
  const a = [0];
  for (let f = 1; f <= 400; f++) a.push(a[f - 1] + performance(f).wind / FPS);
  return a;
})();

type Drop = { ang: number; v: number; r: number; a: number; drag: number };
const drops: Drop[] = (() => {
  const r = mulberry(777);
  const out: Drop[] = [];
  for (let i = 0; i < 110; i++) {
    // thrown mostly perpendicular to the slash, both sides, a few along it
    const base = (r() < 0.5 ? -0.86 : 2.28) + (r() - 0.5) * 1.3;
    out.push({ ang: base, v: 500 + Math.pow(r(), 0.7) * 1700, r: 1 + Math.pow(r(), 3) * 10, a: 0.6 + r() * 0.4, drag: 2.5 + r() * 3 });
  }
  return out;
})();

export const Particles: React.FC<{ motesInBlender?: boolean }> = ({ motesInBlender }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const cam = camera(f);
    const sc = W / WINDOW.w;
    ctx.save();
    ctx.translate(W / 2 + cam.shakeX, H / 2 + cam.shakeY);
    ctx.rotate((cam.shakeRot * Math.PI) / 180);
    ctx.translate(-W / 2, -H / 2);
    const wi = windInt[Math.min(f, windInt.length - 1)];
    const t = f / FPS;
    if (!motesInBlender) {
      for (const m of motes) {
        const zl = 1 + (cam.zoom - 1) * (0.45 + 0.65 * m.z);
        // world drift (wind blows right to left, a little down), wrapped
        let x = m.x - wi * 120 * m.z + Math.sin(t * 1.3 + m.ph) * 10;
        let y = m.y + wi * 22 * m.z + Math.sin(t * 0.9 + m.ph * 2) * 8;
        x = ((((x + 200) % 2600) + 2600) % 2600) - 200;
        y = ((((y + 110) % 1300) + 1300) % 1300) - 110;
        // parallax with the camera
        const sx = W / 2 + (x - W / 2) * zl - cam.truckX * m.z * sc * 1.0;
        const sy = H / 2 + (y - H / 2) * zl - cam.truckY * m.z * sc;
        const r = m.r * zl * (m.kind === 'bokeh' ? 1 : 0.8 + 0.4 * m.z);
        if (m.kind === 'bokeh') {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
          g.addColorStop(0, `rgba(22,19,15,${m.a})`);
          g.addColorStop(0.6, `rgba(22,19,15,${m.a * 0.6})`);
          g.addColorStop(1, 'rgba(22,19,15,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = m.kind === 'dust' ? `rgba(246,240,226,${m.a})` : `rgba(22,19,15,${m.a})`;
          ctx.beginPath();
          // stretched a little along the wind
          ctx.ellipse(sx, sy, r * (1 + 0.6 * performance(f).wind * 0.4), r, -0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // ink burst at the hit
    if (f >= IMPACT) {
      const c = slashCenter();
      const s = (f - IMPACT) / FPS;
      for (const d of drops) {
        const dist = (d.v / d.drag) * (1 - Math.exp(-d.drag * s));
        const x = c.x + Math.cos(d.ang) * dist;
        const y = c.y + Math.sin(d.ang) * dist + 260 * s * s;
        const a = d.a * Math.max(0, 1 - s / 1.3);
        if (a <= 0) continue;
        const sp = d.v * Math.exp(-d.drag * s) / FPS; // streak length this frame
        ctx.strokeStyle = `rgba(22,19,15,${a})`;
        ctx.lineCap = 'round';
        ctx.lineWidth = d.r * (1 - 0.4 * Math.min(1, s));
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(d.ang) * sp * 0.8, y - Math.sin(d.ang) * sp * 0.8);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }, [f, motesInBlender]);
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />;
};
