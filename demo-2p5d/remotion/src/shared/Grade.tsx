// Shared finishing pass for A and B: vignette and animated paper grain, plus letterbox-free
// framing. Kept identical so the comparison isolates the 2.5D core.
import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { H, W } from './timeline';
import { mulberry } from './slash';

const GW = 960;
const GH = 540;

export const Grade: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    const img = ctx.createImageData(GW, GH);
    const r = mulberry(1000 + f * 31);
    for (let i = 0; i < GW * GH; i++) {
      const v = 128 + (r() - 0.5) * 70;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [f]);
  return (
    <>
      <canvas
        ref={ref}
        width={GW}
        height={GH}
        style={{ position: 'absolute', inset: 0, width: W, height: H, mixBlendMode: 'soft-light', opacity: 0.45 }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 75% 80% at 50% 48%, rgba(15,13,11,0) 55%, rgba(15,13,11,0.34) 100%)',
        }}
      />
    </>
  );
};
