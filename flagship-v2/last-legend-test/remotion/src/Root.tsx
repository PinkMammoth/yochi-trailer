import React from 'react';
import { Composition } from 'remotion';
import { LastLegendShot, Props } from './LastLegend';
import { CINEMATIC, FPS, TRAILER, TRAILER6 } from './timing';

const dims = { fps: FPS, width: 1920, height: 1080 } as const;
const Shot = LastLegendShot as unknown as React.FC<Record<string, unknown>>;
export const Root: React.FC = () => (
  <>
    <Composition id="LastLegend-Cinematic" component={Shot} durationInFrames={Math.round(CINEMATIC.dur * FPS)} {...dims}
      defaultProps={{ cut: CINEMATIC, method: 'cut-smear', showMask: false, diag: false, type: false } satisfies Props} />
    <Composition id="LastLegend-Trailer" component={Shot} durationInFrames={Math.round(TRAILER.dur * FPS)} {...dims}
      defaultProps={{ cut: TRAILER, method: 'cut-smear', showMask: false, diag: false, type: true } satisfies Props} />
    <Composition id="LastLegend-Trailer6" component={Shot} durationInFrames={Math.round(TRAILER6.dur * FPS)} {...dims}
      defaultProps={{ cut: TRAILER6, method: 'cut-smear', showMask: false, diag: false, type: true } satisfies Props} />
  </>
);
