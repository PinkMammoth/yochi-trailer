// Extracts exactly the source frames the two edits use (both variants) into cache/<clip>/<index>.jpg (q 1),
// so the page can draw them. usage: node tools/frames.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITS, CLIPS, FPS } from '../src/edl.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const need = {};
for (const e of Object.values(EDITS)) for (const s of e.shots) {
  if (s.kind !== 'clip') continue;
  for (let f = Math.ceil(s.t0 * FPS - 1e-6); f / FPS < s.t1; f++) {
    const t = f / FPS, src = s.map ? s.map(t) : s.s0 + (t - s.t0) * (s.rate ?? 1);
    const i = Math.max(0, Math.round(src * FPS));
    const r = (need[s.src] ||= [Infinity, -Infinity]); r[0] = Math.min(r[0], i); r[1] = Math.max(r[1], i);
  }
}
for (const [clip, [a, z]] of Object.entries(need)) {
  const dir = path.join(root, 'cache', clip); fs.mkdirSync(dir, { recursive: true });
  const n = z - a + 1;
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.resolve(root, '..', CLIPS, clip + '.mp4'),
    '-vf', `select='between(n\\,${a}\\,${z})'`, '-vsync', '0', '-q:v', '1', '-start_number', String(a), path.join(dir, '%05d.jpg')], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
  console.log(clip, `frames ${a}-${z} (${n})`);
}
