// ACT 4: the unlock (連勝 to 5, the card deal, Untouchable in glory, the new face), the ladder of rewards,
// and the cut into the real product (the paper landing page, rebuilt).
import { M, BEAT, BAR } from '../core/music.js';
import { clamp, lerp, E } from '../core/math.js';
import { SUMI, PAPER, F, REWARDS, GRID_ORDER, BY_ID } from '../lib/brand.js';
import { sumi, paper, paperTex, text, label, measure, seal, stampSeal, riseK, impactK, slamK, splatter, bezier } from '../lib/draw.js';
import { CAST, drawFig, drawCard, drawFace, cardInner } from '../lib/cast.js';
import { inkFlood, chart, makeCandles } from '../lib/ui.js';
import { slamShot, gridLayout, starterRect, rewardRect, rewardSlot, softPlate } from './act1.js';
import { LOGO } from './end.js';

const U = 'untouchable';

// ------------------------------------------------------------------------------------------ the unlock
// FINAL EDIT: the streak to 10, then the app's LEGENDARY unlock (callit.win, yochi-dev:
// app/client/src/components/achievement-unlock-host.tsx, the moment kit and styles/sumi.css): the screen goes to
// ink and the achievement's glyph fills it in gold leaf; then the paper sheet unrolls, the badge washes in like ink
// through wet paper, the name is brushed in, the glyph seal lands with ink thrown and the sheet takes the hit, and
// the actions rise. The app's beats are kept exactly (t0 = 1.05 s after the takeover); the sheet is x1.9.
export const UNLOCK_ART = {};
const GOLD = '#e0b25a', LEGENDARY = '#b98a45';
const UNROLL = bezier(0.3, 0.8, 0.3, 1), WASH = bezier(0.3, 0.7, 0.3, 1), TAKE_G = bezier(0.2, 0.8, 0.3, 1);
const GLYPH = '氷'; // Cold Blooded's seal glyph in the app (lib/seal-glyphs.ts), pending the native review like every glyph
// HOOK revision: the reward is Duel Master, as the app has her: achievement duel_win_10, "Win 10 duels", EPIC
// (so no legendary takeover: the sheet unrolls, the badge washes in, the seal lands with thrown ink and the hit),
// glyph 師, rarity keyline --yo-rarity-epic.
const REWARD = { id: 'duel-master', name: 'DUEL MASTER', desc: 'Win 10 duels', glyph: '師', tier: 'EPIC', color: '#9a3226', chipInk: '#f2ece0', shake: 0.8, splat: 0.55 };

function streak(t, R) {
  const { b, VW } = R;
  const n = 6 + M.STREAK.filter((x) => t >= x).length; // FIRST AD: six already, 7 to 10 on the eighths
  label(b, 'DUELS WON', VW / 2, 150, { size: 34, weight: 800, color: SUMI.muted, align: 'center' });
  const last = M.STREAK.filter((x) => t >= x).pop();
  const ls = last !== undefined ? slamK(t - last, 1.4, 0.12) : { s: 1 };
  b.save(); b.translate(VW / 2, 300); b.scale(ls.s, ls.s);
  text(b, String(n), 0, 105, { font: F.dela(300), color: SUMI.ink, align: 'center' });
  b.restore();
  for (let i = 0; i < 10; i++) {
    const x = VW / 2 + (i - 4.5) * 158, y = 680;
    seal(b, '勝', x, y, 124, { tone: 'empty', rot: 0, a: 0.6 });
    if (i < 6) seal(b, '勝', x, y, 124, { tone: 'red', rot: -8 + (i % 3) * 5 });
    else stampSeal(b, '勝', x, y, 124, t, M.STREAK[i - 6], { tone: 'red', rest: -8 + i * 3, seed: 40 + i, dur: 0.3 });
  }
  label(b, n >= 10 ? 'TEN DUELS WON' : 'AND COUNTING', VW / 2, 860, { size: 30, color: n >= 10 ? SUMI.ink : SUMI.muted, align: 'center' });
}

