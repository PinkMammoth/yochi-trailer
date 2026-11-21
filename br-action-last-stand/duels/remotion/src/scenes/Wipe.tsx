// The ink clears: the brush wipe from the house brush kit (horizontal loaded strokes cover the frame, the cut
// happens under the ink, then a ragged edge clears it), so the attack pose never morphs into the victory pose.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { brushWipe } from '../lib/brush';
import { Canvas2D, useFmt } from '../lib/frame';
import { FPS, T } from '../data';

export const WIPE_LEN = 0.45; // covers by 0.5, cut at 0.6 (= victory.start), clear by 1.0
export const InkWipe: React.FC = () => {
  const t = T.victory.wipe + useCurrentFrame() / FPS;
  const { W, H } = useFmt();
  const p = (t - T.victory.wipe) / WIPE_LEN;
  return <Canvas2D draw={(ctx) => brushWipe(ctx, W, H, p, [22, 19, 15], 7, 5)} />;
};
