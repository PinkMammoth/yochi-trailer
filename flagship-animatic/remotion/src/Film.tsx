// YOCHI flagship animatic. Every frame is a pure function of the film time t; every time comes from timing.json
// (audio/build_audio.py, measured from the owner's track). Picture renders silent; the stems are muxed after.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Grade, useFonts } from './lib/brand';
import { T } from './data';
import { Duel } from './scenes/Duel';
import { Pullback } from './scenes/Pullback';
import { FFAAct } from './scenes/FFA';
import { BRAct } from './scenes/BR';
import { EndCard } from './scenes/End';

export type Variant = 'ffa' | 'br';
export const Film: React.FC<{ variant: Variant; from?: number; slate?: boolean }> = ({ variant, from = 0 }) => {
  useFonts();
  const t = from + useCurrentFrame() / T.fps;
  const f = useCurrentFrame();
  let body: React.ReactNode;
  if (t < T.victory.pullStart) body = <Duel t={t} />;
  else if (t < T.victory.world) body = <Pullback t={t} />;
  else if (t < T.payoff.finalSlam) body = variant === 'ffa' ? <FFAAct t={t} /> : <BRAct t={t} />;
  else body = <EndCard t={t} variant={variant} />;
  return (
    <AbsoluteFill style={{ background: '#0f0d0b', overflow: 'hidden' }}>
      {body}
      <Grade seed={f} />
    </AbsoluteFill>
  );
};
