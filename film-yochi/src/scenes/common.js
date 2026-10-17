// Shared scene helpers: camera, fades, type.
import { clamp, smooth, E } from '../core/math.js';
import { css, inkColor, VOID, CYAN, WHITE, GREEN } from '../ink/brush.js';

// Centre sheet point (x, y) on screen at zoom z (with an optional small shake offset in stage px).
export function cam(R, x, y, z = 1, sx = 0, sy = 0, rot = 0) {
  const { S, VW, VH } = R;
  const c0 = Math.cos(rot) * z, s0 = Math.sin(rot) * z;
  // screen = centre + Rot(rot) * z * (p - (x, y))
  for (const c of [R.b, R.g]) c.setTransform(S * c0, S * s0, -S * s0, S * c0, S * (VW / 2 + sx - (c0 * x - s0 * y)), S * (VH / 2 + sy - (s0 * x + c0 * y)));
}
export function screen(R) { cam(R, R.VW / 2, R.VH / 2, 1); }

// Mono label. o: { size, weight, col, a, align, track, glow, font }
export function label(R, text, x, y, o = {}) {
  const { b, g } = R;
  const size = o.size ?? 30;
  const a = clamp(o.a ?? 1);
  if (a <= 0) return;
  const font = `${o.weight ?? 500} ${size}px ${o.font ?? '"JetBrains Mono"'}`;
  for (const c of [b, g]) {
    if (c === g && !o.glow) continue;
    c.font = font; c.textAlign = o.align ?? 'left'; c.textBaseline = o.base ?? 'alphabetic';
    if ('letterSpacing' in c) c.letterSpacing = `${(o.track ?? 0) * size}px`;
    c.fillStyle = c === b ? css(inkColor(o.col ?? WHITE, a)) : css((o.col ?? CYAN).map((v) => v * o.glow * a));
    c.fillText(text, x, y);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
}
export function measure(R, text, size, weight = 500, font = '"JetBrains Mono"', track = 0) {
  const { b } = R;
  b.font = `${weight} ${size}px ${font}`;
  if ('letterSpacing' in b) b.letterSpacing = `${track * size}px`;
  const w = b.measureText(text).width;
  if ('letterSpacing' in b) b.letterSpacing = '0px';
  return w;
}
// Text revealed left to right by a soft wipe (ink soaking in), u = 0..1
export function wipeLabel(R, text, x, y, u, o = {}) {
  if (u <= 0) return;
  const { b, g } = R;
  const size = o.size ?? 30;
  const w = measure(R, text, size, o.weight ?? 500, o.font, o.track ?? 0);
  const x0 = (o.align === 'center') ? x - w / 2 : (o.align === 'right' ? x - w : x);
  for (const c of [b, g]) { c.save(); c.beginPath(); c.rect(x0 - 10, y - size * 1.2, (w + 20) * E.outCubic(u), size * 1.6); c.clip(); }
  label(R, text, x, y, o);
  for (const c of [b, g]) c.restore();
}
// Cover the frame with void at alpha a (a sheet fading; paper texture is added afterwards, so this is exact)
export function veil(R, a) {
  if (a <= 0) return;
  const { b, g, W, H } = R;
  for (const c of [b, g]) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = clamp(a); c.fillStyle = c === b ? css(VOID) : '#000'; c.fillRect(0, 0, W, H);
    c.restore();
  }
}
export { clamp, smooth, E };
