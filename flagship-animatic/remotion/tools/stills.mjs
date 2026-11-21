// node tools/stills.mjs <outdir> <comp> t1 t2 ...   (film seconds; 960x540 review stills)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
const [out, comp, ...ts] = process.argv.slice(2);
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable: BROWSER });
for (const t of ts) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * composition.fps));
  await renderStill({ composition, serveUrl, frame, output: `${out}/${comp}-${t}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, scale: Number(process.env.SCALE ?? 0.5), browserExecutable: BROWSER });
  console.log(t);
}