// the legendary beat: the glyph alone, huge, gold, with gold leaf drifting down (1.25 s)
function takeover(t, R) {
  const { b, VW, VH } = R;
  const d = t - M.TAKEOVER;
  if (d < 0 || d > 1.25) return;
  const p = d / 1.25;
  const op = p < 0.12 ? p / 0.12 : p < 0.78 ? 1 : 1 - (p - 0.78) / 0.22;
  b.save(); b.globalAlpha = op;
  b.fillStyle = SUMI.bg; b.fillRect(0, 0, VW, VH);
  // yo-takeover-glyph: 1.35 blurred -> 1 by 30% -> 0.98 by 80% -> 0.6 gone
  let gs, ga, gb;
  if (p < 0.3) { const u = TAKE_G(p / 0.3); gs = lerp(1.35, 1, u); ga = u; gb = 6 * (1 - u); }
  else if (p < 0.8) { gs = lerp(1, 0.98, (p - 0.3) / 0.5); ga = 1; gb = 0; }
  else { const u = (p - 0.8) / 0.2; gs = lerp(0.98, 0.6, u); ga = 1 - u; gb = 0; }
  b.save(); b.translate(VW / 2, VH / 2); b.scale(gs, gs); b.globalAlpha *= ga;
  if (gb > 0.3) b.filter = `blur(${gb * 1.5}px)`;
  text(b, GLYPH, 0, 230, { font: F.glyph(600), color: GOLD, align: 'center' });
  b.restore();
  // sixteen flecks, the app's sine-hash scatter
  const seed = [...'cold_blooded'].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 100000, 11);
  for (let i = 0; i < 16; i++) {
    const r = (n) => { const x = Math.sin(seed * 12.9898 + i * 78.233 + n * 37.719) * 43758.5453; return x - Math.floor(x); };
    const left = (8 + r(1) * 84) / 100 * VW, top = (10 + r(2) * 40) / 100 * VH, sz = (4 + r(3) * 7) * 1.5;
    const dx = (r(4) - 0.5) * 80 * 1.5, spin = 120 + r(5) * 300, delay = 0.15 + r(6) * 0.4, dur = 1.4 + r(7) * 0.8;
    const u = (d - delay) / dur;
    if (u < 0 || u > 1) continue;
    const e = u * u; // ease-in
    const fa = u < 0.15 ? (u / 0.15) * 0.9 : 0.9 * (1 - (u - 0.15) / 0.85);
    b.save(); b.translate(left + dx * e, top + lerp(-20, 120, e) * 1.5); b.rotate(spin * e * Math.PI / 180);
    b.globalAlpha *= fa; b.fillStyle = GOLD; b.fillRect(-sz / 2, -sz * 0.35, sz, sz * 0.7);
    b.restore();
  }
  b.restore();
}

