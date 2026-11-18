import React from 'react';
import { Composition } from 'remotion';
import { DURATION, FPS, Film, type FilmProps } from './Film';

const base = (format: FilmProps['format']): FilmProps => ({ format, status: 'none', music: true, sfx: true });

export const Root: React.FC = () => (
  <>
    {/* primary: 16:9 master */}
    <Composition id="BR-V2-16x9" component={Film} defaultProps={base('16:9')} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    {/* secondary: 9:16, recomposed */}
    <Composition id="BR-V2-9x16" component={Film} defaultProps={base('9:16')} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
  </>
);
