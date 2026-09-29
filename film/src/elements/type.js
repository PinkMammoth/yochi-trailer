// Typography: a small, consistent display system (headline, kicker, numbers, tags).
import { rgba, hexToRgb, clamp, lerp } from '../core/math.js';

export const F = {
  hero: (px, w = 700, italic = true) => `${italic ? 'italic ' : ''}${w} ${px}px "Chakra Petch"`,
  mono: (px, w = 700) => `${w} ${px}px "JetBrains Mono"`,
  vt: (px) => `400 ${px}px "VT323"`,
};

// ---- Display type system -----------------------------------------------------------
// Headline: upright Chakra Petch 700, tight tracking, faux-bold miter stroke, solid fill with a
// subtle light falloff, dark halo for separation, restrained emissive glow.
// Motion: rises out of its baseline (the strike-line motif) and sinks back through it.
// o: { x, y (baseline), size, align, col, glowCol, glow, alpha, rise (0..1), scale, scaleX, scaleY, rot,
//      track (em), halo (0..1), weight (stroke em), rule: { col, k (0..1 draw-on), w, gap }, kicker: { text, col, size },
//      hi: { from (the substring that starts the highlighted tail), col, glow, glowCol } }
export function headline(R, text, o) {
  const { b, g } = R;
  const size = o.size;
  const a = o.alpha ?? 1;
  if (a <= 0.001) return null;
  let rise = clamp(o.rise ?? 1);
  if (o.inT !== undefined) rise = Math.min(rise, clamp(o.inT / (o.inDur ?? 0.2)));
  if (o.outT !== undefined) rise = Math.min(rise, clamp(o.outT / (o.outDur ?? 0.14)));
  if (o.inT !== undefined && o.inT < 0) return null;
  const col = o.col || [245, 243, 255];
  const align = o.align || 'center';
  const font = o.font || `700 ${size}px "Chakra Petch"`;
  const track = (o.track ?? -0.012) * size;
  const wStroke = (o.weight ?? 0.03) * size;
  b.save(); b.font = font; b.letterSpacing = `${track}px`;
  const tw = b.measureText(text).width - track;
  b.restore();
  const x0 = align === 'center' ? -tw / 2 : align === 'right' ? -tw : 0;
  const sc = o.scale ?? 1;
  const off = (1 - E_outCubic(rise)) * size * 0.95;
  const clipMask = rise < 1;
  const setup = (c) => {
    c.translate(o.x, o.y);
    if (o.rot) c.rotate(o.rot);
    c.scale((o.scaleX ?? 1) * sc, (o.scaleY ?? 1) * sc);
    c.font = font; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = `${track}px`;
    c.lineJoin = 'miter'; c.miterLimit = 3;
  };
  // rule under the baseline (drawn before the mask so it stays put)
  if (o.rule) {
    let rk = clamp(o.rule.k ?? 1);
    if (o.inT !== undefined) rk = Math.min(rk, clamp((o.inT + 0.05) / 0.16));
    if (o.outT !== undefined) rk = Math.min(rk, clamp(o.outT / 0.1));
    const rc = o.rule.col || RGB_CYAN;
    const rw = (tw + size * 0.2) * E_outCubic(rk), rh = Math.max(2, (o.rule.w ?? 0.022) * size);
    const ry = (o.rule.gap ?? 0.16) * size;
    const rx = align === 'center' ? -rw / 2 : align === 'right' ? -rw + size * 0.1 : -size * 0.1;
    for (const [c, al] of [[b, 0.95], [g, 0.8]]) {
      c.save(); setup(c); c.fillStyle = rgba(rc, al * a); c.fillRect(rx, ry, rw, c === b ? rh : rh * 2.2); c.restore();
    }
  }
  if (o.kicker) {
    const ks = o.kicker.size || Math.max(16, size * 0.15);
    const kc = o.kicker.col || col;
    b.save(); setup(b);
    b.font = `700 ${ks}px "JetBrains Mono"`; b.letterSpacing = `${ks * 0.3}px`;
    const kw = b.measureText(o.kicker.text).width;
    const kx = align === 'center' ? -kw / 2 + ks * 0.15 : align === 'right' ? -kw : 0;
    const ky = -size * 0.74 - ks * 0.9;
    b.globalAlpha = a * clamp(rise * 1.6);
    b.fillStyle = rgba(kc); b.fillText(o.kicker.text, kx, ky);
    b.restore();
  }
  for (const c of [b, g]) {
    c.save(); setup(c);
    if (clipMask) { c.beginPath(); c.rect(x0 - size, -size * 2, tw + size * 2, size * 2 + size * 0.12); c.clip(); }
    c.translate(0, off);
  }
  // halo: soft darkness hugging the letters
  const halo = o.halo ?? 0.85;
  if (halo > 0) {
    b.save();
    b.shadowColor = `rgba(3,2,7,${0.9 * halo * a})`; b.shadowBlur = size * 0.32 * (R.S || 1);
    b.fillStyle = `rgba(3,2,7,${0.55 * halo * a})`;
    b.fillText(text, x0, 0);
    b.restore();
  }
  // titles are opaque: knock the emissive layer out behind the letters so scene glow can't wash them out
  g.save();
  g.fillStyle = g.strokeStyle = `rgba(0,0,0,${a})`; g.lineJoin = 'round'; g.lineWidth = wStroke + (o.knock ?? 0.1) * size;
  g.strokeText(text, x0, 0); g.fillText(text, x0, 0);
  g.restore();
  // spans: the whole line in its colour, or a head plus a highlighted tail set at the same advance
  const spans = [[text, x0, col, o.glow, o.glowCol || col]];
  const hk = o.hi ? text.indexOf(o.hi.from) : -1;
  if (hk > 0) {
    spans[0][0] = text.slice(0, hk);
    spans.push([text.slice(hk), x0 + b.measureText(spans[0][0]).width, o.hi.col, o.hi.glow ?? o.glow, o.hi.glowCol || o.hi.col]);
  }
  for (const [str, sx, c, gl, gc] of spans) {
    const fall = b.createLinearGradient(0, -size * 0.74, 0, size * 0.02);
    fall.addColorStop(0, rgba(c, a)); fall.addColorStop(1, rgba([c[0] * 0.84, c[1] * 0.84, c[2] * 0.84], a));
    b.strokeStyle = fall; b.lineWidth = wStroke; b.strokeText(str, sx, 0);
    b.fillStyle = fall; b.fillText(str, sx, 0);
    if (gl) {
      g.fillStyle = rgba(gc, gl * 0.6 * a); g.strokeStyle = rgba(gc, gl * 0.6 * a); g.lineWidth = wStroke;
      g.strokeText(str, sx, 0); g.fillText(str, sx, 0);
    }
  }
  b.restore(); g.restore();
  return { w: tw * sc, x0: o.x + x0 * sc };
}
const RGB_CYAN = [24, 224, 255];
function E_outCubic(t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); }

