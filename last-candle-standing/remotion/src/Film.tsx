// LAST CANDLE STANDING: the film. Each scene is mounted for its slice of the timing map; scenes read global time.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { useFonts } from './lib/brand';
import { FPS, T, sec } from './data';
import { Ring } from './scenes/Ring';
import { Montage, roundStart } from './scenes/Montage';
import { WIPE_DUR, Wipe, wipeStart } from './scenes/Wipe';
import { CloseUpRival, CloseUpYou, LastCandle, Versus } from './scenes/FaceOff';
import { EndCard, Hero } from './scenes/Hero';

export type Status = 'none' | 'coming-soon' | 'testnet' | 'elysium';
export type FilmProps = { status: Status; music: boolean; sfx: boolean; voice: boolean };

const S: React.FC<{ a: number; b: number; children: React.ReactNode }> = ({ a, b, children }) => (
  <Sequence from={sec(a)} durationInFrames={sec(b) - sec(a)} layout="none">{children}</Sequence>
);

const WIPES = [T.montage.start, roundStart(2), roundStart(4), T.reset.start];

export const Film: React.FC<FilmProps> = ({ status, music, sfx }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: '#0f0d0b' }}>
      <S a={0} b={T.montage.start}><Ring mode="open" start={0} /></S>
      <S a={T.montage.start} b={T.montage.end}><Montage /></S>
      <S a={T.reset.start} b={T.reset.end}><Ring mode="reset" start={T.reset.start} /></S>
      <S a={T.versus.start} b={T.versus.end}><Versus /></S>
      <S a={T.cuYou.start} b={T.cuYou.end}><CloseUpYou /></S>
      <S a={T.cuRival.start} b={T.cuRival.end}><CloseUpRival /></S>
      <S a={T.candle.start} b={T.candle.end}><LastCandle /></S>
      <S a={T.hero.start} b={T.hero.end}><Hero status={status} /></S>
      <S a={T.endcard.start} b={T.dur}><EndCard status={status} /></S>
      {/* ink-brush wipes over the cuts: into the montage, two inside it, out of it */}
      {WIPES.map((c, i) => (
        <S key={c} a={wipeStart(c)} b={wipeStart(c) + WIPE_DUR}><Wipe start={wipeStart(c)} seed={i + 1} /></S>
      ))}
      {/* separable stems (audio/score.py): music and effects on their own tracks; there is no announcer */}
      {music && <Audio src={staticFile('audio/music.wav')} />}
      {sfx && <Audio src={staticFile('audio/sfx.wav')} />}
    </AbsoluteFill>
  );
};
export const DURATION = sec(T.dur);
export { FPS };
