import React from 'react';
import { Composition, Series } from 'remotion';
import { BlenderPasses, CharacterShot, FORMATS, type ShotSpec } from './lib';
import { cutSequence, duelMaster169, duelMaster916, untouchable169, untouchable916 } from './examples/shots';

const shot = (id: string, spec: ShotSpec) => (
  <Composition
    key={id}
    id={id}
    component={CharacterShot as React.FC<{ spec: ShotSpec; clean?: boolean }>}
    defaultProps={{ spec, clean: false }}
    durationInFrames={spec.durationInFrames}
    fps={spec.fps ?? 30}
    width={FORMATS[spec.format].width}
    height={FORMATS[spec.format].height}
  />
);

const Cuts: React.FC = () => (
  <Series>
    {cutSequence.map(({ spec }, i) => (
      <Series.Sequence key={i} durationInFrames={spec.durationInFrames}>
        <CharacterShot spec={spec} />
      </Series.Sequence>
    ))}
  </Series>
);

export const Root: React.FC = () => (
  <>
    {shot('Untouchable-16x9', untouchable169)}
    {shot('Untouchable-9x16', untouchable916)}
    {shot('DuelMaster-16x9', duelMaster169)}
    {shot('DuelMaster-9x16', duelMaster916)}
    {/* Blender path: needs blender/out/untouchable916 rendered (see blender/build_shot.py) and `npm run sync` */}
    <Composition id="Untouchable-9x16-Blender" component={BlenderPasses as React.FC<{ spec: ShotSpec; passes: string }>}
      defaultProps={{ spec: untouchable916, passes: 'passes/untouchable916' }} durationInFrames={150} fps={30} width={1080} height={1920} />
    <Composition id="Cuts-16x9" component={Cuts} durationInFrames={cutSequence.reduce((a, c) => a + c.spec.durationInFrames, 0)} fps={30} width={1920} height={1080} />
  </>
);