// Kicker label: tracked mono caps, optional leading glyph.
export function kicker(R, text, x, y, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  const size = o.size || 18;
  if (o.halo) {
    const passes = o.halo === true ? 1 : Math.ceil(o.halo); // numeric halo = stronger backing over busy frames
    b.save();
    b.font = `${o.weight || 700} ${size}px "JetBrains Mono"`; b.letterSpacing = `${size * (o.track ?? 0.3)}px`;
    b.textAlign = o.align || 'left'; b.textBaseline = o.base || 'middle';
    b.shadowColor = `rgba(3,2,7,${0.95 * a})`; b.shadowBlur = size * 1.1 * (R.S || 1);
    b.fillStyle = `rgba(3,2,7,${0.8 * a})`;
    for (let i = 0; i < passes; i++) b.fillText(text, x + (o.align === 'center' ? size * (o.track ?? 0.3) / 2 : 0), y);
    b.restore();
  }
  for (const [c, al] of [[b, 1], [g, o.glow ?? 0.35]]) {
    if (al <= 0) continue;
    c.save();
    c.font = `${o.weight || 700} ${size}px "JetBrains Mono"`; c.letterSpacing = `${size * (o.track ?? 0.3)}px`;
    c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle';
    c.fillStyle = rgba(o.col || [168, 162, 200], a * al);
    c.fillText(text, x + (o.align === 'center' ? size * (o.track ?? 0.3) / 2 : 0), y);
    c.restore();
  }
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

// Name tag above a player: upright caps in a chamfered frame (product-true player tag).
export function nameTag(R, x, y, name, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  const sc = o.scale ?? 1;
  const col = o.col || [24, 224, 255];
  const fs = o.size || 22;
  const font = `700 ${fs}px "Chakra Petch"`;
  b.save(); b.font = font; b.letterSpacing = `${fs * 0.06}px`;
  const w = b.measureText(name).width + fs * 1.1, h = fs + 14, ch = h * 0.32;
  b.restore();
  const frame = (c) => { c.beginPath(); c.moveTo(-w / 2 + ch, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2 - ch); c.lineTo(w / 2 - ch, h / 2); c.lineTo(-w / 2, h / 2); c.lineTo(-w / 2, -h / 2 + ch); c.closePath(); };
  b.save(); b.translate(x, y); b.scale(sc, sc); b.globalAlpha = a;
  b.fillStyle = o.fillBg || 'rgba(7,6,12,0.88)'; frame(b); b.fill();
  b.strokeStyle = rgba(col, 0.85); b.lineWidth = 1.6; frame(b); b.stroke();
  b.font = font; b.letterSpacing = `${fs * 0.06}px`;
  b.fillStyle = rgba(o.textCol || [245, 243, 255]); b.textAlign = 'center'; b.textBaseline = 'middle';
  b.fillText(name, fs * 0.03, 1);
  b.fillStyle = rgba(col); b.fillRect(-w / 2 + ch, -h / 2 - 1, Math.min(w * 0.3, 40), 3);
  b.restore();
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha = a * 0.5;
  g.strokeStyle = rgba(col); g.lineWidth = 2.5; frame(g); g.stroke();
  g.restore();
}

// A title standing in the 3D world (a billboard): baseline at (wx, wy, wz), cap size in world units.
// Returns the projected depth so callers can split occluders around it.
export function worldTitle(R, cam, text, wx, wy, wz, worldSize, o = {}) {
  const p = cam.p(wx, wy, wz);
  if (!p) return null;
  const size = worldSize * p[3];
  const r = headline(R, text, { ...o, x: p[0], y: p[1], size });
  return { x: p[0], y: p[1], size, depth: p[2], w: r ? r.w : 0 };
}
