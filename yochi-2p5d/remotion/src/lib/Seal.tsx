// A hanko seal with one allowed glyph, stamping with the brand motion (asset-pack/sumi/reference/code/sumi.css
// yo-stamp): scale 2.8 / -28deg -> 0.9 at 55% -> 1.05 at 72% -> 1.0 / rest over 0.5 s, cubic-bezier(.2,.9,.3,1.2)
// per keyframe segment (as CSS applies it). The curve is front-loaded, so contact (scale ~1) comes ~4 frames in:
// the seal starts 4 frames before the hit and touches down on it. Stamp texture as in reference/code/seal.tsx.
import React, { useId } from 'react';
import { Easing, useCurrentFrame } from 'remotion';
import { assertKanji, tokens, type Ground } from './brand';
import type { SealSpec } from './shot';

const DUR = 15;
const LEAD = 4;
const ease = Easing.bezier(0.2, 0.9, 0.3, 1.2);

export const Seal: React.FC<{ spec: SealSpec; hitFrame: number; W: number; H: number; ground: Ground; shake: [number, number] }> = ({
  spec, hitFrame, W, H, ground, shake,
}) => {
  assertKanji(spec.glyph);
  const f = useCurrentFrame();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const start = hitFrame - LEAD;
  if (f < start) return null;
  const p = Math.min(1, (f - start) / DUR);
  const keys = [0, 0.55, 0.72, 1];
  const rest = spec.rotate ?? -10;
  const seg = (vals: number[]) => {
    for (let i = 0; i < 3; i++) {
      if (p <= keys[i + 1] || i === 2) {
        const local = ease(Math.min(1, (p - keys[i]) / (keys[i + 1] - keys[i])));
        return vals[i] + (vals[i + 1] - vals[i]) * local;
      }
    }
    return vals[3];
  };
  const scale = seg([2.8, 0.9, 1.05, 1]);
  const rot = seg([-28, rest + 1, rest, rest]);
  const opacity = p >= 0.55 ? 1 : ease(p / 0.55);
  const size = (spec.size ?? 210) * (Math.min(W, H) / 1080);
  const tk = tokens(ground);
  const tone = spec.tone ?? 'red';
  const fill = tone === 'red' ? tk.red : tone === 'ink' ? tk.ink : 'none';
  const stroke = tone === 'out' ? tk.out : 'none';
  const glyphCol = tone === 'red' ? tk.onRed : tone === 'ink' ? tk.bg : tk.out;
  const chars = [...spec.glyph].length;
  const fs = chars > 1 ? 58 / chars : 46;
  const vb = 80;
  const inset = vb * 0.075;
  return (
    <div
      style={{
        position: 'absolute',
        left: spec.at[0] * W - size / 2 + shake[0],
        top: spec.at[1] * H - size / 2 + shake[1],
        width: size,
        height: size,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        opacity,
        filter: 'drop-shadow(0 6px 10px rgba(22,19,15,0.25))',
      }}
    >
      <svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size}>
        <defs>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency={1.4} numOctaves={1} seed={5} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35" result="holes" />
            <feComposite in="SourceGraphic" in2="holes" operator="in" />
          </filter>
        </defs>
        <g filter={`url(#${id})`}>
          <rect x={inset} y={inset} width={vb - inset * 2} height={vb - inset * 2} rx={vb * 0.075} fill={fill} stroke={stroke} strokeWidth={tone === 'out' ? 5 : 0} />
          <text x={40} y={40 + fs * 0.36} textAnchor="middle" fontSize={fs} fill={glyphCol} style={{ fontFamily: 'YujiSyuku' }}>
            {spec.glyph}
          </text>
        </g>
      </svg>
    </div>
  );
};
