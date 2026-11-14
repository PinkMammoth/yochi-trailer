// USDC HAS BEEN ELIMINATED: a 10 s arcade fighting-game short for YOCHI × ELYSIUM.
// The world is pixel art on a 384 x 216 grid, scaled 5x. The film's own words (ROUND 1, FIGHT!, K.O., the band,
// the end card) are Sumi type at full resolution on top. Every frame is a pure function of t; timings in timing.json.
import { mk, px, sprite } from '../../lib/pixel.js';
import { pixText, pixWidth } from '../../lib/pixfont.js';
import { SUMI, PAPER, F } from '../../lib/brand.js';
import { paper, text, label, measure, stampK, impactK, slamK, splatter, seal, loadImage, bezier } from '../../lib/draw.js';
import { clamp, lerp, invLerp, smooth, smoother, E, mulberry32, hash1, shake, pulse, env, keys } from '../../core/math.js';
import { C, hypeSprite, usdcSprite, hypeBust, usdcBust, HYPE_POSES as HP, USDC_POSES as UP } from './cast.js';

export const META = { VW: 1920, VH: 1080, dur: 10 };
export const LOOK = { bloom: 0, halo: 0, glowDirect: 0, vignette: 0.22, grain: 0.022, ca: 0.0007, lift: [0, 0, 0], contrast: 1.0 };

let T; // timing map
const LW = 384, LH = 216, K = 5;
const FLOOR = 196;
let LO, BG, IMG = {}, LK;
const out = (x) => Math.round(x);
const EOUT = bezier(0, 0, 0.58, 1);

export async function init(R) {
  T = await (await fetch(new URL('./timing.json', import.meta.url))).json();
  META.dur = T.dur;
  LO = mk(LW, LH);
  BG = buildStage();
  IMG.seal = await loadImage('assets/logo/yochi-seal-paper.svg');
  IMG.ely = await loadImage('assets/elysium/elysium-logomark-colorized.svg');
  // the end card lockup, measured and centred: [seal] YOCHI × [crest] ELYSIUM
  const c = R.b, fs = 92, S = 200, es = 170, g1 = 36, g2 = 44;
  const wy = measure(c, 'YOCHI', F.dela(fs)), we = measure(c, 'ELYSIUM', F.dela(fs)), wx = 40;
  const total = S + g1 + wy + g2 + wx + g2 + es + g1 + we;
  let x = 960 - total / 2;
  LK = { fs, es, seal: x + S / 2 };
  x += S + g1; LK.yochi = x; x += wy + g2; LK.x = x + wx / 2; x += wx + g2; LK.ely = x; x += es + g1; LK.elyW = x;
}

