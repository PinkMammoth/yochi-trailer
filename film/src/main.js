import { Post, POST_DEFAULTS } from './core/post.js';
import { initFilm, renderFilm } from './film.js';

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

// Virtual stage is always 1920x1080; S scales it to the output size.
const R = { W, H, S: W / 1920, VW: 1920, VH: 1080, b, g, base, glow };

async function loadFonts() {
  const faces = [
    '400 40px "Chakra Petch"', 'italic 400 40px "Chakra Petch"',
    '500 40px "Chakra Petch"', 'italic 500 40px "Chakra Petch"',
    '600 40px "Chakra Petch"', 'italic 600 40px "Chakra Petch"',
    '700 40px "Chakra Petch"', 'italic 700 40px "Chakra Petch"',
    '400 40px "JetBrains Mono"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"', '800 40px "JetBrains Mono"',
    '400 40px "VT323"',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, 'ABCxyz0123$▲▼')));
  await document.fonts.ready;
}

window.ready = (async () => {
  await loadFonts();
  await initFilm(R);
  return true;
})();

window.renderFrame = (t) => {
  const P = structuredClone(POST_DEFAULTS);
  for (const c of [b, g]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    c.shadowBlur = 0; c.shadowColor = 'transparent';
  }
  b.fillStyle = '#07060c'; b.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  b.setTransform(R.S, 0, 0, R.S, 0, 0);
  g.setTransform(R.S, 0, 0, R.S, 0, 0);
  renderFilm(t, R, P);
  post.run(base, glow, P, t);
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
