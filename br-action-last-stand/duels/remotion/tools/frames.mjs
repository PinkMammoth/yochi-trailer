// Renders exact frames as full-size stills (for patching the yochi-2p5d parallel-render blank-frame glitch).
//   COMP=Duels-16x9 node tools/frames.mjs <outdir> <frame> [frame ...]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const [outDir, ...frames] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}),
  react: path.resolve('node_modules/react'), 'react-dom': path.resolve('node_modules/react-dom'), remotion: path.resolve('node_modules/remotion') } } }) });
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? 'Duels-16x9', inputProps: {}, browserExecutable, chromiumOptions: { gl: 'swangle' } });
for (const f of frames) {
  const output = path.join(outDir, `f${String(f).padStart(4, '0')}.png`);
  await renderStill({ serveUrl, composition, frame: +f, output, inputProps: {}, browserExecutable, chromiumOptions: { gl: 'swangle' } });
  console.log(output);
}