// =============================================================================================== the stage
// ELYSIUM: a rooftop at night. A skyline, a giant candle board, a railing with spectators, a tiled floor.
function buildStage() {
  const cv = mk(LW, LH), c = cv.getContext('2d');
  // sky: dithered bands from warm black to surface
  const bands = ['#0f0d0b', '#13110e', '#171411', '#1a1714', '#1e1a16'];
  for (let y = 0; y < 150; y++) {
    const f = y / 150 * (bands.length - 1), i = Math.floor(f), fr = f - i;
    for (let x = 0; x < LW; x++) {
      const dither = ((x + y * 2) % 4) / 4;
      c.fillStyle = bands[Math.min(bands.length - 1, i + (fr > dither ? 1 : 0))];
      c.fillRect(x, y, 1, 1);
    }
  }
  // a thin moon, low left
  c.fillStyle = '#efe7d8'; c.beginPath(); c.arc(56, 58, 9, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#171411'; c.beginPath(); c.arc(60, 55, 9, 0, Math.PI * 2); c.fill();
  // far skyline
  const rnd = mulberry32(7);
  for (const [col, base, hmin, hmax, win] of [['#1f1b17', 150, 20, 60, '#3a332c'], ['#26211c', 150, 14, 44, '#5d5548']]) {
    let x = -4;
    while (x < LW) {
      const w = 10 + Math.floor(rnd() * 22), h = hmin + Math.floor(rnd() * (hmax - hmin));
      c.fillStyle = col; c.fillRect(x, base - h, w, h);
      if (rnd() < 0.3) c.fillRect(x + Math.floor(w / 2), base - h - 6, 1, 6);
      for (let yy = base - h + 3; yy < base - 3; yy += 4) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (rnd() < 0.18) { c.fillStyle = win; c.fillRect(xx, yy, 1, 2); c.fillStyle = col; }
      x += w + Math.floor(rnd() * 3);
    }
  }
  // the board's frame and legs (the screen itself is animated)
  c.fillStyle = '#16130f'; c.fillRect(124, 104, 4, 46); c.fillRect(256, 104, 4, 46);
  c.fillStyle = '#2a2520'; c.fillRect(110, 22, 164, 86); c.fillStyle = '#0b0908'; c.fillRect(113, 25, 158, 80);
  c.fillStyle = '#3a332c'; for (let x = 112; x < 272; x += 6) c.fillRect(x, 107, 3, 1);
  // railing and the back wall behind the spectators
  c.fillStyle = '#16130f'; c.fillRect(0, 150, LW, 30);
  c.fillStyle = '#221e1a'; c.fillRect(0, 150, LW, 2);
  // floor: tiles in perspective from the horizon at y=150
  for (let y = 176; y < LH; y++) {
    const d = (y - 176) / (LH - 176);
    c.fillStyle = d < 0.02 ? '#3a332c' : '#221e1a'; c.fillRect(0, y, LW, 1);
  }
  const rows = [176, 179, 183, 188, 195, 204, 216];
  c.fillStyle = '#2a2520';
  for (const y of rows) c.fillRect(0, y, LW, 1);
  for (let i = -20; i <= 20; i++) {
    const x0 = LW / 2 + i * 14, x1 = LW / 2 + i * 34;
    for (let y = 176; y < LH; y++) { const u = (y - 176) / (LH - 176); c.fillRect(out(lerp(x0, x1, u)), y, 1, 1); }
  }
  // a stencilled tile mark at centre: the stage name in the floor
  return cv;
}

// the board: HYPE candles, the last one alive; after the K.O. it rips green
function board(c, t) {
  const x0 = 116, y0 = 28, w = 152, h = 74;
  c.fillStyle = '#0b0908'; c.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
  // grid
  c.fillStyle = '#16130f';
  for (let y = y0 + 8; y < y0 + h; y += 12) c.fillRect(x0, y, w, 1);
  pixText(c, 'HYPE', x0 + 3, y0 + 2, SUMI.ink, 1);
  pixText(c, '1M', x0 + 23, y0 + 2, SUMI.muted, 1);
  pixText(c, 'ELYSIUM', x0 + w - pixWidth('ELYSIUM') - 3, y0 + 2, SUMI.muted, 1);
  const rnd = mulberry32(21);
  let p = 50;
  const N = 17, cw = 8;
  const rip = clamp((t - T.exit) / 0.6);
  for (let i = 0; i < N; i++) {
    let o = p, cl = p + (rnd() - 0.42) * 9;
    let hi = Math.max(o, cl) + rnd() * 3, lo = Math.min(o, cl) - rnd() * 3;
    if (i === N - 1) {
      // live candle: breathes with the beat, then rips on the K.O.
      const breath = Math.sin(t * Math.PI * (T.bpm / 60)) * 2;
      cl = o + 2 + breath + E.outCubic(rip) * 26; hi = cl + 2; lo = o - 2;
    }
    p = cl;
    const y = (v) => y0 + h - 4 - (v - 30) * 1.1;
    const up = cl >= o;
    const col = up ? SUMI.up : SUMI.down;
    const xx = x0 + 6 + i * cw;
    c.fillStyle = col;
    c.fillRect(xx + 2, out(y(hi)), 1, Math.max(1, out(y(lo) - y(hi))));
    const top = out(Math.min(y(o), y(cl))), bot = out(Math.max(y(o), y(cl)));
    c.fillRect(xx, top, 5, Math.max(2, bot - top));
    if (i === N - 1 && rip > 0) { c.fillStyle = '#b8ffd6'; c.fillRect(xx + 1, top, 3, 1); }
  }
}

// spectators behind the railing: heads and shoulders, bobbing on the beat, jumping on the K.O.
function crowd(c, t) {
  const rnd = mulberry32(5);
  const beat = T.bpm / 60;
  const cheer = clamp((t - T.exit) / 0.2);
  for (let i = 0; i < 46; i++) {
    const x = out(i * 8.6 - 4 + rnd() * 5), s = 0.8 + rnd() * 0.5;
    const ph = rnd() * 6;
    const bobY = Math.round(Math.max(0, Math.sin(t * Math.PI * beat + ph)) * (1 + cheer * 4));
    const y = 152 - bobY;
    const col = rnd() < 0.5 ? '#2a2520' : '#221e1a';
    c.fillStyle = col;
    c.fillRect(x - 4 * s, y - 2, 9 * s, 10);
    c.fillRect(x - 2 * s, y - 7 * s, 5 * s, 6 * s);
    if (cheer > 0 && rnd() < 0.55) { // arms up
      c.fillRect(x - 5 * s, y - 9 - bobY, 1, 8); c.fillRect(x + 5 * s, y - 9 - bobY, 1, 8);
    }
    if (rnd() < 0.12) { c.fillStyle = '#a39a8a'; c.fillRect(x + 3, y - 9 - (cheer > 0 ? 3 : 0), 2, 3); } // a phone up, filming
  }
  // the railing bar in front of them
  c.fillStyle = '#2a2520'; c.fillRect(0, 160, LW, 2); c.fillStyle = '#3a332c'; c.fillRect(0, 160, LW, 1);
  for (let x = 4; x < LW; x += 16) { c.fillStyle = '#221e1a'; c.fillRect(x, 162, 1, 14); }
  c.fillStyle = '#16130f'; c.fillRect(0, 168, LW, 8);
}

// =============================================================================================== fight choreography
// HYPE's feet x and pose; USDC's position, rotation and pose.
function hypeState(t) {
  const bpm = T.bpm / 60;
  if (t < T.windup) {
    const y = Math.round((Math.sin(t * Math.PI * 2 * bpm * 0.5) * 0.5 + 0.5) * 3);
    return { x: 108, pose: HP.bob(HP.idle, y) };
  }
  if (t < T.hit - 0.1) { // wind up: coil back
    const u = E.outCubic(invLerp(T.windup, T.windup + 0.16, t));
    const tremble = Math.round(Math.sin(t * 90) * 1);
    return { x: 108 - u * 8 + tremble, pose: HP.mix(HP.idle, HP.wind, u) };
  }
  if (t < T.hit) { // the dash: 3 frames
    const u = invLerp(T.hit - 0.1, T.hit, t);
    return { x: lerp(100, 176, E.inQuad(u)), pose: HP.mix(HP.wind, HP.punch, E.outQuad(u)), dash: u };
  }
  if (t < T.exit + 0.35) return { x: 176, pose: HP.punch, hold: true };
  // recover into the victory pose
  const u = E.outCubic(invLerp(T.exit + 0.35, T.exit + 0.7, t));
  const y = Math.round(Math.abs(Math.sin((t - T.exit) * 9)) * 2 * u);
  return { x: lerp(176, 168, u), pose: HP.bob(HP.mix(HP.punch, HP.win, u), -y) };
}
function usdcState(t) {
  if (t < T.approve) return { x: 292, y: FLOOR, rot: 0, pose: UP.idle };
  if (t < T.hit) return { x: 292, y: FLOOR, rot: 0, pose: UP.approve };
  const hs = T.hit + T.hitstop;
  if (t < hs) return { x: 292 + (Math.floor(t * 60) % 2 ? 1 : -1), y: FLOOR, rot: 0, pose: UP.hit, flash: true };
  // launched: fast, spinning, rising slightly; gone off the right edge in ~0.12 s
  const dt = t - hs;
  return { x: 292 + dt * 700, y: FLOOR - dt * 200 + dt * dt * 200, rot: dt * 22, pose: { ...UP.hit, noCase: true } };
}
// the briefcase left behind: knocked loose, tumbles, lands and pops open
function briefcase(c, t) {
  const hs = T.hit + T.hitstop;
  if (t < hs) return;
  const dt = t - hs;
  const tl = 0.55;
  let x, y, r;
  if (dt < tl) { x = 300 + dt * 90; y = 150 - dt * 120 + dt * dt * 380 + 34; r = dt * 14; y = Math.min(y, FLOOR - 4); }
  else { x = 300 + tl * 90; y = FLOOR - 4; r = 0; }
  c.save(); c.translate(out(x), out(y)); c.rotate(Math.round(r / (Math.PI / 4)) * (Math.PI / 4));
  c.fillStyle = C.ink; c.fillRect(-11, -8, 22, 15);
  c.fillStyle = C.case; c.fillRect(-10, -7, 20, 13);
  c.fillStyle = C.caseS; c.fillRect(-10, -1, 20, 1); c.fillStyle = C.metal; c.fillRect(-1, -2, 3, 3);
  c.restore();
}
// paperwork: receipts and forms flung out of the case, drifting down
function papers(c, t) {
  const hs = T.hit + T.hitstop;
  if (t < hs) return;
  const dt = t - hs;
  const rnd = mulberry32(99);
  for (let i = 0; i < 26; i++) {
    const vx = 40 + rnd() * 240, vy = -120 - rnd() * 160, ph = rnd() * 6;
    const x0 = 296 + rnd() * 10, y0 = 150 + rnd() * 10;
    // ballistic for a moment, then fluttering down with drag
    const tt = Math.min(dt, 0.35);
    let x = x0 + vx * tt * (1 - tt), y = y0 + vy * tt + 300 * tt * tt;
    if (dt > 0.35) { const d2 = dt - 0.35; x += Math.sin(d2 * 5 + ph) * 8 + (vx * 0.08) * d2; y += d2 * 24; }
    if (y > FLOOR - 1) y = FLOOR - 1;
    if (x > LW + 10) continue;
    const flip = Math.sin(dt * 12 + ph) > 0;
    c.fillStyle = C.ink; c.fillRect(out(x) - 1, out(y) - 1, flip ? 7 : 4, 6);
    c.fillStyle = flip ? '#efe7d8' : '#c9c0b0'; c.fillRect(out(x), out(y), flip ? 5 : 2, 4);
    if (flip) { c.fillStyle = '#8f8676'; c.fillRect(out(x) + 1, out(y) + 1, 3, 1); }
  }
}
// the hit spark at the fist: a hard-edged starburst, a few frames
function spark(c, t) {
  const d = t - T.hit;
  if (d < 0 || d > 0.2) return;
  const x = 292, y = FLOOR - 64;
  const u = d / 0.2;
  const R1 = 10 + u * 22, R0 = Math.max(0, R1 - 10 - (1 - u) * 6);
  const rays = 12;
  c.save(); c.translate(x, y);
  for (const [col, k] of [[C.red, 1.25], ['#fff8ef', 1]]) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < rays * 2; i++) {
      const a = (i / (rays * 2)) * Math.PI * 2 + 0.2, r = (i % 2 ? R1 * 0.45 : R1) * k * (1 - u * 0.3);
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath(); c.fill();
  }
  if (u > 0.3) { c.strokeStyle = '#fff8ef'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R1 * 1.3, 0, Math.PI * 2); c.stroke(); }
  c.restore();
}
// the explosion where USDC leaves the screen: a hard-edged pixel fireball, smoke, debris
function blast(c, t) {
  const d = t - T.exit;
  if (d < 0 || d > 1.1) return;
  const rnd = mulberry32(3);
  const x = LW - 14, y = 120;
  const FIRE = ['#fff8ef', '#ffe3c2', '#ffb48a', C.red, C.redS, '#3a332c', '#2a2520'];
  // the fireball is drawn as soft shapes, then crunched to the fire palette with an ink outline: cartoon puffs
  const fb = sprite('blast', LW, LH, 0, 0, FIRE, (c) => {
  for (let i = 0; i < 40; i++) {
    const a = Math.PI * (0.45 + rnd() * 1.1), sp = 30 + rnd() * 120, r0 = 5 + rnd() * 16;
    const life = 0.25 + rnd() * 0.5;
    const u = (d - rnd() * 0.08) / life; if (u < 0 || u > 1) continue;
    const bx = x + Math.cos(a) * sp * E.outCubic(u) * 0.8, by = y + Math.sin(a) * sp * E.outCubic(u) * 0.6 - u * u * 24;
    const r = r0 * (0.7 + u * 0.9) * (1 - u * 0.45);
    const col = FIRE[Math.min(FIRE.length - 1, Math.floor(u * FIRE.length + rnd() * 0.6))];
    c.fillStyle = col; c.beginPath(); c.arc(out(bx), out(by), Math.max(1, out(r)), 0, Math.PI * 2); c.fill();
  }
  });
  c.drawImage(fb, 0, 0);
  // debris: chunks thrown back into the stage
  for (let i = 0; i < 30; i++) {
    const vx = -60 - rnd() * 220, vy = -80 - rnd() * 160;
    const bx = x + vx * d, by = y + vy * d + 260 * d * d;
    if (by > FLOOR) continue;
    c.fillStyle = rnd() < 0.5 ? '#efe7d8' : C.red; c.fillRect(out(bx), out(by), 2, 2);
  }
  if (d < 0.22) { const u = d / 0.22; c.strokeStyle = '#fff8ef'; c.lineWidth = 3 - u * 2; c.beginPath(); c.arc(x, y, 8 + u * 90, 0, Math.PI * 2); c.stroke(); }
}
// speed lines on the dash and the launch
function speedLines(c, t) {
  const d1 = env(t, T.hit - 0.1, T.hit + 0.05, 0.02, 0.05), d2 = env(t, T.hit + T.hitstop, T.exit + 0.1, 0.01, 0.1);
  const k = Math.max(d1, d2); if (k <= 0) return;
  const rnd = mulberry32(Math.floor(t * 30));
  c.fillStyle = '#efe7d8';
  for (let i = 0; i < 18 * k; i++) { const y = 40 + rnd() * 150, x = rnd() * LW, w = 20 + rnd() * 60; c.globalAlpha = 0.5; c.fillRect(out(x), out(y), out(w), 1); }
  c.globalAlpha = 1;
}
function shadowAt(c, x, w) { c.fillStyle = '#0b0908'; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(out(x), FLOOR + 1, w, 3, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }

function drawStage(c, t) {
  c.drawImage(BG, 0, 0);
  board(c, t);
  crowd(c, t);
  const h = hypeState(t), u = usdcState(t);
  const frozen = t >= T.hit && t < T.hit + T.hitstop;
  shadowAt(c, h.x + 4, 34);
  if (u.x < LW + 30 && u.y > FLOOR - 4) shadowAt(c, u.x, 12);
  speedLines(c, t);
  briefcase(c, t);
  // USDC
  if (u.x < LW + 60) {
    const s = usdcSprite('usdc', u.pose, { rot: u.rot });
    c.drawImage(s, out(u.x - 60), out(u.y - 95));
    if (u.flash && Math.floor(t * 30) % 2 === 0) { c.save(); c.globalCompositeOperation = 'source-atop'; c.restore(); }
  }
  // HYPE: dash smear
  if (h.dash) for (let k = 3; k >= 1; k--) {
    const g = hypeSprite('hypeGhost' + k, h.pose, t);
    c.globalAlpha = 0.18 * k; c.drawImage(g, out(h.x - 110 - k * 14 * h.dash), FLOOR - 205); c.globalAlpha = 1;
  }
  const hs = hypeSprite('hype', h.pose, frozen ? T.hit : t);
  c.drawImage(hs, out(h.x - 110), FLOOR - 205);
  papers(c, t);
  spark(c, t);
  blast(c, t);
}

// =============================================================================================== HUD and type (full res)
const B1 = bezier(0.2, 0.9, 0.3, 1.2);
function inkText(c, str, x, y, size, col, o = {}) {
  // Dela with the brand's hard ink offset shadow
  const off = o.off ?? size * 0.06;
  text(c, str, x + off, y + off, { font: F.dela(size), color: o.shadow || '#0b0908', align: o.align || 'center', track: o.track || 0, alpha: o.alpha });
  text(c, str, x, y, { font: F.dela(size), color: col, align: o.align || 'center', track: o.track || 0, alpha: o.alpha, stroke: o.stroke, strokeW: o.strokeW });
}
function hud(c, t, a = 1) {
  if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  const hs = T.hit + T.hitstop;
  // USDC health: chunk gone on the hit, then the lag bar drains
  const hpU = t < T.hit ? 1 : 0;
  const lagU = t < hs ? 1 : 1 - E.inOutCubic(invLerp(hs + 0.15, T.exit + 0.5, t));
  const bw = 720, bh = 44, y = 62;
  // HYPE bar (left, drains toward the centre)
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 960 - 110 - bw : 960 + 110;
    c.fillStyle = '#0b0908'; c.fillRect(x0 - 6, y - 6, bw + 12, bh + 12);
    c.fillStyle = SUMI.s2; c.fillRect(x0, y, bw, bh);
    if (side < 0) { c.fillStyle = SUMI.red; c.fillRect(x0, y, bw, bh); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x0, y, bw, 8); }
    else {
      c.fillStyle = SUMI.out; c.fillRect(x0, y, bw * lagU, bh);
      c.fillStyle = SUMI.ink; c.fillRect(x0, y, bw * hpU, bh);
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x0, y, bw * Math.max(hpU, lagU), 8);
    }
    // segment ticks
    c.fillStyle = 'rgba(11,9,8,0.35)'; for (let i = 1; i < 10; i++) c.fillRect(x0 + (bw * i) / 10, y, 3, bh);
  }
  const nl = 960 - 110 - bw, nr = 960 + 110 + bw;
  inkText(c, 'HYPE', nl, y + bh + 66, 56, SUMI.ink, { align: 'left', off: 4 });
  label(c, '1P', nl + measure(c, 'HYPE', F.dela(56)) + 22, y + bh + 60, { size: 30, color: SUMI.red });
  inkText(c, 'USDC', nr, y + bh + 66, 56, SUMI.ink, { align: 'right', off: 4 });
  label(c, 'CPU', nr - measure(c, 'USDC', F.dela(56)) - 22, y + bh + 60, { size: 30, color: SUMI.muted, align: 'right' });
  // the arcade timer: it never gets the chance to move
  c.fillStyle = '#0b0908'; c.fillRect(960 - 86, 30, 172, 150);
  text(c, '99', 960, 140, { font: F.dela(104), color: SUMI.ink, align: 'center' });
  const drain = 1 - clamp((t - T.fight) / 60);
  c.fillStyle = SUMI.s2; c.fillRect(960 - 66, 156, 132, 10);
  c.fillStyle = SUMI.red; c.fillRect(960 - 66, 156, 132 * drain, 10);
  c.restore();
}

