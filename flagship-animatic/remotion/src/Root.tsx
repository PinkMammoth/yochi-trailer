import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { T, fr } from './data';

const V = T.victory;
export const Root: React.FC = () => (
  <>
    <Composition id="Flagship-FFA" component={Film} defaultProps={{ variant: 'ffa' as const }} durationInFrames={fr(T.dur)} fps={T.fps} width={1920} height={1080} />
    <Composition id="Flagship-BR" component={Film} defaultProps={{ variant: 'br' as const }} durationInFrames={fr(T.dur)} fps={T.fps} width={1920} height={1080} />
    {/* the transition on its own: victory hold, pullback, the world, into the second act's first bar */}
    <Composition id="Pullback-Proto" component={Film} defaultProps={{ variant: 'ffa' as const, from: V.reveal, slate: true }} durationInFrames={fr(T.act2.start + 2.8 - V.reveal)} fps={T.fps} width={1920} height={1080} />
  </>
);