function sheet(t, R) {
  const { b, VW, VH } = R;
  const t0 = M.SHEET, Ks = 1.9;
  const RW = REWARD;
  const at = { card: t0 + 0.08, art: t0 + 0.4, name: t0 + 0.55, seal: t0 + 0.95, actions: t0 + 1.25 };
  if (t < at.card) return;
  // the backdrop: the page dimmed
  b.fillStyle = 'rgba(15,13,11,0.86)'; b.fillRect(0, 0, VW, VH);
  const W = 384 * Ks, H = 466 * Ks, x = (VW - W) / 2, y = (VH - H) / 2;
  const uu = UNROLL(clamp((t - at.card) / 0.55));
  const [ix, iy] = impactK(t - at.seal - 0.2, RW.shake);
  b.save();
  b.translate(ix, iy);
  // yo-unroll: from a thin rod to the full sheet, origin top
  b.translate(0, y); b.scale(1, lerp(0.05, 1, uu)); b.translate(0, -y);
  b.globalAlpha = lerp(0.6, 1, uu);
  b.save(); b.shadowColor = 'rgba(0,0,0,0.55)'; b.shadowBlur = 60 * Ks; b.shadowOffsetY = 24 * Ks;
  b.fillStyle = PAPER.bg; b.beginPath(); b.roundRect(x, y, W, H, 4 * Ks); b.fill(); b.restore();
  b.save(); b.beginPath(); b.roundRect(x, y, W, H, 4 * Ks); b.clip();
  b.globalAlpha *= 0.9; b.drawImage(paperTex(), x - 40, y - 40); b.drawImage(paperTex(), x - 40, y + 1000 - 40);
  b.restore();
  b.strokeStyle = PAPER.line; b.lineWidth = 1.5; b.beginPath(); b.roundRect(x, y, W, H, 4 * Ks); b.stroke();
  // the rarity rule: the frame's own colour along the top edge
  b.fillStyle = RW.color; b.fillRect(x, y, W, 4 * Ks);
  const cx = x + W / 2;
  label(b, 'ACHIEVEMENT UNLOCKED', cx, y + 46 * Ks, { size: 11 * Ks, weight: 800, color: PAPER.muted, align: 'center', track: 0.24 * 11 * Ks, alpha: clamp((t - at.card - 0.1) / 0.3) });
  // the badge, washed in (yo-wash: a soft circle of paint growing from the centre, 0.9 s)
  const bs = 128 * Ks, bx = cx - bs / 2, by = y + 72 * Ks;
  const wu = WASH(clamp((t - at.art) / 0.9));
  if (wu > 0) {
    const rr = bs * 1.5 * wu;
    for (let i = 0; i < 4; i++) {
      b.save(); b.beginPath(); b.arc(cx, by + bs / 2, Math.max(0, rr * (1 - i * 0.06)), 0, Math.PI * 2); b.clip();
      b.globalAlpha *= i === 0 ? 0.4 : 0.2 + (i === 3 ? 0.4 : 0);
      b.drawImage(UNLOCK_ART.badge, bx, by, bs, bs);
      b.restore();
    }
  }
  // the glyph seal, its ink thrown out behind it
  const sx = bx + bs + 6 * Ks - 54 * Ks / 2 + 10, sy = by + bs + 8 * Ks - 54 * Ks / 2;
  if (t >= at.seal + 0.2) {
    const k = clamp((t - at.seal - 0.2) / 0.42);
    splatter(b, sx, sy, 150 * Ks * RW.splat, PAPER.red, 23, k);
    splatter(b, sx, sy, 150 * Ks * RW.splat * 0.64, PAPER.red, 29, k);
  }
  stampSeal(b, RW.glyph, sx, sy, 54 * Ks, t, at.seal + 0.1, { tone: 'red', ground: 'paper', color: PAPER.red, rest: -8, splat: false });
  // tier chip, name brushed in, the rule, the date
  const ny = by + bs + 40 * Ks;
  const ca = clamp((t - at.name) / 0.3);
  if (ca > 0) {
    b.save(); b.globalAlpha *= ca;
    const cw = 96 * Ks, chh = 18 * Ks;
    b.fillStyle = RW.color; b.fillRect(cx - cw / 2, ny - chh + 4, cw, chh);
    label(b, RW.tier, cx, ny - 1, { size: 10 * Ks, weight: 800, color: RW.chipInk, align: 'center', track: 0.24 * 10 * Ks });
    b.restore();
  }
  const nf = F.dela(30 * Ks), nm = RW.name, nw = measure(b, nm, nf);
  const bu = clamp((t - at.name) / 0.55);
  if (bu > 0) {
    b.save(); b.beginPath(); b.rect(cx - nw / 2 - 20, ny + 8, (nw + 40) * E.outCubic(bu), 80 * Ks); b.clip();
    text(b, nm, cx, ny + 38 * Ks, { font: nf, color: PAPER.ink, align: 'center' });
    b.restore();
  }
  text(b, RW.desc, cx, ny + 64 * Ks, { font: F.zen(14 * Ks, 500), color: PAPER.muted, align: 'center', alpha: clamp((t - at.name - 0.15) / 0.3) });
  label(b, 'EARNED 5 NOV 2026', cx, ny + 84 * Ks, { size: 10 * Ks, color: '#8a8173', align: 'center', track: 0.12 * 10 * Ks, alpha: clamp((t - at.name - 0.2) / 0.3) });
  // the actions rise
  const ra = riseK(t - at.actions, 24 * Ks);
  if (ra.a > 0) {
    b.save(); b.globalAlpha *= ra.a; b.translate(0, ra.y);
    const ax = x + 24 * Ks, aw = W - 48 * Ks, ay = ny + 108 * Ks;
    b.fillStyle = PAPER.ink; b.fillRect(ax + 4 * Ks, ay + 4 * Ks, aw, 52 * Ks);
    b.fillStyle = PAPER.red; b.fillRect(ax, ay, aw, 52 * Ks);
    text(b, 'SHOW BESIDE MY NAME', cx, ay + 34 * Ks, { font: F.dela(15 * Ks), color: PAPER.onRed, align: 'center', track: 0.6 * Ks });
    const qw = (aw - 10 * Ks) / 2, qy = ay + 62 * Ks;
    for (const [i, s] of [[0, 'SHARE'], [1, 'DONE']]) {
      const qx = ax + i * (qw + 10 * Ks);
      b.strokeStyle = PAPER.line; b.lineWidth = 1.5 * Ks; b.strokeRect(qx, qy, qw, 46 * Ks);
      label(b, s, qx + qw / 2, qy + 29 * Ks, { size: 12 * Ks, weight: 800, color: PAPER.ink, align: 'center', track: 0.16 * 12 * Ks });
    }
    b.restore();
  }
  b.restore();
}

