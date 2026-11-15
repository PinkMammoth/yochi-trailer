// Writes the shared timeline (src/shared/timeline.ts) per frame to ../blender/timeline.json,
// so Blender keys exactly the same camera, performance and light as implementation A.
import { writeFileSync } from 'node:fs';
import { DURATION, IMPACT, FPS, camera, performance, light, impactEnv } from '../src/shared/timeline.ts';
const frames = [];
for (let f = 0; f < DURATION; f++) frames.push({ f, cam: camera(f), perf: performance(f), light: light(f), impact: impactEnv(f) });
writeFileSync(new URL('../../blender/timeline.json', import.meta.url), JSON.stringify({ fps: FPS, impact: IMPACT, frames }));
console.log('wrote', frames.length, 'frames');