// the wallet prompts USDC wants signed before he can do anything
const PROMPTS = [
  { at: 0, title: 'APPROVE USDC', sub: 'spending cap request' },
  { at: 0.17, title: 'CONFIRM SWAP', sub: 'HYPE → USDC · slippage 0.5%' },
  { at: 0.34, title: 'SIGN MESSAGE', sub: 'waiting for signature' },
];
function prompts(c, t) {
  if (t < T.approve || t > T.hit + 0.16) return;
  const shatter = E.outCubic(clamp((t - T.hit) / 0.16));
  PROMPTS.forEach((p, i) => {
    const t0 = T.approve + p.at;
    if (t < t0) return;
    const k = slamK(t - t0, 1.25, 0.12);
    const w = 600, h = 190;
    const cx = 1420 - i * 34, cy = 400 - i * 56;
    c.save();
    c.translate(cx + shatter * (500 + i * 160), cy - shatter * (260 + i * 120));
    c.rotate(shatter * (0.4 + i * 0.3));
    c.scale(k.s, k.s);
    c.globalAlpha = 1 - shatter;
    c.fillStyle = '#0b0908'; c.fillRect(-w / 2 + 10, -h / 2 + 10, w, h);
    c.fillStyle = SUMI.s1; c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = SUMI.line; c.lineWidth = 2; c.strokeRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2);
    label(c, 'WALLET', -w / 2 + 30, -h / 2 + 44, { size: 20, color: SUMI.muted });
    const dots = '.'.repeat(1 + (Math.floor(t * 6) % 3));
    text(c, p.title, -w / 2 + 30, -h / 2 + 104, { font: F.dela(52), color: SUMI.ink });
    text(c, p.sub + (i === 2 ? dots : ''), -w / 2 + 30, -h / 2 + 148, { font: F.mono(24, 500), color: SUMI.muted });
    // spinner
    const sa = t * 8;
    c.strokeStyle = SUMI.muted; c.lineWidth = 6; c.beginPath(); c.arc(w / 2 - 60, -h / 2 + 60, 18, sa, sa + 4.2); c.stroke();
    c.restore();
  });
}

