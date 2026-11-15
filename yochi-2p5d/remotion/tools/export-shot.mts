// Exports a shot's per-frame state for Blender: the same shotState() the Remotion components use.
//   node --experimental-strip-types tools/export-shot.mts untouchable916 [name]
// Writes ../blender/shots/<name>.json (default name = the export name).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { shotState, FORMATS, layerZoom } from '../src/lib/shot.ts';
import * as shots from '../src/examples/shots.ts';

const key = process.argv[2];
const spec = (shots as Record<string, unknown>)[key] as import('../src/lib/shot.ts').ShotSpec;
if (!spec || !('character' in spec)) throw new Error(`no ShotSpec export "${key}" in src/examples/shots.ts`);
const name = process.argv[3] ?? key;
const meta = JSON.parse(readFileSync(new URL(`../../characters/${spec.character}/build/meta.json`, import.meta.url), 'utf8'));
const frames = [];
for (let f = 0; f < spec.durationInFrames; f++) {
  const s = shotState(spec, meta, f);
  frames.push({ f, cam: s.cam, nearZoom: layerZoom(s.cam.zoom, 1), fig: s.fig, light: s.light, t: s.t });
}
mkdirSync(new URL('../../blender/shots/', import.meta.url), { recursive: true });
writeFileSync(new URL(`../../blender/shots/${name}.json`, import.meta.url),
  JSON.stringify({ name, spec, meta, size: FORMATS[spec.format], fps: spec.fps ?? 30, frames }));
console.log(`wrote blender/shots/${name}.json (${frames.length} frames, ${spec.character}, ${spec.format})`);
