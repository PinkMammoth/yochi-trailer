// BATTLE ROYALE V2 (LAST CANDLE STANDING, music-driven): the film. 16:9 master, 9:16 recomposed. Each scene is
// mounted for its slice of the timing map (timing.json, derived from the music edit) and reads global time.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { useFonts } from './lib/brand';
import { FmtCtx, type Fmt } from './lib/frame';
import { FPS, T, sec } from './data';
import { Ring } from './scenes/Ring';
import { Montage, roundStarts } from './scenes/Montage';
import { WIPE_DUR, Wipe, wipeStart } from './scenes/Wipe';
import { CloseUpRival, CloseUpYou, LastCandle, Versus } from './scenes/FaceOff';
import { EndCard, Hero } from './scenes/Hero';

export type Status = 'none' | 'coming-soon' | 'testnet' | 'elysium';
export type FilmProps = { format: Fmt; status: Status; music: boolean; sfx: boolean };

const S: React.FC<{ a: number; b: number; children: React.ReactNode }> = ({ a, b, children }) => (
  <Sequence from={sec(a)} durationInFrames={sec(b) - sec(a)} layout="none">{children}</Sequence>
);
// ink-brush wipes over three cuts: into the montage, into round 4, into 2 LEFT (the breakdown)
const WIPES = [T.montage.start, roundStarts[2], T.reset.start];

export const Film: React.FC<FilmProps> = ({ format, status, music, sfx }) => {
  useFonts();
  return (
    <FmtCtx.Provider value={format}>
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
        {WIPES.map((c, i) => (
          <S key={c} a={wipeStart(c)} b={wipeStart(c) + WIPE_DUR}><Wipe start={wipeStart(c)} seed={i + 1} /></S>
        ))}
        {/* separable tracks: the owner's music edit and the effects (no announcer) */}
        {music && <Audio src={staticFile('audio/music.wav')} />}
        {sfx && <Audio src={staticFile('audio/sfx.wav')} />}
      </AbsoluteFill>
    </FmtCtx.Provider>
  );
};
export const DURATION = sec(T.dur);
export { FPS };
