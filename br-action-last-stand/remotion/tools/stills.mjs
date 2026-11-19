// Renders stills at given times (s) to a folder, bundling once. Usage:
//   node tools/stills.mjs <outdir> <scale> <t1> <t2> ...   (scale 0.5 = 540x960 review stills)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const [outDir, scaleS, ...times] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.resolve('src/index.ts'),
  webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}),
    react: path.resolve('node_modules/react'), 'react-dom': path.resolve('node_modules/react-dom'), remotion: path.resolve('node_modules/remotion') } } }),
});
const inputProps = JSON.parse(process.env.PROPS ?? '{}');
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? 'LastStand-16x9', inputProps, browserExecutable, chromiumOptions: { gl: 'swangle' } });
for (const ts of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(ts) * composition.fps));
  const output = path.join(outDir, `t${parseFloat(ts).toFixed(3).padStart(5, '0')}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: parseFloat(scaleS), inputProps, browserExecutable, chromiumOptions: { gl: 'swangle' } });
  console.log(output);
}
