// Effects: bokeh, value streams, shockwaves, confetti, speed lines, HUD timer.
import { rgba, hexToRgb, clamp, lerp, E, hash1, noise1, rngFrom } from '../core/math.js';
import { F, money } from './type.js';

const TAU = Math.PI * 2;

// Out-of-focus crowd lights behind close-ups.
export function bokeh(R, t, o = {}) {
  const { b, g } = R;
  const rnd = rngFrom('bokeh', o.seed || 1);
  const n = o.n || 60;
  const cols = o.cols || [[57, 255, 20], [255, 56, 96], [245, 243, 255], [24, 224, 255]];
  for (let i = 0; i < n; i++) {
    const x = rnd() * 2200 - 140 + (o.dx || 0) * (0.5 + rnd() * 0.5) + noise1(i * 1.7 + t * 0.2) * 12;
    const y = (o.y0 ?? 300) + rnd() * (o.h ?? 700) + (o.dy || 0) * (0.5 + rnd());
    const r = (o.r || 38) * (0.5 + rnd() * 0.9);
    const c = cols[(rnd() * cols.length) | 0];
    const a = (o.a ?? 0.22) * (0.4 + rnd() * 0.6);
    // pairs of eyes blur into horizontal pairs
    for (const ox of [-r * 0.55, r * 0.55]) {
      const gr = b.createRadialGradient(x + ox, y, 0, x + ox, y, r);
      gr.addColorStop(0, rgba(c, a)); gr.addColorStop(0.7, rgba(c, a * 0.8)); gr.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = gr; b.beginPath(); b.arc(x + ox, y, r, 0, TAU); b.fill();
      g.fillStyle = rgba(c, a * 0.35); g.beginPath(); g.arc(x + ox, y, r * 0.9, 0, TAU); g.fill();
    }
  }
}

// An arc of light carrying value from A to B. Progress u in [0,1].
export function stream(R, ax, ay, bx, by, u, o = {}) {
  const { b, g } = R;
  if (u <= 0 || u > 1.25) return;
  const col = o.col || [24, 224, 255];
  const lift = o.lift ?? 220;
  const mx = (ax + bx) / 2 + (o.bend || 0), my = Math.min(ay, by) - lift;
  const P = (s) => { const i = 1 - s; return [i * i * ax + 2 * i * s * mx + s * s * bx, i * i * ay + 2 * i * s * my + s * s * by]; };
  const head = clamp(u), tail = clamp(u - (o.len ?? 0.35));
  const N = 22;
  for (const [c, lw, al] of [[g, (o.w || 4) * 3, 0.55], [b, o.w || 4, 1]]) {
    c.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const s0 = lerp(tail, head, i / N), s1 = lerp(tail, head, (i + 1) / N);
      const p0 = P(s0), p1 = P(s1);
      c.strokeStyle = rgba(c === b ? [lerp(col[0], 255, 0.5), lerp(col[1], 255, 0.5), lerp(col[2], 255, 0.5)] : col, al * (i / N) * (o.alpha ?? 1));
      c.lineWidth = lw * (0.3 + 0.7 * i / N);
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    }
  }
  const hp = P(head);
  if (u <= 1) {
    g.fillStyle = rgba(col, 0.9 * (o.alpha ?? 1)); g.beginPath(); g.arc(hp[0], hp[1], (o.w || 4) * 2.2, 0, TAU); g.fill();
    b.fillStyle = rgba([255, 255, 255], 0.9 * (o.alpha ?? 1)); b.beginPath(); b.arc(hp[0], hp[1], (o.w || 4) * 0.9, 0, TAU); b.fill();
  }
  if (o.label && u < 1) {
    money(R, o.label, hp[0], hp[1] - 18, { size: o.labelSize || 20, col, alpha: (o.alpha ?? 1) * clamp(u * 4) * clamp((1 - u) * 6), weight: 700 });
  }
  return hp;
}

// Expanding ring on the floor plane.
export function shockwave(R, cam, x, z, dt, o = {}) {
  if (dt < 0 || dt > (o.dur || 0.9)) return;
  const { b, g } = R;
  const u = dt / (o.dur || 0.9);
  const rad = lerp(0.2, o.r || 18, E.outCubic(u));
  const col = o.col || [57, 255, 20];
  const a = (1 - u) * (o.k ?? 1);
  const N = 72;
  for (const [c, lw, al] of [[g, 16, 0.6], [b, 3, 0.9]]) {
    c.strokeStyle = rgba(c === b ? [lerp(col[0], 255, 0.5), lerp(col[1], 255, 0.5), lerp(col[2], 255, 0.5)] : col, al * a);
    c.lineWidth = lw * (1 - u * 0.5);
    c.beginPath();
    let first = true;
    for (let i = 0; i <= N; i++) {
      const ang = (i / N) * TAU;
      const p = cam.p(x + Math.cos(ang) * rad, o.y || 0.02, z + Math.sin(ang) * rad);
      if (!p) { first = true; continue; }
      if (first) { c.moveTo(p[0], p[1]); first = false; } else c.lineTo(p[0], p[1]);
    }
    c.stroke();
  }
}

