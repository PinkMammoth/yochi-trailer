// YOCHI FLAGSHIP v2. The opening IS THE LAST STAND v2: its own scenes, art, camera, timing and sound, unchanged up to
// the victory reveal. The standalone film's lockup card is switched off (Victory lockup=false), the victory hold
// runs on to bar 76, and the film continues from that frame into the reveal and the Free For All round.
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { useFonts } from './lib/brand';
import { FmtCtx } from './lib/frame';
import { T, fr } from './data';
import { Challenger, PickHer, PickHim, Threat } from './scenes/Open';
import { CandleOpen, LastGrin, Reversal, Winning } from './scenes/Candle';
import { CALM_AT, Calm, Disbelief, Lunge } from './scenes/Turn';
import { Strike } from './scenes/Strike';
import { Victory } from './scenes/Victory';
import { InkWipe, WIPE_LEN } from './scenes/Wipe';
import { FT, FlagshipAct } from './flagship/Act';

const seq = (a: number, b: number) => ({ from: fr(a), durationInFrames: fr(b) - fr(a) });
const Rest: React.FC<{ t0: number }> = ({ t0 }) => <FlagshipAct t={t0 + useCurrentFrame() / T.fps} />;

export const Flagship: React.FC = () => {
  useFonts();
  const P = FT.pull.start;
  return (
    <FmtCtx.Provider value="16:9">
      <AbsoluteFill style={{ background: '#0f0d0b' }}>
        {/* ---- THE LAST STAND v2, as approved ---- */}
        <Sequence {...seq(T.threat.start, T.threat.end)}><Threat /></Sequence>
        <Sequence {...seq(T.challenger.start, T.challenger.end)}><Challenger /></Sequence>
        <Sequence {...seq(T.pickHim.start, T.pickHim.end)}><PickHim /></Sequence>
        <Sequence {...seq(T.pickHer.start, T.pickHer.end)}><PickHer /></Sequence>
        <Sequence {...seq(T.candle.start, T.candle.end)}><CandleOpen /></Sequence>
        <Sequence {...seq(T.winning.start, T.winning.end)}><Winning /></Sequence>
        <Sequence {...seq(T.reversal.start, T.reversal.end)}><Reversal /></Sequence>
        <Sequence {...seq(T.lastGrin.start, T.lastGrin.end)}><LastGrin /></Sequence>
        <Sequence {...seq(T.disbelief.start, CALM_AT)}><Disbelief /></Sequence>
        <Sequence {...seq(CALM_AT, T.strike.start)}><Calm /></Sequence>
        <Sequence {...seq(T.strike.start, T.strike.wide)}><Lunge /></Sequence>
        <Sequence {...seq(T.strike.wide, T.victory.start)}><Strike /></Sequence>
        <Sequence {...seq(T.victory.start, P)}><Victory lockup={false} /></Sequence>
        <Sequence {...seq(T.victory.wipe, T.victory.wipe + WIPE_LEN)}><InkWipe /></Sequence>
        {/* ---- the flagship continues from her victory ---- */}
        <Sequence from={fr(P)} durationInFrames={fr(FT.dur) - fr(P)}><Rest t0={P} /></Sequence>
        <Grade W={1920} H={1080} vignette={0.25} grain={0.05} />
      </AbsoluteFill>
    </FmtCtx.Provider>
  );
};
