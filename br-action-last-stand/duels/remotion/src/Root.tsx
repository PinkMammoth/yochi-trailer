import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { FPS, T, fr } from './data';

export const Root: React.FC = () => (
  <>
    <Composition id="Duels-16x9" component={Film} durationInFrames={fr(T.dur)} fps={FPS} width={1920} height={1080} defaultProps={{ format: '16:9' as const, audio: false }} />
    <Composition id="Duels-9x16" component={Film} durationInFrames={fr(T.dur)} fps={FPS} width={1080} height={1920} defaultProps={{ format: '9:16' as const, audio: false }} />
  </>
);