export function unlockShot(t, R, P) {
  sumi(R);
  // HOOK revision: EPIC has no takeover; the counter stays under the sheet's dimmed backdrop, as in the app
  streak(t, R);
  sheet(t, R);
}

// ------------------------------------------------------------------------------------------ the ladder
// FLAGSHIP: four singles (THE CAST had six); Took the Pool and Ronin move into the gallery with Bloodsport
// FINAL EDIT: Cold Blooded (the face you just earned, a bar, with the face swap) and Duel Master (two beats)
const HEROES = [
  { id: 'duel-master', side: -1, hx: 0.3, hy: 0.3, k: 0.8 },
];
export const GALLERY_IDS = ['took-the-pool', 'ronin', 'bloodsport'];
export const HERO_IDS = [...HEROES.map((h) => h.id), ...GALLERY_IDS];

export function heroShot(t, R, P, i) {
  const { b, VW, VH } = R;
  const h = HEROES[i]; const r = BY_ID[h.id];
  const t0 = M.HEROES[i], dt = t - t0;
  paper(R, -dt * 14 * h.side, 0);
  const C = CAST[h.id];
  const sl = slamK(dt, 1.14, 0.15);
  const k = h.k * (1 + dt * 0.03), hx = VW * h.hx, hy = VH * h.hy;
  b.save(); b.globalCompositeOperation = 'multiply'; b.globalAlpha = 0.85;
  const kk = k * 1.03 * (1 + (sl.s - 1) * 0.5); const [W, H] = C.j.paint;
  b.drawImage(softPlate(h.id), hx - C.j.head[0] * kk - h.side * 30 * (1 - Math.exp(-dt * 3)), hy - C.j.head[1] * kk, W * kk, H * kk);
  b.restore();
  b.save(); b.translate(hx, hy); b.scale(sl.s, sl.s); b.translate(-hx, -hy);
  drawFig(b, h.id, hx, hy, k, { a: sl.a });
  b.restore();
  const bot = hy - C.j.head[1] * k + (C.j.fig[1] + C.j.fig[3]) * k;
  if (bot < VH + 40) { const gr = b.createLinearGradient(0, bot - 140, 0, bot); gr.addColorStop(0, 'rgba(242,236,224,0)'); gr.addColorStop(1, 'rgba(242,236,224,1)'); b.fillStyle = gr; b.fillRect(0, bot - 140, VW, 142); }
  const tx = h.side > 0 ? 110 : VW - 110, align = h.side > 0 ? 'left' : 'right';
  const ts = lerp(1.2, 1, E.outCubic(clamp(dt / 0.12)));
  const [ix, iy] = impactK(dt - 0.02, 1);
  const words = r.name.split(' ');
  b.save(); b.translate(tx + ix, 640 + iy); b.scale(ts, ts); b.translate(-tx, -640);
  label(b, i === 0 ? 'REWARD · UNLOCKED' : 'REWARD', tx, 330, { size: 24, color: i === 0 ? PAPER.redText : PAPER.muted, align });
  words.forEach((w, j) => text(b, w, tx, 470 + j * 140, { font: F.dela(136), color: PAPER.ink, align, maxW: VW * 0.44, stroke: PAPER.bg, strokeW: 18 }));
  const ly = 470 + (words.length - 1) * 140 + 86;
  text(b, r.unlock.toUpperCase(), tx, ly, { font: F.mono(44, 800), color: PAPER.ink, align, track: 3, maxW: VW * 0.46, stroke: PAPER.bg, strokeW: 12 });
  b.restore();
  if (dt < 0.1) P.zoomBlur = 0.05 * (1 - dt / 0.1);
  if (i === 0) {
    faceSwap(b, t, 'duel-master', 'DUEL MASTER', h.side);
    // FIRST AD: what just happened, in plain words
    const r = riseK(t - M.SWAP - 0.15, 20);
    text(b, 'Wins earn you new faces.', h.side > 0 ? 110 : VW - 110, 1000 + r.y, { font: F.dela(52), color: PAPER.ink, align: h.side > 0 ? 'left' : 'right', alpha: r.a, stroke: PAPER.bg, strokeW: 12 });
  }
}

