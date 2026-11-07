// Builds a film's soundtrack: the Victory Stamp edit in src/core/music.js (AUDIO) plus the sound design.
// usage: node tools/audio.mjs <A|B> <out.wav> [--nosfx]
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AUDIO, DURATION } from '../src/core/music.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [v, outArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const out = path.resolve(outArg);
const sfx = !process.argv.includes('--nosfx');
fs.mkdirSync(path.dirname(out), { recursive: true });
const src = path.resolve(root, '../asset-pack/audio', AUDIO.file);
const [s0, s1] = AUDIO.dropout, f = AUDIO.dropoutFade, xf = AUDIO.spliceFade, [fo0, fo1] = AUDIO.fadeOut;
const gain = `if(lt(t,${s0 - f}),1,if(lt(t,${s0}),(${s0}-t)/${f},if(lt(t,${s1}),0,if(lt(t,${s1 + f}),(t-${s1})/${f},1))))`;
const segs = AUDIO.segments;
let g = `[0:a]aresample=48000,volume='${gain}':eval=frame,asplit=${segs.length}${segs.map((_, i) => `[r${i}]`).join('')}`;
segs.forEach(([a, b], i) => { g += `;[r${i}]atrim=start=${a}:end=${i < segs.length - 1 ? b + xf : b},asetpts=PTS-STARTPTS[s${i}]`; });
let last = 's0';
for (let i = 1; i < segs.length; i++) { g += `;[${last}][s${i}]acrossfade=d=${xf}:c1=qsin:c2=qsin[x${i}]`; last = `x${i}`; }
g += `;[${last}]afade=t=in:st=0:d=${AUDIO.fadeIn},afade=t=out:st=${fo0}:d=${fo1 - fo0},atrim=0:${DURATION},volume=0.89[m]`;
const inputs = ['-i', src];
if (sfx) {
  const sf = out.replace(/\.wav$/, '') + '-sfx.wav';
  const r0 = spawnSync('node', [path.join(root, 'tools/sfx.mjs'), v, sf], { stdio: 'inherit' });
  if (r0.status !== 0) process.exit(1);
  inputs.push('-i', sf);
  g += ';[m][1:a]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[o]';
} else g += ';[m]anull[o]';
const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', g, '-map', '[o]', '-ac', '2', '-c:a', 'pcm_s24le', out], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status || 1);
console.log('wrote', out);
