import React from 'react';
import { Composition } from 'remotion';
import { DURATION, FPS, Film, type FilmProps } from './Film';

const base: FilmProps = { status: 'none', music: false, sfx: false, voice: false };

export const Root: React.FC = () => (
  <>
    {/* 9:16 master, 1080x1920, 60 fps */}
    <Composition id="LastCandleStanding" component={Film} defaultProps={base} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
  </>
);
