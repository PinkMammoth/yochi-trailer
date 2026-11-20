// YOCHI DUELS: THE LAST STAND. Every frame is a pure function of time; every time is in timing.json (written by
// audio/build_audio.py from the measured track). Picture renders silent; the three stems in audio/out are muxed
// after, so music, effects and picture stay separately editable.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { useFonts } from './lib/brand';
import { FmtCtx, type Fmt } from './lib/frame';
import { T, fr } from './data';
import { Challenger, PickHer, PickHim, Threat } from './scenes/Open';
import { CandleOpen, LastGrin, Reversal, Winning } from './scenes/Candle';
import { CALM_AT, Calm, Disbelief, Lunge } from './scenes/Turn';
import { Strike } from './scenes/Strike';
import { Finale } from './scenes/Finale';

const seq = (a: number, b: number) => ({ from: fr(a), durationInFrames: fr(b) - fr(a) });

export const Film: React.FC<{ format?: Fmt; audio?: boolean }> = ({ format = '16:9', audio }) => {
  useFonts();
  const land = format === '16:9';
  return (
    <FmtCtx.Provider value={format}>
      <AbsoluteFill style={{ background: '#0f0d0b' }}>
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
        <Sequence {...seq(T.strike.wide, T.finale.start)}><Strike /></Sequence>
        <Sequence {...seq(T.finale.start, T.dur)}><Finale /></Sequence>
        <Grade W={land ? 1920 : 1080} H={land ? 1080 : 1920} vignette={0.25} grain={0.05} />
        {audio && <Audio src={staticFile('audio/mix.wav')} />}
      </AbsoluteFill>
    </FmtCtx.Provider>
  );
};