function roundCards(c, t) {
  // ROUND 1
  if (t >= T.round && t < T.fight) {
    const d = t - T.round;
    const k = slamK(d, 1.5, 0.14);
    const a = 1 - clamp((d - 0.48) / 0.1);
    c.save(); c.translate(960, 600); c.scale(k.s, k.s);
    inkText(c, 'ROUND 1', 0, 0, 190, SUMI.ink, { alpha: a, off: 12 });
    c.restore();
  }
  // FIGHT!
  if (t >= T.fight && t < T.approve + 0.05) {
    const d = t - T.fight;
    const k = stampK(d, -6, 0.32);
    const a = 1 - clamp((d - 0.34) / 0.08);
    c.save(); c.translate(960, 620); c.rotate(k.r * Math.PI / 180); c.scale(k.s, k.s);
    inkText(c, 'FIGHT!', 0, 0, 280, SUMI.red, { alpha: a * k.a, off: 16 });
    c.restore();
  }
}
function koCard(c, t) {
  if (t < T.ko) return;
  const d = t - T.ko;
  const k = stampK(d, -8, 0.42);
  c.save(); c.translate(960, 560 + (t >= T.elim ? -lerp(0, 150, E.outCubic(clamp((t - T.elim) / 0.25))) : 0));
  c.rotate(k.r * Math.PI / 180); c.scale(k.s, k.s);
  inkText(c, 'K.O.', 0, 0, 360, SUMI.red, { alpha: k.a, off: 20 });
  c.restore();
  if (d >= 0.08) splatter(c, 960, 460, 520, SUMI.red, 4, clamp((d - 0.08) / 0.05));
}
// the band: paper across the screen, ON ELYSIUM over USDC HAS BEEN ELIMINATED, the grey 敗 seal
function elimBand(c, t) {
  if (t < T.elim) return;
  const d = t - T.elim;
  const u = E.outCubic(clamp(d / 0.22));
  const y = 760, h = 200;
  c.save();
  // slide in from the right as one plate
  c.translate((1 - u) * 1920, 0);
  c.fillStyle = '#0b0908'; c.fillRect(0, y - h / 2 + 12, 1920, h);
  c.fillStyle = PAPER.bg; c.fillRect(0, y - h / 2, 1920, h);
  c.globalAlpha = 0.6; paperClip(c, 0, y - h / 2, 1920, h); c.globalAlpha = 1;
  label(c, 'ON ELYSIUM', 400, y - 34, { size: 40, color: PAPER.ink, weight: 800 });
  text(c, 'USDC HAS BEEN ELIMINATED', 396, y + 58, { font: F.dela(88), color: PAPER.ink, maxW: 1440 });
  c.restore();
  // the grey defeat seal stamps onto the band
  if (d > 0.18) {
    const k = stampK(d - 0.18, -8, 0.4);
    seal(c, '敗', 260, y, 170, { tone: 'out', ground: 'paper', s: k.s, rot: k.r, a: k.a });
  }
}
function paperClip(c, x, y, w, h) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.setTransform(c.getTransform()); paper({ b: c }, 0, 0); c.restore(); }