// the player chip: same player, new face (moved here from THE CAST's Untouchable glory)
function faceSwap(b, t, id, name, side = 1) {
  const cin = E.outExpo(clamp((t - (M.SWAP - BEAT * 1.5)) / 0.3));
  if (cin <= 0) return;
  const cx = side > 0 ? lerp(-520, 110, cin) : lerp(1960, 1920 - 110 - 480, cin), cy = 760;
  b.save();
  b.fillStyle = PAPER.s1; b.fillRect(cx, cy, 480, 150);
  b.strokeStyle = PAPER.red; b.lineWidth = 5; b.strokeRect(cx + 2.5, cy + 2.5, 475, 145);
  const sw = clamp((t - M.SWAP) / 0.22);
  const flip = sw < 0.5 ? 1 - sw * 2 : (sw - 0.5) * 2;
  b.save(); b.translate(cx + 80, cy + 75); b.scale(Math.max(0.02, flip), 1);
  drawFace(b, sw < 0.5 ? 'starter-perma-bull' : id, 0, 0, 56);
  b.restore();
  b.strokeStyle = PAPER.red; b.lineWidth = 4; b.beginPath(); b.arc(cx + 80, cy + 75, 60, 0, Math.PI * 2); b.stroke();
  b.fillStyle = PAPER.red; b.fillRect(cx + 160, cy + 30, 66, 28);
  text(b, 'YOU', cx + 193, cy + 51, { font: F.mono(18, 800), color: PAPER.onRed, align: 'center', track: 3 });
  text(b, 'mamo', cx + 240, cy + 56, { font: F.dela(34), color: PAPER.ink });
  label(b, sw < 0.5 ? 'PERMA-BULL' : name, cx + 162, cy + 112, { size: 22, color: sw < 0.5 ? PAPER.muted : PAPER.redText });
  b.restore();
  if (t >= M.SWAP + 0.11) splatter(b, cx + 80, cy + 75, 150, PAPER.red, 13, clamp((t - M.SWAP - 0.11) / 0.06));
}

