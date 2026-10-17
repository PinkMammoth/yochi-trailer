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
const b = base.getContext('2d', { alpha: false, willReadFrequently: true }); // CPU raster: far faster than SwiftShader for thousands of bristle paths
const g = glow.getContext('2d', { alpha: false, willReadFrequently: true });

// The virtual stage is 1920x1080 for landscape and 1080x1350 for the 4:5 vertical; S scales it to the
// output size. Scenes lay themselves out from VW/VH (R.vertical recomposes, it never crops).
const vertical = W / H < 1.2;
const VW = vertical ? 1080 : 1920, VH = vertical ? 1350 : 1080;
const R = { W, H, S: W / VW, VW, VH, vertical, b, g, base, glow };
const post = new Post(out, R.S);

window.ready = (async () => {
  const faces = ['500 40px "Chakra Petch"', '600 40px "Chakra Petch"', '700 40px "Chakra Petch"',
    '400 40px "JetBrains Mono"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"'];
  await Promise.all(faces.map((f) => document.fonts.load(f, 'ABCxyz0123+.')));
  await document.fonts.ready;
  await initFilm(R);
  return true;
})();

window.renderFrame = (t) => {
  const P = structuredClone(POST_DEFAULTS);
  for (const c of [b, g]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  }
  b.fillStyle = '#07060c'; b.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  // t >= 100: review sheets outside the film
  const tv = t >= 100 ? t : Math.min(DURATION, t + 0.012); // visuals lead the audio by a third of a frame
  renderFilm(tv, R, P);
  post.run(base, glow, P, tv);
  return true;
};

let pix = null;
window.readFrame = () => { pix = pix || new Uint8Array(W * H * 4); post.read(pix); return pix; };
window.sendFrame = async (url) => {
  const r = await fetch(url, { method: 'POST', body: window.readFrame() });
  return r.ok;
};
