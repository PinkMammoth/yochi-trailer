// Typography as physical objects: lit, extruded, glowing.
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';

export const F = {
  hero: (px, w = 700, italic = true) => `${italic ? 'italic ' : ''}${w} ${px}px "Chakra Petch"`,
  mono: (px, w = 700) => `${w} ${px}px "JetBrains Mono"`,
  vt: (px) => `400 ${px}px "VT323"`,
};

// Big word with extrusion, gradient light and emissive edge.
// o: { x, y, size, align, fill:[top,bottom], extrude:{dx,dy,n,col}, glow, glowCol, tracking, scaleX, alpha, stroke }
export function bigWord(R, text, o) {
  const { b, g } = R;
  const size = o.size;
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  b.save(); g.save();
  for (const c of [b, g]) {
    c.translate(o.x, o.y);
    if (o.rot) c.rotate(o.rot);
    c.scale((o.scaleX ?? 1) * (o.scale ?? 1), (o.scaleY ?? 1) * (o.scale ?? 1));
    c.font = o.font || F.hero(size);
    c.textAlign = o.align || 'center';
    c.textBaseline = 'alphabetic';
    if (o.tracking) c.letterSpacing = `${o.tracking}px`;
  }
  const top = o.fill ? o.fill[0] : [245, 243, 255];
  const bot = o.fill ? o.fill[1] : [168, 162, 200];
  // extrusion
  if (o.extrude) {
    const e = o.extrude;
    for (let i = e.n; i >= 1; i--) {
      const k = i / e.n;
      b.fillStyle = rgba([lerp(e.col[0], e.col2 ? e.col2[0] : e.col[0], k), lerp(e.col[1], e.col2 ? e.col2[1] : e.col[1], k), lerp(e.col[2], e.col2 ? e.col2[2] : e.col[2], k)], a);
      b.fillText(text, e.dx * i, e.dy * i);
    }
  }
  const gr = b.createLinearGradient(0, -size * 0.75, 0, size * 0.05);
  gr.addColorStop(0, rgba(top, a)); gr.addColorStop(1, rgba(bot, a));
  b.fillStyle = gr;
  b.fillText(text, 0, 0);
  if (o.stroke) { b.lineWidth = o.stroke.w; b.strokeStyle = rgba(o.stroke.col, a); b.strokeText(text, 0, 0); }
  if (o.glow) {
    const gc = o.glowCol || top;
    g.fillStyle = rgba(gc, o.glow * a);
    g.fillText(text, 0, 0);
  }
  b.restore(); g.restore();
}

export function measure(R, text, font, tracking = 0) {
  const { b } = R;
  b.save(); b.font = font; if (tracking) b.letterSpacing = `${tracking}px`;
  const w = b.measureText(text).width; b.restore();
  return w;
}

// Small spaced label (like the product's section labels)
export function label(R, text, x, y, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  b.save();
  b.font = o.font || F.hero(o.size || 18, o.weight || 600, false);
  b.letterSpacing = `${o.tracking ?? 4}px`;
  b.textAlign = o.align || 'left'; b.textBaseline = o.base || 'middle';
  b.fillStyle = rgba(o.col || [168, 162, 200], a);
  b.fillText(text, x, y);
  b.restore();
  if (o.glow) {
    g.save(); g.font = o.font || F.hero(o.size || 18, o.weight || 600, false); g.letterSpacing = `${o.tracking ?? 4}px`;
    g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'middle';
    g.fillStyle = rgba(o.glowCol || o.col || [168, 162, 200], o.glow * a); g.fillText(text, x, y); g.restore();
  }
}

// Money / numbers in JetBrains Mono, optionally counting.
export function money(R, text, x, y, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  const col = o.col || [57, 255, 20];
  for (const [c, al] of [[b, 1], [g, o.glow ?? 0.7]]) {
    c.save();
    c.font = F.mono(o.size || 64, o.weight || 800);
    c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'alphabetic';
    if (o.tracking) c.letterSpacing = `${o.tracking}px`;
    c.translate(x, y); if (o.scale) c.scale(o.scale, o.scale);
    if (c === b) {
      const hot = [lerp(col[0], 255, o.hot ?? 0.35), lerp(col[1], 255, o.hot ?? 0.35), lerp(col[2], 255, o.hot ?? 0.35)];
      c.fillStyle = rgba(hot, a);
    } else c.fillStyle = rgba(col, al * a);
    c.fillText(text, 0, 0);
    c.restore();
  }
}

export function fmtUSDC(v, dec = 2) {
  const s = Math.abs(v).toFixed(dec);
  const [i, d] = s.split('.');
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (v < 0 ? '-' : '') + ii + (d ? '.' + d : '');
}

// Rounded chat bubble with a name and message.
export function chatBubble(R, x, y, name, msg, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  const sc = o.scale ?? 1;
  b.save(); b.translate(x, y); b.scale(sc, sc);
  b.font = F.hero(20, 500, false);
  const mw = b.measureText(msg).width;
  b.font = F.hero(13, 700, false);
  b.letterSpacing = '2px';
  const nw = b.measureText(name).width;
  const w = Math.max(mw, nw) + 36, h = 64;
  const nameCol = o.nameCol || [24, 224, 255];
  b.globalAlpha = a;
  b.fillStyle = 'rgba(17,15,26,0.92)';
  b.beginPath(); b.roundRect(-w / 2, -h, w, h, 10); b.fill();
  b.beginPath(); b.moveTo(-8, 0); b.lineTo(0, 12); b.lineTo(8, 0); b.fill();
  b.strokeStyle = rgba(nameCol, 0.35); b.lineWidth = 1.5;
  b.beginPath(); b.roundRect(-w / 2, -h, w, h, 10); b.stroke();
  b.fillStyle = rgba(nameCol); b.textAlign = 'left'; b.textBaseline = 'middle';
  b.fillText(name, -w / 2 + 18, -h + 20);
  b.letterSpacing = '0px';
  b.font = F.hero(20, 500, false); b.fillStyle = '#f5f3ff';
  b.fillText(msg, -w / 2 + 18, -h + 44);
  b.restore();
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha = a * 0.25;
  g.strokeStyle = rgba(nameCol); g.lineWidth = 2; g.beginPath(); g.roundRect(-w / 2, -h, w, h, 10); g.stroke();
  g.restore();
}

// Name tag pill above a player
export function nameTag(R, x, y, name, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  const sc = o.scale ?? 1;
  const col = o.col || [24, 224, 255];
  b.save(); b.translate(x, y); b.scale(sc, sc); b.globalAlpha = a;
  b.font = F.hero(o.size || 22, 700, true);
  b.letterSpacing = '1px';
  const w = b.measureText(name).width + 28, h = (o.size || 22) + 16;
  b.fillStyle = o.fillBg || 'rgba(7,6,12,0.85)';
  b.beginPath(); b.roundRect(-w / 2, -h / 2, w, h, 4); b.fill();
  b.strokeStyle = rgba(col, 0.9); b.lineWidth = 2;
  b.beginPath(); b.roundRect(-w / 2, -h / 2, w, h, 4); b.stroke();
  b.fillStyle = rgba(o.textCol || col); b.textAlign = 'center'; b.textBaseline = 'middle';
  b.fillText(name, 0, 1);
  b.restore();
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha = a * 0.6;
  g.strokeStyle = rgba(col); g.lineWidth = 3; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 4); g.stroke();
  g.font = F.hero(o.size || 22, 700, true); g.letterSpacing = '1px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = rgba(col, 0.5); g.fillText(name, 0, 1);
  g.restore();
}
