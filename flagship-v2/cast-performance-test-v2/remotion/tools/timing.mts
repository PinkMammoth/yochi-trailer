import fs from 'fs';
import * as T from '../src/timing.ts';
fs.writeFileSync(new URL('../../audio/timing.json', import.meta.url), JSON.stringify(T, null, 1));
console.log('audio/timing.json written');