// =============================================================================================== select and versus
function selectScreen(c, L, t, R) {
  // low-res: portraits and the grid
  L.fillStyle = '#0f0d0b'; L.fillRect(0, 0, LW, LH);
  // diagonal pattern behind, scrolling
  L.fillStyle = '#16130f';
  for (let i = -20; i < 40; i++) { const x = i * 16 + ((t * 40) % 16); L.beginPath(); L.moveTo(x, 0); L.lineTo(x + 8, 0); L.lineTo(x + 8 - LH, LH); L.lineTo(x - LH, LH); L.fill(); }
  const lockP1 = t >= T.p1Lock, lockCPU = t >= T.cpuLock;
  // portraits
  const hb = hypeBust(t), ub = usdcBust();
  const pop = (t0) => (t >= t0 ? 1 + pulse(t, t0, 0.06) * 0.06 : 1);
  L.save(); L.translate(70, LH); L.scale(pop(T.p1Lock), pop(T.p1Lock)); L.drawImage(hb, -75, -140); L.restore();
  L.save(); L.translate(314, LH); L.scale(-1, 1); L.drawImage(ub, -75, -140); L.restore();
  // the grid: 3 x 2 tiles
  const tiles = ['HYPE', 'USDC', '?', '?', '?', '?'];
  const gx = 150, gy = 96, ts = 26, gap = 4;
  // cursor: P1 hovers USDC then HYPE before the lock; CPU lands on USDC
  const p1 = t < T.p1Lock - 0.14 ? 1 : 0;
  tiles.forEach((n, i) => {
    const x = gx + (i % 3) * (ts + gap), y = gy + Math.floor(i / 3) * (ts + gap);
    L.fillStyle = '#0b0908'; L.fillRect(x - 1, y - 1, ts + 2, ts + 2);
    L.fillStyle = n === '?' ? '#16130f' : '#221e1a'; L.fillRect(x, y, ts, ts);
    if (n === 'HYPE') { L.save(); L.beginPath(); L.rect(x, y, ts, ts); L.clip(); L.drawImage(hb, x + ts / 2 - 75 * 0.36, y + ts + 18 - 140 * 0.36, 150 * 0.36, 140 * 0.36); L.restore(); }
    if (n === 'USDC') { L.save(); L.beginPath(); L.rect(x, y, ts, ts); L.clip(); L.drawImage(ub, x + ts / 2 - 75 * 0.36, y + ts + 14 - 140 * 0.36, 150 * 0.36, 140 * 0.36); L.restore(); }
    if (n === '?') pixText(L, '?', x + 11, y + 10, '#3a332c');
  });
  const frame = (i, col, blink) => {
    if (blink && Math.floor(t * 16) % 2) return;
    const x = gx + (i % 3) * (ts + gap), y = gy + Math.floor(i / 3) * (ts + gap);
    L.fillStyle = col; L.fillRect(x - 2, y - 2, ts + 4, 2); L.fillRect(x - 2, y + ts, ts + 4, 2); L.fillRect(x - 2, y, 2, ts); L.fillRect(x + ts, y, 2, ts);
  };
  // a dark foot under the name plates
  for (let y = 160; y < LH; y++) { L.globalAlpha = clamp((y - 160) / 34) * 0.85; L.fillStyle = '#0b0908'; L.fillRect(0, y, LW, 1); }
  L.globalAlpha = 1;
  if (lockCPU || t > T.p1Lock) frame(1, SUMI.muted, !lockCPU);
  frame(p1, SUMI.red, !lockP1 && false);
  blit(R, L);
  // full res type
  const b = R.b;
  inkText(b, 'CHOOSE YOUR COLLATERAL', 960, 150, 84, SUMI.ink, { off: 6 });
  label(b, 'ELYSIUM', 960, 214, { size: 28, color: SUMI.muted, align: 'center' });
  // the tags on the tiles, crisp
  label(b, '1P', (gx + (p1 % 3) * (ts + gap)) * K + 10, (gy - 4) * K, { size: 30, color: SUMI.red });
  if (t > T.p1Lock) label(b, 'CPU', (gx + 1 * (ts + gap)) * K + ts * K - 10, (gy - 4) * K, { size: 30, color: SUMI.muted, align: 'right' });
  // name plates
  const plate = (x, name, sub, col, align, on) => {
    inkText(b, name, x, 940, 110, SUMI.ink, { align, off: 7 });
    label(b, sub, x, 1010, { size: 34, color: col, align });
  };
  plate(70, 'HYPE', 'NATIVE · UNHINGED', SUMI.ink, 'left', true);
  plate(1850, 'USDC', 'STABLE · NEEDS APPROVAL', SUMI.ink, 'right', true);
  // the lock flash
  const f = Math.max(pulse(t, T.p1Lock, 0.05), pulse(t, T.cpuLock, 0.05) * 0.6);
  if (f > 0.02) { b.fillStyle = `rgba(255,248,239,${f * 0.5})`; b.fillRect(0, 0, 1920, 1080); }
}
function versus(c, L, t, R) {
  const d = t - T.vs;
  L.fillStyle = '#0f0d0b'; L.fillRect(0, 0, LW, LH);
  // speed streaks
  const rnd = mulberry32(Math.floor(t * 30) + 3);
  L.fillStyle = '#1a1714'; for (let i = 0; i < 30; i++) { const y = rnd() * LH; L.fillRect(0, out(y), LW, 1); }
  const u = E.outCubic(clamp(d / 0.18));
  const drift = d * 10;
  const hb = hypeBust(t), ub = usdcBust();
  L.save(); L.translate(lerp(-100, 96, u) + drift, LH + 6); L.scale(1.35, 1.35); L.drawImage(hb, -75, -140); L.restore();
  L.save(); L.translate(lerp(484, 288, u) - drift, LH + 6); L.scale(-1.35, 1.35); L.drawImage(ub, -75, -140); L.restore();
  blit(R, L);
  const b = R.b;
  // the versus band: paper, two sides, one vermilion slash
  const bu = E.outCubic(clamp((d - 0.06) / 0.16));
  const by = 760, bh = 190;
  b.save();
  b.beginPath(); b.rect(960 - 960 * bu, by - bh / 2, 1920 * bu, bh); b.clip();
  b.fillStyle = '#0b0908'; b.fillRect(0, by - bh / 2 + 12, 1920, bh);
  b.fillStyle = SUMI.band; b.fillRect(0, by - bh / 2, 1920, bh);
  text(b, 'HYPE', 160, by + 44, { font: F.dela(120), color: PAPER.ink });
  text(b, 'USDC', 1760, by + 44, { font: F.dela(120), color: PAPER.ink, align: 'right' });
  b.restore();
  // the slash
  const su = E.outCubic(clamp((d - 0.14) / 0.12));
  if (su > 0) {
    b.save(); b.translate(960, by); b.transform(1, 0, -0.32, 1, 0, 0);
    b.fillStyle = SUMI.red; b.fillRect(-70, -bh / 2 - 60 * su, 140, (bh + 120) * su);
    b.restore();
    text(b, '対', 960, by + 52, { font: F.glyph(150), color: SUMI.onRed, align: 'center', alpha: clamp((d - 0.2) / 0.06) });
  }
  label(b, 'STAGE · ELYSIUM', 960, by + bh / 2 + 70, { size: 28, color: SUMI.muted, align: 'center', alpha: clamp((d - 0.25) / 0.1) });
  const f = pulse(t, T.vs, 0.06);
  if (f > 0.02) { b.fillStyle = `rgba(255,248,239,${f * 0.6})`; b.fillRect(0, 0, 1920, 1080); }
}

