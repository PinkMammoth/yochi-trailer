import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { drawFrame, H, W, type Assets, type Config } from './draw';
import { FPS } from './timing';

export type FilmProps = Config & { audio: string | null };

const IMAGES: Record<Exclude<keyof Assets, 'figSil'>, string> = {
  fig: 'cast/cold-blooded-fig.png',
  sky: 'world/sky.png',
  moon: 'world/moon.png',
  wisps: 'world/wisps.png',
  ridgeFar: 'world/ridge-far.png',
  ridgeMid: 'world/ridge-mid.png',
  ridgeNear: 'world/ridge-near.png',
  mist: 'world/mist.png',
  grain: 'world/grain.png',
  paper: 'world/paper.png',
  seal: 'logo/yochi-seal-paper.svg',
};
const FONTS: [string, string, string][] = [
  ['Dela', 'fonts/dela-gothic-one-latin-400-normal.woff2', '400'],
  ['ZenKaku', 'fonts/zen-kaku-gothic-new-latin-700-normal.woff2', '700'],
  ['ZenKaku', 'fonts/zen-kaku-gothic-new-latin-900-normal.woff2', '900'],
  ['JBMono', 'fonts/jetbrains-mono-latin-500-normal.woff2', '500'],
  ['JBMono', 'fonts/jetbrains-mono-latin-700-normal.woff2', '700'],
];

let assetsPromise: Promise<Assets> | null = null;
function loadAssets(): Promise<Assets> {
  assetsPromise ??= (async () => {
    await Promise.all(
      FONTS.map(async ([fam, url, weight]) => {
        const ff = await new FontFace(fam, `url(${staticFile(url)})`, { weight }).load();
        (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
      }),
    );
    const entries = await Promise.all(
      Object.entries(IMAGES).map(
        ([k, url]) =>
          new Promise<[string, HTMLImageElement]>((res, rej) => {
            const im = new Image();
            im.onload = () => res([k, im]);
            im.onerror = () => rej(new Error('failed to load ' + url));
            im.src = staticFile(url);
          }),
      ),
    );
    return Object.fromEntries(entries) as unknown as Assets;
  })();
  return assetsPromise;
}

export const Film: React.FC<FilmProps> = ({ captions, status, audio }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | null>(null);
  const [handle] = useState(() => delayRender('assets'));
  useLayoutEffect(() => {
    loadAssets().then((a) => {
      setAssets(a);
      continueRender(handle);
    });
  }, [handle]);
  useLayoutEffect(() => {
    if (!assets || !ref.current) return;
    const ctx = ref.current.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingQuality = 'high';
    drawFrame(ctx, assets, frame / FPS, { captions, status });
  }, [assets, frame, captions, status]);
  return (
    <AbsoluteFill style={{ background: '#0f0d0b' }}>
      <canvas ref={ref} width={W} height={H} style={{ width: '100%', height: '100%' }} />
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
};
