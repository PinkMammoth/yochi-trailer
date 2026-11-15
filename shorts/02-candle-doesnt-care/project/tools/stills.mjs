// node tools/stills.mjs <outdir> <t1> <t2> ...   (seconds) -> PNG stills of Candle-9x16-silent
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [, , out, ...ts] = process.argv;
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const comp = await selectComposition({ serveUrl, id: 'Candle-9x16-silent', browserExecutable });
for (const t of ts) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(t) * comp.fps));
  const file = path.join(out, `t${parseFloat(t).toFixed(2)}.png`);
  await renderStill({ composition: comp, serveUrl, output: file, frame, browserExecutable, chromiumOptions: { gl: 'swangle' } });
  console.log(file);
}
