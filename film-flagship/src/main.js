import { Post, POST_DEFAULTS } from './core/post.js';
import { initFilm, renderFilm } from './film.js';
import { DURATION } from './core/music.js';

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

// Virtual stage: 1920x1080 for the 16:9 film, 1080x1350 for the 4:5 vertical. S scales it to the output.
const TALL = H > W;
const VW = TALL ? 1080 : 1920, VH = TALL ? 1350 : 1080;
const R = { W, H, S: W / VW, VW, VH, TALL, b, g, base, glow };

// THE CAST's grade: paper stays paper, glow only where a scene draws into the glow layer (a fresh win).
const LOOK = { ...POST_DEFAULTS, bloom: 0.75, halo: 0.25, contrast: 1.0, lift: [0, 0, 0], ca: 0.0005, vignette: 0.16, grain: 0.034 };

async function loadFonts() {
  const faces = ['400 40px "Dela Gothic One"', '400 40px "JetBrains Mono"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"',
    '800 40px "JetBrains Mono"', '500 40px "Zen Kaku Gothic New"', '700 40px "Zen Kaku Gothic New"', '900 40px "Zen Kaku Gothic New"'];
  await Promise.all(faces.map((f) => document.fonts.load(f, 'ABCxyz0123$·')));
  await document.fonts.load('400 40px "Yuji Syuku"', '決対勝敗命連予知残氷');
  await document.fonts.ready;
}

window.ready = (async () => {
  await loadFonts();
  await initFilm(R);
  return true;
})();

window.renderFrame = (t) => {
  const P = structuredClone(LOOK);
  for (const c of [b, g]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    c.shadowBlur = 0; c.shadowColor = 'transparent';
  }
  b.fillStyle = '#0f0d0b'; b.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  g.setTransform(R.S, 0, 0, R.S, 0, 0);
  // visuals lead the audio by a third of a frame so hits never land late
  const tv = t >= 90 ? t : Math.min(DURATION, t + 0.012); // t >= 90: review sheets
  renderFilm(tv, R, P);
  post.run(base, glow, P, tv);
  return true;
};

let pix = null;
window.readFrame = () => {
  pix = pix || new Uint8Array(W * H * 4);
  post.read(pix);
  return pix;
};
window.sendFrame = async (url) => {
  const px = window.readFrame();
  const r = await fetch(url, { method: 'POST', body: px });
  return r.ok;
};