// =============================================================================================== end card (paper)
function endCard(t, R) {
  const b = R.b;
  const d = t - T.card;
  const st = T.stamp;
  const [ix, iy] = impactK(t - st, 1);
  b.save(); b.translate(ix, iy);
  paper(R, 0, 0);
  // the three lines, typed in like an arcade results screen
  const lines = ['NO SWAPS', 'NO APPROVALS', 'JUST HYPE'];
  lines.forEach((s, i) => {
    const t0 = T.lines[i];
    if (t < t0) return;
    const n = Math.min(s.length, Math.floor((t - t0) / 0.022) + 1);
    const y = 250 + i * 150;
    const col = i === 2 ? PAPER.red : PAPER.ink;
    text(b, s.slice(0, n), 960, y, { font: F.dela(124), color: col, align: 'center' });
  });
  // the lockup: the Yochi seal stamps, × the Elysium crest
  const ly = 830;
  b.fillStyle = PAPER.line; b.fillRect(560, 640, 800, 2);
  if (t >= st - 0.05) {
    const k = stampK(t - (st - 0.05), -8, 0.5);
    const S = 210;
    b.save(); b.translate(LK.seal, ly); b.rotate(k.r * Math.PI / 180); b.scale(k.s, k.s); b.globalAlpha = k.a;
    b.drawImage(IMG.seal, -S / 2, -S / 2, S, S);
    b.restore();
    if (t >= st) splatter(b, LK.seal, ly, 210, PAPER.red, 6, clamp((t - st) / 0.05));
  }
  const la = clamp((t - st - 0.12) / 0.2);
  b.globalAlpha = la;
  text(b, 'YOCHI', LK.yochi, ly + 34, { font: F.dela(LK.fs), color: PAPER.ink });
  text(b, '×', LK.x, ly + 22, { font: F.dela(64), color: PAPER.muted, align: 'center' });
  b.drawImage(IMG.ely, LK.ely, ly - LK.es / 2, LK.es, LK.es);
  text(b, 'ELYSIUM', LK.elyW, ly + 34, { font: F.dela(LK.fs), color: PAPER.ink });
  label(b, 'testnet.yochigg.xyz', 960, 1010, { size: 34, color: PAPER.redText, align: 'center', weight: 800, track: 2 });
  b.globalAlpha = 1;
  b.restore();
}

