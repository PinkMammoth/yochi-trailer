import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { FPS, T, fr } from './data';

export const Root: React.FC = () => (
  <Composition id="LastStand-16x9" component={Film} durationInFrames={fr(T.dur)} fps={FPS} width={1920} height={1080} defaultProps={{ audio: false }} />
);
