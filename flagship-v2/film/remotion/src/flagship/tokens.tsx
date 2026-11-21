// Flagship-only helpers on top of the approved film's brand module: the obvious placeholder, the shot slate, the
// UNVERIFIED tag for any figure the app's contract hasn't confirmed, and the painted cast's cut-outs.
import React from 'react';
import { Img, staticFile } from 'remotion';
import castJson from '../../../assets/cast/cast.json';
export { BAND, DELA, DOWN, MONO, PAPER, SUMI, UP, UP_PAPER, DOWN_PAPER, YUJI, ZEN } from '../lib/brand';
import { MONO, SUMI } from '../lib/brand';

export const CAST = castJson as Record<string, { paint: number[]; head: number[]; fig: number[] }>;
export const CYAN = '#00c8d7';

/** Missing artwork: hatched, outlined, labelled with its brief id. Deliberately obvious; never disguised. */
export const Placeholder: React.FC<{ id: string; what: string; style?: React.CSSProperties; dark?: boolean; size?: number }> = ({ id, what, style, dark, size = 24 }) => (
  <div style={{ position: 'absolute', border: `4px dashed ${CYAN}`, background: 'repeating-linear-gradient(45deg, rgba(0,200,215,0.20) 0 14px, rgba(0,200,215,0.05) 14px 28px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 10, boxSizing: 'border-box',
    color: dark ? '#0b3b40' : '#7ff3fb', fontFamily: MONO, fontWeight: 800, ...style }}>
    <div style={{ fontSize: size, letterSpacing: '0.12em' }}>NEW · {id}</div>
    <div style={{ fontSize: size * 0.75, fontWeight: 500, marginTop: 4, maxWidth: 760 }}>{what}</div>
  </div>
);

export const Slate: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 24, bottom: 16, fontFamily: MONO, fontSize: 18, fontWeight: 700, color: '#7ff3fb', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', letterSpacing: '0.08em', maxWidth: 1500 }}>{text}</div>
);

/** A cyan superscript on any number the contract hasn't confirmed (FEASIBILITY.md section 5). */
export const Unv: React.FC = () => (
  <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: CYAN, letterSpacing: '0.1em', verticalAlign: 'super', marginLeft: 8 }}>UNVERIFIED</span>
);

/**
 * A painted figure (house cut-out). Two placements: bottom-anchored full figure (x, y = feet, h = painting height),
 * or a close-up with the head at (x, y) and zoom = screen px per painting px. `pose` marks a NEW pose the shot
 * really needs: the canonical figure stands in, desaturated and outlined, with the brief id.
 */
export const Fig: React.FC<{ id: string; x: number; y: number; h?: number; zoom?: number; focus?: [number, number]; grey?: number; dim?: number; sil?: boolean;
  pose?: string; poseNote?: string; opacity?: number; rot?: number }> = ({ id, x, y, h, zoom, focus, grey = 0, dim = 0, sil, pose, poseNote, opacity = 1, rot = 0 }) => {
  const c = CAST[id] ?? { paint: [1392, 1828], head: [700, 400], fig: [0, 0, 1392, 1828] };
  const [pw, ph] = c.paint;
  const z = zoom ?? (h ?? 600) / ph;
  const [fx, fy] = zoom ? (focus ?? (c.head as [number, number])) : [pw / 2, ph];
  const filters = [sil ? 'brightness(0.1) saturate(0)' : '', grey ? `grayscale(${grey})` : '', dim ? `brightness(${1 - dim})` : '', pose ? 'saturate(0.35) contrast(0.85)' : ''].filter(Boolean).join(' ');
  const left = x - fx * z, top = y - fy * z;
  return (
    <>
      <Img src={staticFile(`cast/${id}-fig.webp`)} style={{ position: 'absolute', left, top, width: pw * z, height: ph * z, filter: filters || undefined, opacity: pose ? opacity * 0.8 : opacity,
        transformOrigin: `${fx * z}px ${fy * z}px`, transform: rot ? `rotate(${rot}deg)` : undefined }} />
      {pose && (
        <div style={{ position: 'absolute', left: Math.max(8, left + c.fig[0] * z), top: Math.max(8, top + c.fig[1] * z), width: (c.fig[2] - c.fig[0]) * z, height: (c.fig[3] - c.fig[1]) * z, border: `4px dashed ${CYAN}`, boxSizing: 'border-box', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 8, top: 8, fontFamily: MONO, fontWeight: 800, fontSize: 22, color: '#7ff3fb', background: 'rgba(0,0,0,0.65)', padding: '3px 8px', letterSpacing: '0.08em', maxWidth: 520 }}>
            NEW · {pose}{poseNote ? <span style={{ fontWeight: 500 }}> · {poseNote}</span> : null}
          </div>
        </div>
      )}
    </>
  );
};

export const Dark: React.FC<{ a: number; color?: string }> = ({ a, color = '15,13,11' }) => <div style={{ position: 'absolute', inset: 0, background: `rgba(${color},${a})` }} />;
export { SUMI as _S };
