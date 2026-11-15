// Atmosphere in front of the figure: paper dust and ink motes riding the wind, a few large out-of-focus ink
// blobs near the lens, and (at the hit) the ink burst thrown off the slash. Parallaxed with the shot camera,
// frozen during hit-stop like everything ambient. Pure function of the frame.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { PAPER, SUMI, rgb, type Ground } from './brand';
import { layerZoom, mulberry, windIntegral, type ShotSpec, type ShotState } from './shot';

type Mote = { x: number; y: number; z: number; r: number; kind: 'dust' | 'ink' | 'bokeh'; ph: number; a: number };

export const Atmosphere: React.FC<{
  spec: ShotSpec;
  state: ShotState;
  ground: Ground;
  /** the burst leaves from along this segment (frame units): the slash, or a point */
  burstFrom?: [[number, number], [number, number]];
  showMotes?: boolean;
  /** the character's head point (card px), kept clear of dark motes */
  faceAt: [number, number];
}> = ({ spec, state, ground, burstFrom, showMotes = true, faceAt }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const { W, H, unit } = state;
  const a = spec.atmosphere ?? {};
  const motes = useMemo(() => {
    const r = mulberry(4242);
    const out: Mote[] = [];
    const ext = (n: number) => Math.round(n * ((W * H) / (1920 * 1080)));
    for (let i = 0; i < ext(a.dust ?? 120); i++) out.push({ x: r(), y: r(), z: 0.3 + r() * 0.9, r: 0.8 + r() * 2.2, kind: 'dust', ph: r() * 6.28, a: 0.35 + r() * 0.5 });
    for (let i = 0; i < ext(a.ink ?? 34); i++) out.push({ x: r(), y: r(), z: 0.5 + r() * 0.8, r: 1.5 + Math.pow(r(), 2) * 5, kind: 'ink', ph: r() * 6.28, a: 0.55 + r() * 0.4 });
    for (let i = 0; i < (a.bokeh ?? 6); i++) out.push({ x: r(), y: r(), z: 1.6 + r() * 0.6, r: 26 + r() * 50, kind: 'bokeh', ph: r() * 6.28, a: 0.12 + r() * 0.14 });
    return out;
  }, [W, H, a.dust, a.ink, a.bokeh]);
  const drops = useMemo(() => {
    const r = mulberry(777);
    return Array.from({ length: 110 }, () => ({
      ang: (r() < 0.5 ? -0.86 : 2.28) + (r() - 0.5) * 1.3,
      v: 500 + Math.pow(r(), 0.7) * 1700,
      r: 1 + Math.pow(r(), 3) * 10,
      a: 0.6 + r() * 0.4,
      drag: 2.5 + r() * 3,
      u: 0.2 + r() * 0.6,
    }));
  }, []);

  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const { cam } = state;
    const [ir, ig, ib] = rgb(PAPER.ink);
    const dust = ground === 'paper' ? 'rgba(246,240,226,' : `rgba(${rgb(SUMI.ink).join(',')},`;
    const sc = W / cam.winW;
    ctx.save();
    ctx.translate(W / 2 + cam.shakeX, H / 2 + cam.shakeY);
    ctx.rotate((cam.shakeRot * Math.PI) / 180);
    ctx.translate(-W / 2, -H / 2);
    // keep dark motes off the face: fade them within ~0.22 of the short side around the head point
    const hz = layerZoom(cam.zoom, 1);
    const headX = W / 2 + ((faceAt[0] - cam.cx - cam.truckX) * W * hz) / cam.winW;
    const headY = H / 2 + ((faceAt[1] - cam.cy - cam.truckY) * W * hz) / cam.winW;
    const faceR = 0.22 * Math.min(W, H);
    const offFace = (x: number, y: number) => Math.min(1, Math.max(0, (Math.hypot(x - headX, y - headY) - faceR * 0.6) / (faceR * 0.8)));
    if (showMotes) {
      const wi = windIntegral(spec, f);
      const t = state.t;
      const SW = W + 400 * unit, SH = H + 220 * unit;
      for (const m of motes) {
        const zl = layerZoom(cam.zoom, m.z);
        let x = m.x * SW - 200 * unit - wi * 120 * unit * m.z + Math.sin(t * 1.3 + m.ph) * 10 * unit;
        let y = m.y * SH - 110 * unit + wi * 22 * unit * m.z + Math.sin(t * 0.9 + m.ph * 2) * 8 * unit;
        x = ((((x + 200 * unit) % SW) + SW) % SW) - 200 * unit;
        y = ((((y + 110 * unit) % SH) + SH) % SH) - 110 * unit;
        const sx = W / 2 + (x - W / 2) * zl - cam.truckX * m.z * sc;
        const sy = H / 2 + (y - H / 2) * zl - cam.truckY * m.z * sc;
        const r = m.r * unit * zl * (m.kind === 'bokeh' ? 1 : 0.8 + 0.4 * m.z);
        const fa = m.kind === 'dust' ? 1 : offFace(sx, sy);
        if (fa <= 0) continue;
        if (m.kind === 'bokeh') {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
          g.addColorStop(0, `rgba(${ir},${ig},${ib},${m.a * fa})`);
          g.addColorStop(0.6, `rgba(${ir},${ig},${ib},${m.a * 0.6 * fa})`);
          g.addColorStop(1, `rgba(${ir},${ig},${ib},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = m.kind === 'dust' ? `${dust}${m.a})` : `rgba(${ir},${ig},${ib},${m.a * fa})`;
          ctx.beginPath();
          ctx.ellipse(sx, sy, r * 1.25, r, -0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const im = spec.impact;
    if (im && burstFrom && state.impact.since >= 0) {
      // the drops leave the slash once the hit-stop half releases (before that they'd stack at one point)
      const s = state.impact.since - im.hitStop * 0.5;
      const [[ax, ay], [bx, by]] = burstFrom;
      for (const d of drops) {
        if (s <= 0) break;
        const cx = (ax + (bx - ax) * d.u) * W, cy = (ay + (by - ay) * d.u) * H;
        const dist = (d.v / d.drag) * (1 - Math.exp(-d.drag * s)) * unit;
        const x = cx + Math.cos(d.ang) * dist;
        const y = cy + Math.sin(d.ang) * dist + 260 * s * s * unit;
        const al = d.a * Math.max(0, 1 - s / 1.3);
        if (al <= 0) continue;
        const sp = ((d.v * Math.exp(-d.drag * s)) / 30) * unit;
        ctx.strokeStyle = `rgba(${ir},${ig},${ib},${al})`;
        ctx.lineCap = 'round';
        ctx.lineWidth = d.r * unit * (1 - 0.4 * Math.min(1, s));
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(d.ang) * sp * 0.8, y - Math.sin(d.ang) * sp * 0.8);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />;
};

/** Vignette and animated paper grain, identical on every shot. */
export const Grade: React.FC<{ W: number; H: number; vignette?: number; grain?: number }> = ({ W, H, vignette = 0.34, grain = 0.45 }) => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const GW = Math.round(W / 2), GH = Math.round(H / 2);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    const img = ctx.createImageData(GW, GH);
    const r = mulberry(1000 + f * 31);
    for (let i = 0; i < GW * GH; i++) {
      const v = 128 + (r() - 0.5) * 70;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [f, GW, GH]);
  return (
    <>
      <canvas ref={ref} width={GW} height={GH} style={{ position: 'absolute', inset: 0, width: W, height: H, mixBlendMode: 'soft-light', opacity: grain }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 80% at 50% 48%, rgba(15,13,11,0) 55%, rgba(15,13,11,${vignette}) 100%)` }} />
    </>
  );
};
