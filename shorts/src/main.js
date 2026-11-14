// The shorts' page: a two-layer canvas (base + glow) and the flagship's WebGL post pipeline.
// ?film=<name> picks src/films/<name>/film.js, which exports { META, init(R), render(t, R, P) }.
// META.VW x META.VH is the virtual stage; ?w&h is the output size. window.renderFrame(t) draws one frame.
import { Post, POST_DEFAULTS } from './core/post.js';
import { initGrounds } from './lib/draw.js';

const qs = new URLSearchParams(location.search);
const film = await import(`./films/${qs.get('film') || 'usdc'}/film.js`);
const VW = film.META.VW || 1920, VH = film.META.VH || 1080;
const W = +(qs.get('w') || VW);
const H = +(qs.get('h') || VH);

const out = document.getElementById('out');
out.width = W; out.height = H;
const base = document.createElement('canvas'); base.width = W; base.height = H;
const glow = document.createElement('canvas'); glow.width = W; glow.height = H;
const b = base.getContext('2d', { alpha: false, willReadFrequently: true });
const g = glow.getContext('2d', { alpha: false, willReadFrequently: true });
const post = new Post(out);
const R = { W, H, S: W / VW, VW, VH, TALL: VH > VW * 0.75, b, g, base, glow, qs };

window.META = film.META;
window.ready = (async () => {
  await Promise.all(['400 40px "Dela Gothic One"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"', '800 40px "JetBrains Mono"', '400 40px "Yuji Syuku"']
    .map((f) => document.fonts.load(f, 'YOCHI×ELYSIUM testnet.yochigg.xyz·0123456789 対敗勝')));
  await document.fonts.ready;
  initGrounds(R);
  await film.init(R);
  return true;
})();

window.renderFrame = (t) => {
  const P = { ...POST_DEFAULTS, ...(film.LOOK || {}) };
  for (const c of [b, g]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  }
  b.fillStyle = '#0f0d0b'; b.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  g.setTransform(R.S, 0, 0, R.S, 0, 0);
  film.render(t, R, P);
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
