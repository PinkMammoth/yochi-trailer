import React from 'react';
import { Composition } from 'remotion';
import { Film, type FilmProps } from './Film';
import { DURATION_FRAMES, FPS } from './timing';

const base: FilmProps = { captions: true, status: null, audio: 'audio/candle-mix.wav' };

export const Root: React.FC = () => (
  <>
    {/* the master: 9:16, captions on, full mix (music + effects; no announcer, see README) */}
    <Composition id="Candle-9x16" component={Film} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={base} />
    {/* picture only (for re-mixing, or a recorded voice-over) */}
    <Composition id="Candle-9x16-silent" component={Film} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{ ...base, audio: null }} />
  </>
);
