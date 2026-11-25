import React from 'react';
import { Composition } from 'remotion';
import { Untouchable2Shot } from './Untouchable2';
import { ColdBlooded2Shot } from './ColdBlooded2';
import { CB_CONCEALED, CB_CONCEALED_TRAILER, CB_LAYERED, FPS, UN_CINEMATIC, UN_TRAILER } from './timing';

const dims = { fps: FPS, width: 1920, height: 1080 } as const;
const fr = (s: number) => Math.round(s * FPS);
type Any = React.FC<Record<string, unknown>>;
const UN = Untouchable2Shot as unknown as Any, CB = ColdBlooded2Shot as unknown as Any;
export const Root: React.FC = () => (
  <>
    <Composition id="Untouchable2-Cinematic" component={UN} durationInFrames={fr(UN_CINEMATIC.dur)} {...dims} defaultProps={{ cut: UN_CINEMATIC, diag: false }} />
    <Composition id="Untouchable2-Trailer" component={UN} durationInFrames={fr(UN_TRAILER.dur)} {...dims} defaultProps={{ cut: UN_TRAILER, diag: false }} />
    <Composition id="Untouchable2-Rigid" component={UN} durationInFrames={fr(UN_CINEMATIC.dur)} {...dims} defaultProps={{ cut: { ...UN_CINEMATIC, ribbons: 0 }, diag: false }} />
    <Composition id="ColdBlooded2-Concealed" component={CB} durationInFrames={fr(CB_CONCEALED.dur)} {...dims} defaultProps={{ cut: CB_CONCEALED, type: false, diag: false }} />
    <Composition id="ColdBlooded2-Trailer" component={CB} durationInFrames={fr(CB_CONCEALED_TRAILER.dur)} {...dims} defaultProps={{ cut: CB_CONCEALED_TRAILER, type: true, diag: false }} />
    <Composition id="ColdBlooded2-Layered" component={CB} durationInFrames={fr(CB_LAYERED.dur)} {...dims} defaultProps={{ cut: CB_LAYERED, type: false, diag: false }} />
  </>
);
