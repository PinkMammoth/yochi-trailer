// Renders a list of frames (not seconds) at full size for several prop sets, bundling once.
//   COMP=... node tools/frames.mjs <outdir> '<json array of {name, props}>' f1 f2 ...
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const [outDir, setsJ, ...frames] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}),
  react: path.resolve('node_modules/react'), 'react-dom': path.resolve('node_modules/react-dom'), remotion: path.resolve('node_modules/remotion') } } }) });
for (const { name, props } of JSON.parse(setsJ)) {
  const composition = await selectComposition({ serveUrl, id: process.env.COMP, inputProps: props, browserExecutable, chromiumOptions: { gl: 'swangle' } });
  for (const f of frames) {
    const output = path.join(outDir, `${name}-f${String(f).padStart(4, '0')}.png`);
    await renderStill({ serveUrl, composition, frame: +f, output, inputProps: props, browserExecutable, chromiumOptions: { gl: 'swangle' } });
  }
  console.log(name, 'done');
}
