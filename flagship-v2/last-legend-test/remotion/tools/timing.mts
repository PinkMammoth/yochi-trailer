// Writes ../audio/timing.json from src/timing.ts so the sound is built on the picture's numbers.
import fs from 'fs';
import { CINEMATIC, TRAILER, TRAILER6, FPS, BEAT } from '../src/timing.ts';
fs.writeFileSync(new URL('../../audio/timing.json', import.meta.url), JSON.stringify({ FPS, BEAT, cinematic: CINEMATIC, trailer: TRAILER, trailer6: TRAILER6 }, null, 1));
console.log('audio/timing.json written');
