// Typography audit for the DOM-typeset films in src/films (the Remotion counterpart of
// docs/asset-audit/tools/text_audit.mjs, which hooks canvas fillText for the shorts/flagship engine).
// Renders every Nth frame with the `audit` prop on; each frame logs every visible string's box and rendered cap
// height (kit.tsx TextAudit). Reports, for text AT REST (same box for >= 0.3 s):
//   - any string outside title-safe (5%: 54 px left/right, 96 px top/bottom at 1080x1920)
//   - key text (Dela Gothic One, or JetBrains Mono at >= 36 px: URLs, amounts) under 48 px cap height
// usage: node --experimental-strip-types tools/text-audit.mts <CompositionId> [--every 6] [--json out.json]
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderFrames, selectComposition } from '@remotion/renderer';

const id = process.argv[2];
const arg = (k: string, d: string) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const every = +arg('every', '6');
const BR = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const SAFE = { x: 54, y: 96 }, W = 1080, H = 1920, CAP = 48;

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const comp = await selectComposition({ serveUrl, id, inputProps: { audit: true, audio: false }, browserExecutable: BR });
type Item = { s: string; x0: number; y0: number; x1: number; y1: number; cap: number; font: string; fs: number };
const frames = new Map<number, Item[]>();
await renderFrames({
  serveUrl, composition: comp, inputProps: { ...comp.props, audit: true, audio: false }, imageFormat: 'none', everyNthFrame: every,
  browserExecutable: BR, chromiumOptions: { gl: 'swangle' }, concurrency: 2, outputDir: null, onStart: () => {}, onFrameUpdate: () => {},
  onBrowserLog: (l) => {
    if (!l.text.startsWith('AUDIT ')) return;
    const j = JSON.parse(l.text.slice(6));
    frames.set(j.f, j.items);
  },
});

const fps = comp.fps;
const keys = [...frames.keys()].sort((a, b) => a - b);
const same = (a: Item, b: Item) => a.s === b.s && Math.abs(a.x0 - b.x0) < 2 && Math.abs(a.y0 - b.y0) < 2 && Math.abs(a.x1 - b.x1) < 2;
const restN = Math.ceil((0.3 * fps) / every);
const problems = new Map<string, string>();
let minKeyCap = Infinity;
keys.forEach((f, i) => {
  for (const it of frames.get(f)!) {
    let run = 1;
    for (let j = i + 1; j < keys.length && run < restN; j++) { if (frames.get(keys[j])!.some((o) => same(o, it))) run++; else break; }
    if (run < restN) continue;
    const t = (f / fps).toFixed(2);
    const tol = 3; // glyph side bearings and line boxes overshoot the ink by a px or two
    const outside = it.x0 < SAFE.x - tol || it.x1 > W - SAFE.x + tol || it.y0 < SAFE.y - tol || it.y1 > H - SAFE.y + tol;
    const key = it.s.length > 1 && (it.font === "Dela" || (it.font === "Mono" && it.fs >= 36));
    if (key) minKeyCap = Math.min(minKeyCap, it.cap);
    if (outside) problems.set('safe:' + it.s, `${t}s OUTSIDE TITLE-SAFE "${it.s}" box ${it.x0.toFixed(0)},${it.y0.toFixed(0)}-${it.x1.toFixed(0)},${it.y1.toFixed(0)}`);
    if (key && it.cap < CAP - 0.5) problems.set('cap:' + it.s, `${t}s KEY TEXT UNDER ${CAP}px CAP "${it.s}" cap ${it.cap}px`);
  }
});
const all = new Set<string>();
frames.forEach((v) => v.forEach((i) => all.add(`${i.font} ${i.fs}px cap ${i.cap}: ${i.s}`)));
console.log(`${id}: ${keys.length} frames sampled (every ${every}), ${all.size} distinct strings, smallest key cap ${minKeyCap.toFixed(1)} px`);
console.log(problems.size ? [...problems.values()].join('\n') : 'no title-safe or key-text problems at rest');
const out = arg('json', '');
if (out) fs.writeFileSync(out, JSON.stringify({ id, every, problems: [...problems.values()], strings: [...all].sort() }, null, 1));