// =============================================================================================== frame
function blit(R, L, dx = 0, dy = 0) {
  const b = R.b; b.imageSmoothingEnabled = false;
  b.drawImage(L.canvas, out(dx) * K, out(dy) * K, LW * K, LH * K);
}
function scanlines(b, a = 0.07) {
  b.fillStyle = `rgba(0,0,0,${a})`;
  for (let y = 4; y < 1080; y += 5) b.fillRect(0, y, 1920, 1);
}

export function render(t, R, P) {
  const b = R.b;
  const L = LO.getContext('2d'); L.imageSmoothingEnabled = false; L.setTransform(1, 0, 0, 1, 0, 0);
  if (t < T.vs) { selectScreen(b, L, t, R); scanlines(b); return; }
  if (t < T.round) { versus(b, L, t, R); scanlines(b); return; }
  if (t < T.card) {
    drawStage(L, t);
    // camera: shake on the hit release and the blast (in whole low-res pixels)
    const s1 = shake(t, T.hit + T.hitstop, 6, 0.4, 30, 1), s2 = shake(t, T.exit, 9, 0.6, 26, 2), s3 = shake(t, T.ko, 3, 0.3, 30, 3);
    const sx = s1[0] + s2[0] + s3[0], sy = s1[1] + s2[1] + s3[1];
    // a punch-in during the hit stop
    const z = t >= T.hit && t < T.hit + T.hitstop ? 1.12 : 1;
    if (z !== 1) {
      b.save(); b.translate(292 * K, (FLOOR - 64) * K); b.scale(z, z); b.translate(-292 * K, -(FLOOR - 64) * K); blit(R, L, sx, sy); b.restore();
    } else blit(R, L, sx, sy);
    // dim the world under the result type
    const dim = clamp((t - T.ko) / 0.15) * 0.35;
    if (dim > 0) { b.fillStyle = `rgba(11,9,8,${dim})`; b.fillRect(0, 0, 1920, 1080); }
    hud(b, t, 1);
    roundCards(b, t);
    prompts(b, t);
    koCard(b, t);
    elimBand(b, t);
    scanlines(b);
    // the hit: one white frame, one inverted
    if (t >= T.hit && t < T.hit + 1 / 30) P.flash = 0.85;
    if (t >= T.exit && t < T.exit + 1 / 30) P.flash = 0.6;
    P.ca = 0.0007 + pulse(t, T.hit + T.hitstop, 0.12) * 0.006 + pulse(t, T.exit, 0.15) * 0.004;
    return;
  }
  endCard(t, R);
  P.vignette = 0.12; P.grain = 0.028;
}
