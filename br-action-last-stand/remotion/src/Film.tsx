// THE LAST STAND: the action proof of concept. Every frame is a pure function of time; every time is in timing.json.
// Picture is rendered silent; the three audio stems (audio/out) are muxed after, so sound and picture stay separable.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Grade } from '../../../yochi-2p5d/remotion/src/lib';
import { useFonts } from './lib/brand';
import { T, fr } from './data';
import { Eyes, FaceOff, LastCandle, LockLeft, LockRight } from './scenes/Duel';
import { Aftermath, Strike } from './scenes/Hit';

const seq = (a: number, b: number) => ({ from: fr(a), durationInFrames: fr(b) - fr(a) });

export const Film: React.FC<{ audio?: boolean }> = ({ audio }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: '#0f0d0b' }}>
      <Sequence {...seq(T.faceoff.start, T.faceoff.end)}><FaceOff /></Sequence>
      <Sequence {...seq(T.eyes.start, T.eyes.end)}><Eyes /></Sequence>
      <Sequence {...seq(T.lockL.start, T.lockL.end)}><LockLeft /></Sequence>
      <Sequence {...seq(T.lockR.start, T.lockR.end)}><LockRight /></Sequence>
      <Sequence {...seq(T.candle.start, T.candle.end)}><LastCandle /></Sequence>
      <Sequence {...seq(T.strike.start, T.strike.hit)}><Strike /></Sequence>
      <Sequence {...seq(T.impact.start, T.dur)}><Aftermath /></Sequence>
      <Grade W={1920} H={1080} vignette={0.25} grain={0.05} />
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
