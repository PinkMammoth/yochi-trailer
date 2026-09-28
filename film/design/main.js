// Character design workbench: renders design sheets through the film's own two-layer
// pipeline (base + emissive) and post (bloom, grade, grain). Nothing here is part of the film.
import { Post, POST_DEFAULTS } from '../src/core/post.js';
import { SHEETS } from './sheets/index.js';

const qs = new URLSearchParams(location.search);
const W = +(qs.get('w') || 1920);
const H = +(qs.get('h') || 1080);

const out = document.getElementById('out');
out.width = W; out.height = H;
const base = document.createElement('canvas'); base.width = W; base.height = H;
const glow = document.createElement('canvas'); glow.width = W; glow.height = H;
const b = base.getContext('2d', { alpha: false, willReadFrequently: true });
const g = glow.getContext('2d', { alpha: false, willReadFrequently: true });
const post = new Post(out);
const R = { W, H, S: W / 1920, VW: 1920, VH: 1080, b, g, base, glow };

async function loadFonts() {
  const faces = ['400 40px "Chakra Petch"', '500 40px "Chakra Petch"', '600 40px "Chakra Petch"', '700 40px "Chakra Petch"',
    '400 40px "JetBrains Mono"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"', '400 40px "VT323"'];
  await Promise.all(faces.map((f) => document.fonts.load(f, 'ABCxyz0123$▲▼')));
  await document.fonts.ready;
}
window.ready = loadFonts().then(() => true);

window.sheets = () => Object.keys(SHEETS);
window.renderSheet = async (name, arg) => {
  const P = structuredClone(POST_DEFAULTS);
  for (const c of [b, g]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  }
  b.fillStyle = '#07060c'; b.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  g.setTransform(R.S, 0, 0, R.S, 0, 0);
  const fn = SHEETS[name];
  if (!fn) throw new Error(`no sheet "${name}"`);
  const t0 = performance.now();
  const info = (await fn(R, P, arg)) || {};
  post.run(base, glow, P, info.time ?? 0.5);
  const px = new Uint8Array(4);
  post.gl.readPixels(0, 0, 1, 1, post.gl.RGBA, post.gl.UNSIGNED_BYTE, px); // wait for the GPU
  return { ms: performance.now() - t0, ...info };
};