// Confetti burst: shards in brand colours, deterministic.
export function confetti(R, x, y, dt, o = {}) {
  if (dt < 0 || dt > (o.dur || 2.4)) return;
  const { b, g } = R;
  const rnd = rngFrom('confetti', o.seed || 1);
  const n = o.n || 90;
  const cols = o.cols || [[57, 255, 20], [24, 224, 255], [245, 243, 255]];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (rnd() - 0.5) * (o.spread ?? 2.2);
    const sp = (o.speed || 1300) * (0.35 + rnd() * 0.75);
    const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
    const drag = 2.2;
    const tt = dt;
    const k = (1 - Math.exp(-drag * tt)) / drag;
    const px = x + vx * k + noise1(i * 3.3 + tt * 2) * 30 * tt;
    const py = y + vy * k + 380 * tt * tt * 0.5 + 120 * tt;
    const c = cols[(rnd() * cols.length) | 0];
    const s = (o.size || 10) * (0.5 + rnd());
    const rot = rnd() * TAU + tt * (rnd() - 0.5) * 18;
    const flip = Math.abs(Math.cos(tt * (4 + rnd() * 8) + rnd() * 6));
    const a = clamp((o.dur || 2.4) - dt) * (o.alpha ?? 1);
    b.save(); b.translate(px, py); b.rotate(rot); b.scale(1, 0.25 + flip * 0.75);
    b.fillStyle = rgba([lerp(c[0], 255, 0.3), lerp(c[1], 255, 0.3), lerp(c[2], 255, 0.3)], a);
    b.fillRect(-s / 2, -s * 0.18, s, s * 0.36);
    b.restore();
    g.save(); g.translate(px, py); g.rotate(rot);
    g.fillStyle = rgba(c, 0.6 * a); g.fillRect(-s * 0.6, -s * 0.25, s * 1.2, s * 0.5);
    g.restore();
  }
}

// Anime speed lines (radial from a centre, or vertical when dir given).
export function speedLines(R, t, o = {}) {
  const { b, g } = R;
  const n = o.n || 60;
  const col = o.col || [245, 243, 255];
  const a = o.alpha ?? 0.5;
  if (a <= 0) return;
  const rnd = rngFrom('speed', Math.floor(t * (o.fps || 24)) + (o.seed || 0));
  for (let i = 0; i < n; i++) {
    if (o.vertical) {
      const x = rnd() * 1920; const len = 200 + rnd() * 700; const y = rnd() * 1400 - 200;
      const w = 1 + rnd() * 3;
      b.fillStyle = rgba(col, a * (0.3 + rnd() * 0.7)); b.fillRect(x, y, w, len);
      if (o.glow) { g.fillStyle = rgba(col, a * 0.3); g.fillRect(x - w, y, w * 3, len); }
    } else {
      const ang = rnd() * TAU; const r0 = (o.r0 || 380) + rnd() * 200; const r1 = r0 + 300 + rnd() * 900;
      const w = (1 + rnd() * 4) * (o.width || 1);
      const cx = o.cx ?? 960, cy = o.cy ?? 540;
      b.fillStyle = rgba(col, a * (0.3 + rnd() * 0.7));
      b.beginPath();
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      b.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
      b.lineTo(cx + Math.cos(ang) * r1 + nx * w, cy + Math.sin(ang) * r1 + ny * w);
      b.lineTo(cx + Math.cos(ang) * r1 - nx * w, cy + Math.sin(ang) * r1 - ny * w);
      b.closePath(); b.fill();
    }
  }
}

// Countdown HUD, product-true: mono digits + small label.
export function timerHUD(R, secs, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  const x = o.x ?? 92, y = o.y ?? 76;
  const s = Math.max(0, Math.ceil(secs - 1e-6));
  const txt = `00:${String(s).padStart(2, '0')}`;
  const urgent = s <= (o.urgentAt ?? 5);
  const col = o.col || (urgent ? [255, 56, 96] : [245, 243, 255]);
  b.save(); b.globalAlpha = a;
  b.font = F.hero(14, 600, false); b.letterSpacing = '5px'; b.textAlign = 'left'; b.textBaseline = 'middle';
  b.fillStyle = 'rgba(168,162,200,0.9)';
  b.fillText(o.label || 'CANDLE CLOSES IN', x, y - 30);
  b.fillStyle = urgent ? 'rgba(255,56,96,0.9)' : 'rgba(24,224,255,0.9)';
  b.fillRect(x - 22, y - 38, 4, 64);
  b.restore();
  const pop = o.pop ?? 0;
  money(R, txt, x, y + 18, { size: (o.size || 46) * (1 + pop * 0.12), col, alpha: a, align: 'left', glow: urgent ? 0.9 : 0.35, hot: urgent ? 0.2 : 0.6 });
}

// Horizontal sweep bar (progress / ratio) used as a graphic element.
export function ratioBar(R, x, y, w, h, frac, o = {}) {
  const { b, g } = R;
  const a = o.alpha ?? 1;
  const G = o.gcol || [57, 255, 20], Rr = o.rcol || [255, 56, 96];
  b.save(); b.globalAlpha = a;
  b.fillStyle = rgba(G); b.fillRect(x, y, w * frac, h);
  b.fillStyle = rgba(Rr); b.fillRect(x + w * frac, y, w * (1 - frac), h);
  b.fillStyle = '#f5f3ff'; b.fillRect(x + w * frac - 2, y - 4, 4, h + 8);
  b.restore();
  g.save(); g.globalAlpha = a * 0.6;
  g.fillStyle = rgba(G); g.fillRect(x, y, w * frac, h);
  g.fillStyle = rgba(Rr); g.fillRect(x + w * frac, y, w * (1 - frac), h);
  g.restore();
}
