// The vermilion 連勝 (win streak) seal, stamped at the hit. Untouchable is the reward for
// five wins in a row, so this is the glyph the app itself would show. Motion is the brand
// stamp (asset-pack/sumi/reference/code/sumi.css, yo-stamp): scale 2.8 / -28deg -> 0.9 at
// 55% -> 1.05 at 72% -> 1.0 / -10deg over 0.5 s, cubic-bezier(.2,.9,.3,1.2), per segment
// as CSS does. Contact on the impact frame. Paper tones: fill #d6402b, glyph #fff8ef.
import React from 'react';
import { Easing, useCurrentFrame } from 'remotion';
import { IMPACT, camera } from './timeline';

const DUR = 15; // 0.5 s
// The brand curve is front-loaded: the seal visibly makes contact ~4 frames in (scale ~1),
// so it starts 4 frames early and touches down on the hit, settling through the shake.
const START = IMPACT - 4;
const ease = Easing.bezier(0.2, 0.9, 0.3, 1.2);

export const Seal: React.FC<{ x?: number; y?: number; size?: number }> = ({ x = 1610, y = 820, size = 210 }) => {
  const f = useCurrentFrame();
  if (f < START) return null;
  // CSS applies the timing function per keyframe segment, so do the same.
  const p = Math.min(1, (f - START) / DUR);
  const keys = [0, 0.55, 0.72, 1];
  const seg = (vals: number[]) => {
    for (let i = 0; i < 3; i++) {
      if (p <= keys[i + 1] || i === 2) {
        const local = ease(Math.min(1, (p - keys[i]) / (keys[i + 1] - keys[i])));
        return vals[i] + (vals[i + 1] - vals[i]) * local;
      }
    }
    return vals[3];
  };
  const rest = -10;
  const scale = seg([2.8, 0.9, 1.05, 1]);
  const rot = seg([-28, rest + 1, rest, rest]);
  const opacity = p >= 0.55 ? 1 : ease(p / 0.55);
  // the stamped surface takes the camera shake too (brand impact shake, here the camera's)
  const cam = camera(f);
  const vb = 80;
  const inset = vb * 0.075;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2 + cam.shakeX,
        top: y - size / 2 + cam.shakeY,
        width: size,
        height: size,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        opacity,
        filter: 'drop-shadow(0 6px 10px rgba(22,19,15,0.25))',
      }}
    >
      <svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size}>
        <defs>
          <filter id="stamp" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency={1.4 * (80 / vb)} numOctaves={1} seed={5} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.35" result="holes" />
            <feComposite in="SourceGraphic" in2="holes" operator="in" />
          </filter>
        </defs>
        <g filter="url(#stamp)">
          <rect x={inset} y={inset} width={vb - inset * 2} height={vb - inset * 2} rx={vb * 0.075} fill="#d6402b" />
          <text x={40} y={40 + 29 * 0.36} textAnchor="middle" fontSize={29} fill="#fff8ef" style={{ fontFamily: 'YujiSyuku' }}>
            連勝
          </text>
        </g>
      </svg>
    </div>
  );
};