// the grid again: the 18 slots light one per eighth, starting with the rewards already shown
export function ladderGridShot(t, R, P) {
  const { b, VW, VH } = R;
  const L = gridLayout(R);
  const dt = t - M.LADDER_GRID;
  paper(R);
  const shown = new Set(HERO_IDS);
  const order = REWARDS.map((r) => r.id).filter((id) => !shown.has(id));
  // camera: a slow pull back
  const zs = lerp(1.06, 1, E.outCubic(clamp(dt / 0.8)));
  b.save(); b.translate(VW / 2, VH / 2); b.scale(zs, zs); b.translate(-VW / 2, -VH / 2);
  const ca = clamp(dt / 0.15);
  text(b, 'You start as one of ten and earn the other eighteen.', VW / 2, 190, { font: F.zen(60, 900), color: PAPER.ink, align: 'center', alpha: ca, maxW: VW - 160 });
  label(b, 'STARTERS · 10 FREE', L.x0, L.y0 - 72, { size: 22, color: PAPER.ink });
  label(b, 'REWARDS · 18 TO EARN', L.rx0, L.y0 - 72, { size: 22, color: PAPER.ink });
  GRID_ORDER.forEach((id) => { const [x, y, w] = starterRect(L, id); drawCard(b, id, x, y, w); });
  REWARDS.forEach((r, i) => {
    const [x, y, w] = rewardRect(L, i);
    let lit = shown.has(r.id) ? 1 : 0, s = 1;
    const j = order.indexOf(r.id);
    if (j >= 0) {
      const lt = M.LADDER_GRID + 0.1 + j * BEAT / 4; // FLAGSHIP: sixteenths, one bar (THE CAST: eighths, two)
      lit = clamp((t - lt) / 0.08);
      s = t >= lt ? 1 + 0.12 * Math.exp(-(t - lt) / 0.09) : 1;
    }
    b.save(); b.translate(x + w / 2, y + w * 2 / 3); b.scale(s, s); b.translate(-(x + w / 2), -(y + w * 2 / 3));
    rewardSlot(b, r.id, x, y, w, lit);
    b.restore();
  });
  b.restore();
}

