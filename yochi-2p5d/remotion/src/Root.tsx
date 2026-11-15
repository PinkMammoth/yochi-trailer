import React from 'react';
import { Composition, Series } from 'remotion';
import { BlenderPasses, CharacterShot, FORMATS, type ShotSpec } from './lib';
import { REWARDS, loopSpec, unlockSpec } from './app/rewards';
import { NewChallenger, NC_DURATION, type NewChallengerProps } from './films/new-challenger/NewChallenger';
import { SwapTax, ST_DURATION } from './films/swap-tax/SwapTax';
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
    {/* App assets: one card loop and one unlock clip per reward (tools/render-rewards.mts renders them all) */}
    {REWARDS.map((r) => shot(`Loop-${r.id}`, loopSpec(r.id)))}
    {REWARDS.map((r) => shot(`Unlock-${r.id}`, unlockSpec(r.id)))}
 {/* Films (src/films): 9:16, 60 fps. Caption variants via the `caption` prop (src/films/captions.ts). */}
    {([['NewChallenger', 'coming-soon'], ['NewChallenger-Testnet', 'testnet'], ['NewChallenger-MAINNET-UNPUBLISHED', 'mainnet']] as const).map(([id, caption]) => (
      <Composition key={id} id={id} component={NewChallenger as unknown as React.FC<Record<string, unknown>>} defaultProps={{ caption, tagline: 'brief', audio: true } as unknown as Record<string, unknown>}
        durationInFrames={NC_DURATION} fps={60} width={1080} height={1920} />
    ))}
    {([['SwapTax', 'testnet'], ['SwapTax-ComingSoon', 'coming-soon'], ['SwapTax-MAINNET-UNPUBLISHED', 'mainnet']] as const).map(([id, caption]) => (
      <Composition key={id} id={id} component={SwapTax as unknown as React.FC<Record<string, unknown>>} defaultProps={{ caption, audio: true } as unknown as Record<string, unknown>}
        durationInFrames={ST_DURATION} fps={60} width={1080} height={1920} />
    ))}
    <Composition id="Cuts-16x9" component={Cuts} durationInFrames={cutSequence.reduce((a, c) => a + c.spec.durationInFrames, 0)} fps={30} width={1920} height={1080} />
  </>
);
