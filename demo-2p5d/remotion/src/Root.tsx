import React from 'react';
import { AbsoluteFill, Composition, continueRender, delayRender, staticFile } from 'remotion';
import { DURATION, FPS, H, W } from './shared/timeline';
import { WarpShot } from './A/WarpShot';
import { BlenderShot } from './B/BlenderShot';
import { Particles } from './shared/Particles';
import { Seal } from './shared/Seal';
import { Grade } from './shared/Grade';
import { SlashTest } from './debug/SlashTest';

// Brand glyph face for the seal (Yuji Syuku, kanji only).
const fontHandle = delayRender('font');
const ff = new FontFace('YujiSyuku', `url(${staticFile('YujiSyuku-Regular.ttf')})`);
ff.load().then((f) => {
  (document.fonts as any).add(f);
  continueRender(fontHandle);
});

// `clean` drops particles, seal and grade: used only to measure fidelity of the 2.5D core.
type P = { clean?: boolean };

export const PureRemotion: React.FC<P> = ({ clean }) => (
  <AbsoluteFill style={{ background: '#f2ece0' }}>
    <WarpShot />
    {!clean && <Particles />}
    {!clean && <Seal />}
    {!clean && <Grade />}
  </AbsoluteFill>
);

export const BlenderComposite: React.FC<P> = ({ clean }) => (
  <AbsoluteFill style={{ background: '#f2ece0' }}>
    <BlenderShot />
    {!clean && <Particles motesInBlender />}
    {!clean && <Seal />}
    {!clean && <Grade />}
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <>
    <Composition id="PureRemotion" component={PureRemotion} defaultProps={{ clean: false }} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="BlenderComposite" component={BlenderComposite} defaultProps={{ clean: false }} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="SlashTest" component={SlashTest} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
  </>
);
