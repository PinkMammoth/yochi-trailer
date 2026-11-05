// The card's page: the flagship's two-layer canvas + WebGL post pipeline, on a 1080 × 1350 stage.
// window.renderFrame(t) draws the card at time t (seconds, taken mod LOOP); the tools drive it.
import { Post, POST_DEFAULTS } from './core/post.js';
import { initGrounds } from './lib/draw.js';
import { initCard, renderCard } from './card.js';

const qs = new URLSearchParams(location.search);
const W = +(qs.get('w') || 1080);
const H = +(qs.get('h') || 1350);
const VW = 1080, VH = 1350;

const out = document.getElementById('out');
out.width = W; out.height = H;
const base = document.createElement('canvas'); base.width = W; base.height = H;
const glow = document.createElement('canvas'); glow.width = W; glow.height = H;
const b = base.getContext('2d', { alpha: false, willReadFrequently: true });
const g = glow.getContext('2d', { alpha: false, willReadFrequently: true });
const post = new Post(out);
const R = { W, H, S: W / VW, VW, VH, TALL: true, b, g, base, glow };

// The flagship's paper grade, quieter: no glow anywhere (nothing on this card is a fresh win), soft vignette,
// grain that survives X's re-encode.
const LOOK = { ...POST_DEFAULTS, bloom: 0, halo: 0, glowDirect: 0, contrast: 1.0, lift: [0, 0, 0], ca: 0.0004, vignette: 0.14, grain: 0.03 };

window.ready = (async () => {
  await Promise.all(['400 40px "Dela Gothic One"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"', '800 40px "JetBrains Mono"']
    .map((f) => document.fonts.load(f, 'YOCHI×ELYSIUM testnet.yochigg.xyz·')));
  await document.fonts.ready;
  initGrounds(R);
  await initCard();
  return true;
})();

window.renderFrame = (t) => {
  const P = structuredClone(LOOK);
  for (const c of [b, g]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  }
  b.fillStyle = '#f2ece0'; b.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  renderCard(t, R, P);
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
