import React from 'react';
import { Composition } from 'remotion';
import { ColdBloodedShot } from './ColdBlooded';
import { HighRollerShot } from './HighRoller';
import { UntouchableShot } from './Untouchable';
import { CB_CINEMATIC, CB_SINGLE, CB_TRAILER, FPS, HR_CINEMATIC, HR_TRAILER, UN_CINEMATIC, UN_TRAILER } from './timing';

const dims = { fps: FPS, width: 1920, height: 1080 } as const;
const fr = (s: number) => Math.round(s * FPS);
type Any = React.FC<Record<string, unknown>>;
const UN = UntouchableShot as unknown as Any, HR = HighRollerShot as unknown as Any, CB = ColdBloodedShot as unknown as Any;
export const Root: React.FC = () => (
  <>
    <Composition id="Untouchable-Cinematic" component={UN} durationInFrames={fr(UN_CINEMATIC.dur)} {...dims} defaultProps={{ cut: UN_CINEMATIC, type: true, diag: false }} />
    <Composition id="Untouchable-Trailer" component={UN} durationInFrames={fr(UN_TRAILER.dur)} {...dims} defaultProps={{ cut: UN_TRAILER, type: true, diag: false }} />
    <Composition id="Untouchable-Rigid" component={UN} durationInFrames={fr(UN_CINEMATIC.dur)} {...dims} defaultProps={{ cut: { ...UN_CINEMATIC, ribbons: 0 }, type: true, diag: false }} />
    <Composition id="HighRoller-Cinematic" component={HR} durationInFrames={fr(HR_CINEMATIC.dur)} {...dims} defaultProps={{ cut: HR_CINEMATIC, type: true, diag: false }} />
    <Composition id="HighRoller-Trailer" component={HR} durationInFrames={fr(HR_TRAILER.dur)} {...dims} defaultProps={{ cut: HR_TRAILER, type: true, diag: false }} />
    <Composition id="ColdBlooded-Cinematic" component={CB} durationInFrames={fr(CB_CINEMATIC.dur)} {...dims} defaultProps={{ cut: CB_CINEMATIC, type: false, diag: false }} />
    <Composition id="ColdBlooded-Single" component={CB} durationInFrames={fr(CB_SINGLE.dur)} {...dims} defaultProps={{ cut: CB_SINGLE, type: false, diag: false }} />
    <Composition id="ColdBlooded-Trailer" component={CB} durationInFrames={fr(CB_TRAILER.dur)} {...dims} defaultProps={{ cut: CB_TRAILER, type: true, diag: false }} />
  </>
);
