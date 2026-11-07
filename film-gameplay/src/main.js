// The page: two-layer canvas + the flagship's WebGL post pipeline on a 1920 × 1080 stage.
// ?v=A|B picks the edit. window.renderFrame(t) draws the film at t (seconds); the tools drive it.
import { Post, POST_DEFAULTS } from './core/post.js';
import { initGrounds } from './lib/draw.js';
import { initCard } from './endcard.js';
import { EDITS } from './edl.js';
import { initFilm, renderFilm } from './film.js';

const qs = new URLSearchParams(location.search);
const W = +(qs.get('w') || 1920), H = +(qs.get('h') || 1080);
const VW = 1920, VH = 1080;
const edit = EDITS[qs.get('v') || 'A'];

const out = document.getElementById('out');
out.width = W; out.height = H;
const base = document.createElement('canvas'); base.width = W; base.height = H;
const glow = document.createElement('canvas'); glow.width = W; glow.height = H;
const b = base.getContext('2d', { alpha: false, willReadFrequently: true });
const g = glow.getContext('2d', { alpha: false, willReadFrequently: true });
const post = new Post(out);
const R = { W, H, S: W / VW, VW, VH, TALL: false, b, g, base, glow };

// Gameplay: the UI as captured. No glow, no aberration, no lift; a light vignette and fine grain only.
const PLAY = { ...POST_DEFAULTS, bloom: 0, halo: 0, glowDirect: 0, contrast: 1.0, lift: [0, 0, 0], ca: 0, vignette: 0.1, grain: 0.016 };
// The end card's own look, as approved (card-elysium-landscape/src/main.js).
const CARD = { ...POST_DEFAULTS, bloom: 0, halo: 0, glowDirect: 0, contrast: 1.0, lift: [0, 0, 0], ca: 0.0004, vignette: 0.14, grain: 0.03 };

window.ready = (async () => {
  await Promise.all(['400 40px "Dela Gothic One"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"', '800 40px "JetBrains Mono"']
    .map((f) => document.fonts.load(f, 'YOCHI×ELYSIUM testnet.yochigg.xyz·ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz,.+18')));
  await document.fonts.ready;
  initGrounds(R);
  await initCard();
  await initFilm(edit);
  return true;
})();

window.renderFrame = async (t) => {
  const P = structuredClone(PLAY);
  for (const c of [b, g]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  }
  b.fillStyle = '#0f0d0b'; b.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  await renderFilm(t, R, P, edit, CARD);
  post.run(base, glow, P, t);
  return true;
};

let pix = null;
window.sendFrame = async (url) => {
  pix = pix || new Uint8Array(W * H * 4);
  post.read(pix);
  const r = await fetch(url, { method: 'POST', body: pix });
  return r.ok;
};