// ------------------------------------------------------------------------------------------ the product
// The real paper landing page (reference/screens/real-landing.png), rebuilt at 1920x1080 in the renderer.
const PRACTICE = makeCandles(31, 14, 41.86, 0.03, 0.006);
export function productShot(t, R, P) {
  const { b, VW, VH } = R;
  const dt = t - M.PRODUCT;
  // the page arrives with a push, settles
  const zin = E.outExpo(clamp(dt / 0.5));
  if (dt < 0.25) P.blurVec = [0, 0.04 * (1 - dt / 0.25)];
  b.save();
  const s = lerp(1.12, 1, zin) * (1 + dt * 0.008);
  b.translate(VW / 2, VH / 2); b.scale(s, s); b.translate(-VW / 2, -VH / 2 + (1 - zin) * 80);
  // (FLAGSHIP: no dive; the brush tears across the page instead, see signature.js)
  paper(R);
  // nav
  b.drawImage(LOGO.markPaper, 160, 34, 48, 48);
  text(b, 'YOCHI', 224, 76, { font: F.dela(40), color: PAPER.ink, track: 1 });
  text(b, '予知', 384, 72, { font: F.glyph(26), color: PAPER.muted });
  [['THE GAMES', 730], ['HOW IT WORKS', 905], ['IT GETS PERSONAL', 1118], ['FAQ', 1320]].forEach(([s2, x]) => label(b, s2, x, 64, { size: 19, color: PAPER.ink }));
  b.strokeStyle = PAPER.ink; b.lineWidth = 3; b.strokeRect(1640, 26, 116, 58); label(b, 'ENTER', 1698, 64, { size: 19, color: PAPER.ink, align: 'center' });
  // hero copy
  label(b, 'PREDICTION GAMES ON HYPERLIQUID', 165, 172, { size: 19, color: PAPER.muted });
  text(b, 'Call it right.', 160, 330, { font: F.dela(112), color: PAPER.ink });
  text(b, 'Take the pool.', 160, 460, { font: F.dela(112), color: PAPER.ink });
  ['UP or DOWN on the next HYPE candle. Everyone in the round', 'puts in, and the side that reads it right splits the pot. Then', 'take it 1v1, or outlast a whole lobby.']
    .forEach((ln, i) => text(b, ln, 165, 552 + i * 40, { font: F.zen(28, 500), color: PAPER.muted }));
  // ENTER YOCHI: vermilion with the hard ink offset shadow, pressed in on the click
  const press = t >= M.PRESS ? Math.exp(-(t - M.PRESS) / 0.25) : 0;
  const pd = 7 - 5 * (t >= M.PRESS ? clamp((t - M.PRESS) / 0.06) : 0) * (press > 0.2 ? 1 : 0);
  const bx = 165 + (7 - pd), by = 690 + (7 - pd);
  b.fillStyle = PAPER.ink; b.fillRect(165 + 7, 690 + 7, 360, 82);
  b.fillStyle = '#c63a26'; b.fillRect(bx, by, 360, 82);
  text(b, 'ENTER YOCHI', bx + 180, by + 56, { font: F.dela(36), color: PAPER.onRed, align: 'center', maxW: 320 });
  label(b, 'SEE THE GAMES ↓', 580, 742, { size: 20, color: PAPER.ink });
  b.fillStyle = PAPER.ink; b.fillRect(580, 752, 196, 2);
  label(b, 'USDC IN, USDC OUT   ·   SETTLED BY HYPERCORE   ·   5% RAKE', 165, 830, { size: 17, color: PAPER.muted });
  // the free practice round
  const px = 1110, py = 186, pw = 660, ph = 496;
  b.save(); b.shadowColor = 'rgba(60,40,20,0.25)'; b.shadowBlur = 40; b.shadowOffsetY = 18; b.fillStyle = '#0e0c0a'; b.fillRect(px, py, pw, ph); b.restore();
  label(b, 'TRY ONE · NO WALLET · NO MONEY', px + 28, py + 40, { size: 15, color: SUMI.muted });
  label(b, '2/3 RIGHT · 2 IN A ROW', px + pw - 28, py + 40, { size: 15, color: SUMI.ink, align: 'right' });
  b.fillStyle = SUMI.line; b.fillRect(px, py + 64, pw, 2);
  {
    const cx0 = px + 28, cw = pw - 56, cy0 = py + 110, chh = 200, n = PRACTICE.length + 1, step = cw / n;
    let lo = 41.7, hi = 42.06; const Y = (p) => cy0 + chh - (p - lo) / (hi - lo) * chh;
    const live = { o: 41.95, c: lerp(41.95, 42.02, clamp((dt - 0.6) / 0.15)), h: 42.03, l: 41.93 };
    [...PRACTICE, live].forEach((k, i) => {
      const x = cx0 + step * (i + 0.5), up = k.c >= k.o; b.fillStyle = up ? SUMI.up : SUMI.down; b.strokeStyle = b.fillStyle; b.lineWidth = 3;
      b.beginPath(); b.moveTo(x, Y(k.h)); b.lineTo(x, Y(k.l)); b.stroke();
      b.fillRect(x - step * 0.28, Y(Math.max(k.o, k.c)), step * 0.56, Math.max(3, Y(Math.min(k.o, k.c)) - Y(Math.max(k.o, k.c))));
    });
    b.strokeStyle = SUMI.ink; b.globalAlpha = 0.7; b.setLineDash([8, 6]); b.lineWidth = 2; b.beginPath(); b.moveTo(cx0, Y(41.95)); b.lineTo(cx0 + cw, Y(41.95)); b.stroke(); b.setLineDash([]); b.globalAlpha = 1;
  }
  stampSeal(b, 'CALLED IT', px + 330, py + 210, 190, t, M.PRODUCT + 0.84, { tone: 'red', rest: -10, seed: 51 });
  text(b, 'It closed at 42.02', px + 28, py + 400, { font: F.dela(38), color: SUMI.ink });
  label(b, 'YOU WERE RIGHT', px + pw - 28, py + 396, { size: 17, color: SUMI.muted, align: 'right' });
  text(b, 'That’s a win in a real round.', px + 28, py + 458, { font: F.zen(22, 500), color: SUMI.muted });
  b.strokeStyle = SUMI.ink; b.lineWidth = 2; b.strokeRect(px + 330, py + 422, 106, 56); label(b, 'AGAIN', px + 383, py + 457, { size: 16, color: SUMI.ink, align: 'center' });
  b.fillStyle = SUMI.ink; b.fillRect(px + 452, py + 422, 208, 56); label(b, 'PLAY IT FOR REAL →', px + 556, py + 457, { size: 15, color: SUMI.bg, align: 'center' });
  b.restore();
  // the cursor travels to ENTER YOCHI and presses
  const mv = E.inOutCubic(clamp((t - (M.PRESS - 0.75)) / 0.6));
  if (t > M.PRESS - 0.9 && t < M.PRESS + 0.3) {
    const x = lerp(1380, 345, mv), y = lerp(860, 735, mv);
    const s = t >= M.PRESS ? 1 - 0.12 * Math.exp(-(t - M.PRESS) / 0.1) : 1;
    b.save(); b.translate(x, y); b.scale(1.5 * s, 1.5 * s);
    b.fillStyle = '#fff'; b.strokeStyle = PAPER.ink; b.lineWidth = 2; b.lineJoin = 'round';
    b.beginPath(); b.moveTo(0, 0); b.lineTo(0, 32); b.lineTo(8, 25); b.lineTo(14, 38); b.lineTo(19, 36); b.lineTo(13, 23); b.lineTo(24, 23); b.closePath(); b.fill(); b.stroke();
    b.restore();
  }
}

