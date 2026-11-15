// Renders the app assets for every reward: the VIEW CARD loop and the unlock clip, then encodes them for the
// web (H.264 High, yuv420p, faststart, no audio) and writes the unlock clip's poster (its last frame).
//
//   node --experimental-strip-types tools/render-rewards.mts [id ...] [--only loop|unlock]
//
// Output: ../deliverables/app/<card>-loop.mp4, <card>-unlock.mp4, <card>-unlock.webp, and manifest.json.
// Masters (near-lossless) stay in out/app-master/. Bundles once; renders one composition at a time with
// 4 workers. Software GL (swangle), the cloud image's Chromium.
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REWARDS, LOOP_FRAMES, UNLOCK_FRAMES, UNLOCK_HIT } from '../src/app/rewards.ts';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const out = path.resolve(root, '../deliverables/app');
const master = path.resolve(root, 'out/app-master');
mkdirSync(out, { recursive: true });
mkdirSync(master, { recursive: true });
const BROWSER = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const ids = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--only');
const todo = REWARDS.filter((r) => ids.length === 0 || ids.includes(r.id));

// Encoding targets. Loop: the painting rect at native size (1392x1828), so it sits 1:1 over the card <img>.
// Unlock: 4:5 at 720x900 (the moment's panel is ~336 css px wide; 2x screens get 672).
const ENC = {
  loop: { crf: '24', scale: null as string | null },
  unlock: { crf: '24', scale: '720:900' },
};

const serveUrl = await bundle({ entryPoint: path.resolve(root, 'src/index.ts'), publicDir: path.resolve(root, 'public') });
const manifestPath = path.join(out, 'manifest.json');
const manifest: Record<string, unknown> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

for (const r of todo) {
  for (const kind of ['loop', 'unlock'] as const) {
    if (only && only !== kind) continue;
    const id = `${kind === 'loop' ? 'Loop' : 'Unlock'}-${r.id}`;
    const t0 = Date.now();
    const composition = await selectComposition({ serveUrl, id, browserExecutable: BROWSER, chromiumOptions: { gl: 'swangle' } });
    const m = path.join(master, `${r.card}-${kind}.mp4`);
    await renderMedia({
      composition, serveUrl, codec: 'h264', crf: 12, outputLocation: m,
      browserExecutable: BROWSER, chromiumOptions: { gl: 'swangle' }, concurrency: 4, imageFormat: 'png',
      muted: true,
    });
    const rendered = (Date.now() - t0) / 1000;
    const dst = path.join(out, `${r.card}-${kind}.mp4`);
    const vf = ENC[kind].scale ? ['-vf', `scale=${ENC[kind].scale}:flags=lanczos`] : [];
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', m, ...vf, '-c:v', 'libx264', '-preset', 'slow',
      '-crf', ENC[kind].crf, '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', dst]);
    let poster: string | undefined;
    if (kind === 'unlock') {
      poster = path.join(out, `${r.card}-unlock.webp`);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-sseof', '-0.05', '-i', m, '-frames:v', '1',
        '-vf', 'scale=720:900:flags=lanczos', '-quality', '86', poster]);
    }
    const kb = Math.round(statSync(dst).size / 1024);
    const entry = (manifest[r.card] ??= { id: r.id, achievement: r.achievement }) as Record<string, unknown>;
    entry[kind] = { file: path.basename(dst), kb, ...(poster ? { poster: path.basename(poster) } : {}),
      frames: kind === 'loop' ? LOOP_FRAMES : UNLOCK_FRAMES, ...(kind === 'unlock' ? { hitFrame: UNLOCK_HIT } : {}) };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
    console.log(`${id}: rendered ${rendered.toFixed(0)}s, ${kb} KB`);
  }
}
