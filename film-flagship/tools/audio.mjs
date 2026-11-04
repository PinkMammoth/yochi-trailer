// Builds the film's soundtrack from the source track, using the edit in src/core/music.js (AUDIO).
// usage: node tools/audio.mjs [out/the-cast.wav] [--click 1]   (--click mixes a beat click for judging the cut)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AUDIO, DURATION, BEAT } from '../src/core/music.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const out = path.resolve(root, args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a)) || 'out/yochi-flagship.wav');
const click = args.includes('--click');
const sfx = !args.includes('--nosfx'); // FLAGSHIP: the brush and stamp accents (tools/sfx.mjs)
fs.mkdirSync(path.dirname(out), { recursive: true });
const src = path.resolve(root, '../asset-pack/audio', AUDIO.file);
const [d0, d1] = AUDIO.dropout.map((s) => s - AUDIO.start); // film seconds
const f = AUDIO.dropoutFade;
const [fo0, fo1] = AUDIO.fadeOut;
// gain envelope: 1, ramp to 0 over f before d0, 0 until d1, ramp back over f; then the tail fade
const gain = `if(lt(t,${d0 - f}),1,if(lt(t,${d0}),(${d0}-t)/${f},if(lt(t,${d1}),0,if(lt(t,${d1 + f}),(t-${d1})/${f},1))))`;
let graph = `[0:a]atrim=start=${AUDIO.start},asetpts=PTS-STARTPTS,aresample=48000,volume='${gain}':eval=frame,` +
  `afade=t=out:st=${fo0}:d=${fo1 - fo0},atrim=0:${DURATION}[m]`;
const inputs = ['-i', src];
if (click) {
  inputs.push('-f', 'lavfi', '-i', `sine=f=1800:d=${DURATION}:sample_rate=48000`);
  graph += `;[1:a]volume='0.35*lt(mod(t,${BEAT}),0.02)':eval=frame,aformat=channel_layouts=stereo[c];[m][c]amix=inputs=2:normalize=0[o]`;
} else graph += ';[m]anull[o0]';
if (click) graph = graph.replace('[o]', '[o0]');
if (sfx) {
  const sf = out.replace(/\.wav$/, '') + '-sfx.wav';
  const r0 = spawnSync('node', [path.join(root, 'tools/sfx.mjs'), sf], { stdio: 'inherit' });
  if (r0.status !== 0) process.exit(1);
  inputs.push('-i', sf);
  graph += `;[o0][${inputs.filter((x) => x === '-i').length - 1}:a]amix=inputs=2:normalize=0:duration=first[o]`;
} else graph += ';[o0]anull[o]';
const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[o]', '-ac', '2', '-c:a', 'pcm_s24le', out], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status || 1);
console.log('wrote', out);