// FLAGSHIP: the gallery. Three rewards share one sheet, one per beat, each over its unlock rule.
export function galleryShot(t, R, P) {
  const { b, VW, VH } = R;
  const dt = t - M.GALLERY;
  paper(R, -dt * 10, 0);
  const colW = VW / 3;
  GALLERY_IDS.forEach((id, i) => {
    const t0 = M.GALLERY + i * BEAT; if (t < t0) return;
    const d = t - t0, C = CAST[id], r = BY_ID[id];
    const sl = slamK(d, 1.16, 0.14);
    const x0 = i * colW, hx = x0 + colW / 2, hy = 345;
    const k = 0.57 * (1 + d * 0.025);
    b.save();
    b.beginPath(); b.rect(x0, 0, colW, VH); b.clip();
    b.save(); b.globalCompositeOperation = 'multiply'; b.globalAlpha = 0.85;
    const kk = k * 1.03; const [W, H] = C.j.paint;
    b.drawImage(softPlate(id), hx - C.j.head[0] * kk, hy - C.j.head[1] * kk, W * kk, H * kk);
    b.restore();
    b.translate(hx, hy); b.scale(sl.s, sl.s); b.translate(-hx, -hy);
    drawFig(b, id, hx, hy, k);
    b.restore();
    const gr = b.createLinearGradient(0, 760, 0, 940); gr.addColorStop(0, 'rgba(242,236,224,0)'); gr.addColorStop(1, 'rgba(242,236,224,0.96)');
    b.fillStyle = gr; b.fillRect(x0, 760, colW, VH - 760);
    const ts = lerp(1.2, 1, E.outCubic(clamp(d / 0.12)));
    b.save(); b.translate(x0 + colW / 2, 960); b.scale(ts, ts);
    text(b, r.name, 0, 0, { font: F.dela(68), color: PAPER.ink, align: 'center', maxW: colW - 60, stroke: PAPER.bg, strokeW: 14 });
    text(b, r.unlock.toUpperCase(), 0, 50, { font: F.mono(24, 800), color: PAPER.ink, align: 'center', track: 2, maxW: colW - 60 });
    b.restore();
    if (i) { b.fillStyle = 'rgba(22,19,15,0.25)'; b.fillRect(x0 - 1, 60, 2, VH - 120); }
    if (d < 0.08) P.zoomBlur = 0.04 * (1 - d / 0.08);
  });
}
