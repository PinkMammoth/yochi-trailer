// The ink-brush wipe between shots: cream ink sweeps across in staggered broad strokes, the cut happens under the
// ink (at p = 0.6), and a ragged edge clears it to reveal the next shot.
import React from 'react';
import { brushWipe } from '../lib/brush';
import { Canvas2D, useFmt, useT } from '../lib/frame';

export const WIPE_DUR = 0.3;
/** start time of a wipe whose cut lands on `cut` */
export const wipeStart = (cut: number) => cut - WIPE_DUR * 0.6;

export const Wipe: React.FC<{ start: number; seed?: number }> = ({ start, seed = 1 }) => {
  const t = useT(start);
  const { W, H, land } = useFmt();
  const p = (t - start) / WIPE_DUR;
  return <Canvas2D draw={(ctx) => brushWipe(ctx, W, H, p, [239, 231, 216], seed, land ? 4 : 5)} />;
};
