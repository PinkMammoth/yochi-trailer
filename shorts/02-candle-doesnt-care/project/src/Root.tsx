import React from 'react';
import { Composition } from 'remotion';
import { Film, type FilmProps } from './Film';
import { DURATION_FRAMES, FPS, T } from './timing';

const base: FilmProps = { captions: true, status: null, audio: 'audio/candle-mix.wav' };
/** the prelude: act one alone, 0 to 6.40 s (frames 0-383), ending on the eyes where the film cuts to silence */
const PRELUDE_FRAMES = Math.round(T.silence * FPS);

export const Root: React.FC = () => (
  <>
    {/* the master: 9:16, captions on, full mix (music + effects; no announcer, see README) */}
    <Composition id="Candle-9x16" component={Film} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={base} />
    {/* picture only (for re-mixing, or a recorded voice-over) */}
    <Composition id="Candle-9x16-silent" component={Film} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{ ...base, audio: null }} />
    {/* the prelude, standalone: the same frames as the film's first 6.40 s, with the score's hard cut */}
    <Composition id="Prelude-9x16" component={Film} durationInFrames={PRELUDE_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={base} />
    {/* the prelude with no captions: a clean plate for other lines, other languages, or other edits */}
    <Composition id="Prelude-9x16-clean" component={Film} durationInFrames={PRELUDE_FRAMES} fps={FPS} width={1080} height={1920} defaultProps={{ ...base, captions: false }} />
  </>
);
