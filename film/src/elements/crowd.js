// Crowds of players in the 2.5D world, with LOD.
import { rngFrom, clamp, lerp, rgba, hexToRgb } from '../core/math.js';
import { drawHelmet, drawHelmetBack, crowdSilhouette, crowdRim, RGB, C } from './helmet.js';
import { drawTinyEyes } from './led.js';
import { logoPath } from './logo.js';
import { crowdArtReady, drawCrowdHead } from './crowdArt.js';
import { drawCanon } from './canon.js';

const TYPES = ['dome', 'dome', 'bear', 'horns', 'frog', 'cat', 'antenna', 'fin', 'dome', 'bear', 'frog'];
export const NAMES = ['0XTOM', 'COPE_DEALER', 'SOLDTHEBOTTOM', 'MARCO94', 'RAJ_HL', 'DEANO', 'THEO', 'SOUP', 'HANNAH_T', 'MIRA',
  'DEVON', 'KEVIN', 'SENKU', 'BEAR69', 'TSB', 'ORACLE', 'BULLAN', 'GIGACHAD_ETH', 'WAGMI_WENDY', 'NGMI_NATE', 'DEGEN_DAVE', 'LOWCAP_LU',
  'PAPERHANDS', 'ONLY_UP', 'SHORTY', 'CANDLEBOY', 'REKT_RICK', 'LILGWEI', 'APE_ANNIE', 'COPIUM', 'NOTFINANCIAL', 'FOMO_FRED'];
const SHELLS = [[62, 56, 90], [54, 50, 78], [72, 64, 100], [48, 46, 70], [66, 58, 84], [58, 60, 92]];

// Arena ring: members stand around a centre (the candle), all facing it.
export function makeRing(o) {
  const rnd = rngFrom('ring', o.seed || 1);
  const m = [];
  const cx = o.cx || 0, cz = o.cz || 0;
  let r = o.r0;
  let ring = 0;
  while (r < o.r1) {
    const step = (o.sx || 0.8) * (1 + (r - o.r0) * (o.grow || 0.004));
    const n = Math.floor((Math.PI * 2 * r) / step);
    const off = rnd() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * Math.PI * 2 + (rnd() - 0.5) * (step / r) * 0.6;
      const rr = r + (rnd() - 0.5) * step * 0.5;
      if (o.skip && o.skip(a, rr)) continue;
      const t = TYPES[(rnd() * TYPES.length) | 0];
      m.push({
        x: cx + Math.cos(a) * rr, z: cz + Math.sin(a) * rr, ang: a, rad: rr, type: t, shell: SHELLS[(rnd() * SHELLS.length) | 0],
        h: 1.52 + (rnd() - 0.5) * 0.16, ph: rnd() * 100, r1: rnd(), r2: rnd(), r3: rnd(),
        name: NAMES[(rnd() * NAMES.length) | 0], id: m.length, cx, cz, ring,
      });
    }
    r += (o.sz || 0.78) * (1 + (r - o.r0) * (o.grow || 0.004));
    ring++;
  }
  return m;
}

export function makeCrowd(o) {
  const rnd = rngFrom('crowd', o.seed || 1);
  const m = [];
  const sx = o.sx || 0.82, sz = o.sz || 0.8;
  let row = 0;
  for (let z = o.z0; z < o.z1; z += sz * (1 + (z - o.z0) * (o.grow || 0)), row++) {
    const span = o.width + (z - o.z0) * (o.spread || 0.9);
    const step = sx * (1 + (z - o.z0) * (o.grow || 0));
    for (let x = -span / 2 + (row % 2) * step * 0.5; x < span / 2; x += step) {
      if (o.gap && Math.abs(x) < o.gap(z)) continue;
      const jx = (rnd() - 0.5) * step * 0.55, jz = (rnd() - 0.5) * sz * 0.5;
      const t = TYPES[(rnd() * TYPES.length) | 0];
      m.push({
        x: x + jx + (o.cx || 0), z: z + jz, type: t, shell: SHELLS[(rnd() * SHELLS.length) | 0],
        h: 1.52 + (rnd() - 0.5) * 0.16, ph: rnd() * 100, r1: rnd(), r2: rnd(), r3: rnd(),
        name: NAMES[(rnd() * NAMES.length) | 0], id: m.length,
      });
    }
  }
  return m;
}

const HEAD_R = 0.235;
// the hood's face opening at crowd size (right half, head units; see openingSegs in helmet.js)
const FACE = [[0.45, -0.5], [0.72, -0.44], [0.8, -0.35], [0.86, -0.15], [0.87, 0.1], [0.82, 0.39], [0.7, 0.56], [0.4, 0.74]];

/**
 * st(m) -> { eyes, led, ledI, look, jump, dx, dz (small offsets, world units), yaw, roll, hide, face, accent }
 * env: { key:{x,y,col,k}, rim:{x,y,col,k}, fogCol, fogNear, fogFar, lit:[r,g,b] (front light colour on silhouettes) }
 */
export function drawCrowd(R, cam, members, st, env) {
  const { b } = R;
  const list = [];
  for (const m of members) {
    const s = st(m);
    if (s.hide) continue;
    const p = cam.p(m.x + (s.dx || 0), m.h + (s.jump || 0), m.z + (s.dz || 0));
    if (!p || p[2] < (env.near ?? 0.9)) continue;
    if (env.minZ !== undefined && p[2] < env.minZ) continue;
    if (env.maxZ !== undefined && p[2] >= env.maxZ) continue;
    const r = HEAD_R * p[3];
    if (p[0] < -r * 3 || p[0] > 1920 + r * 3 || p[1] < -r * 4 || p[1] > 1080 + r * 3) continue;
    list.push([p, r, m, s]);
  }
  list.sort((a, c) => c[0][2] - a[0][2]);
  const fogCol = env.fogCol || [22, 19, 40];
  const fn = env.fogNear ?? 4, ff = env.fogFar ?? 60;
  const lit = env.lit || [150, 170, 220];
  const rim = env.rim || { x: 0.2, y: -1, col: RGB.cyan, k: 1 };
  const key = env.key || { x: -0.3, y: -0.4, col: [200, 225, 255], k: 0.6 };
  const art = crowdArtReady() && env.art !== false;
  for (const [p, r, m, s] of list) {
    const fog = clamp((p[2] - fn) / (ff - fn)) ** 0.8;
    const led = s.led || RGB.text;
    let back = env.back, yaw = s.yaw || 0;
    if (m.cx !== undefined && !env.forceFront) {
      // member faces the ring centre; compare with direction to camera
      const fx = m.cx - m.x, fz = m.cz - m.z; const fl = Math.hypot(fx, fz) || 1;
      const qx = cam.x - m.x, qz = cam.z - m.z; const ql = Math.hypot(qx, qz) || 1;
      const dot = (fx * qx + fz * qz) / (fl * ql);
      const crs = (fx * qz - fz * qx) / (fl * ql);
      back = dot < -0.05;
      // yaw sign: screen-space turn; camera yaw flips the handedness
      yaw = clamp(Math.atan2(crs, Math.max(0.05, dot)) * 0.9, -1.25, 1.25) * (Math.cos(cam.yaw) >= 0 ? -1 : 1) + (s.yaw || 0);
    }
    // YOU and the rival in the crowd: their canonical busts, faded out below the collar like the crowd's
    if (art && r >= 10 && !back && (s.stripes === 'y' || s.accent)) {
      drawCanon(R, { who: s.stripes === 'y' ? 'base' : 'bear', kind: 'bust', x: p[0] + yaw * r * 0.2, y: p[1], s: r * 1.02, roll: (s.roll || 0) + cam.roll,
        face: s.face || { eyes: s.eyes || 'dot', lookY: -(s.look || 0) * 2.2 }, led, ledI: s.ledI, status: null,
        key: { x: key.x ?? 0, y: key.y ?? -0.4, col: lit, k: key.k ?? 0.6 }, rim: { ...rim, k: (rim.k ?? 1) * 0.6 }, fog, fogCol, cut: [2.2, 3.1] });
      continue;
    }
    // the painted heads (every member big enough to read)
    if (art && r >= 6 && !s.stripes && !s.accent) {
      const elev = Math.atan2(cam.y - m.h, Math.hypot(cam.x - m.x, cam.z - m.z));
      drawCrowdHead(R, p, r, back ? 'back' : elev > 0.22 ? 'high' : 'front', {
        type: m.type, led, ledI: s.ledI, eyes: s.eyes, face: s.face, look: s.look, yaw, roll: (s.roll || 0) + cam.roll, flip: m.r3 < 0.5,
        fog, fogCol, key: { col: lit, k: key.k ?? 0.6 }, rim: back ? { col: rim.col, k: (rim.k ?? 1) * 0.8 } : rim, cloth: s.shell || m.shell,
        trimK: clamp((r - 6) / 40, 0.15, 1), detail: r >= (env.detailAt ?? 36),
      });
      continue;
    }
    if (back) {
      if (r >= 3) {
        // backlight strength: strongest when the member is between camera and light
        let rimDir = 1, rimSide = 0;
        if (env.light) {
          const lx = env.light[0] - m.x, lz = env.light[1] - m.z, ll = Math.hypot(lx, lz) || 1;
          const vx = m.x - cam.x, vz = m.z - cam.z, vl = Math.hypot(vx, vz) || 1;
          const d = (lx * vx + lz * vz) / (ll * vl);
          rimDir = clamp((d - 0.55) / 0.45) ** 1.5 * 0.9 + 0.1;
          rimSide = clamp(((lx * vz - lz * vx) / (ll * vl)) * 2.5, -1, 1) * (Math.cos(cam.yaw) >= 0 ? 1 : -1);
        }
        drawHelmetBack(R, { x: p[0], y: p[1], s: r, type: m.type, shell: s.shell || m.shell, accent: s.accent, stripes: s.stripes,
          rim: env.rim, rimDir, rimSide, led: (s.ledI ?? 1) > 0.5 && r > 14 ? led : null, ledK: s.ledI ?? 1, fog, fogCol, roll: (s.roll || 0) + cam.roll });
      } else {
        b.fillStyle = rgba(fogCol); b.beginPath(); b.arc(p[0], p[1], Math.max(0.6, r), 0, 6.2832); b.fill();
        if ((s.ledI ?? 1) > 0.5) { R.g.fillStyle = rgba(led, 0.5 * (1 - fog)); R.g.fillRect(p[0] - r * 1.1, p[1], Math.max(1, r * 0.4), Math.max(1, r * 0.4)); }
      }
      continue;
    }
    if (r >= (env.detailAt ?? 36)) {
      drawHelmet(R, {
        x: p[0], y: p[1], s: r, type: m.type, shell: s.shell || m.shell, accent: s.accent || C.faint,
        face: s.face || { eyes: s.eyes || 'dot', lookY: -(s.look || 0) * 2.2 }, led, ledI: s.ledI ?? 1,
        yaw, pitch: -(s.look || 0) * 0.42, roll: (s.roll || 0) + cam.roll, body: 'bust', bodyCol: env.bodyCol || [28, 25, 42], status: s.status,
        key, rim, fog: fog * 0.9, fogCol, stripes: s.stripes,
      });
      continue;
    }
    // silhouette colour: fogged front light
    const base = [lerp(m.shell[0] * lit[0] / 255 * 1.1, fogCol[0], fog), lerp(m.shell[1] * lit[1] / 255 * 1.1, fogCol[1], fog), lerp(m.shell[2] * lit[2] / 255 * 1.1, fogCol[2], fog)];
    const col = s.shell ? [lerp(s.shell[0] * 0.8, fogCol[0], fog * 0.7), lerp(s.shell[1] * 0.8, fogCol[1], fog * 0.7), lerp(s.shell[2] * 0.8, fogCol[2], fog * 0.7)] : base;
    b.save();
    b.translate(p[0], p[1]);
    b.rotate((s.roll || 0) + cam.roll);
    b.scale(r, r);
    b.fillStyle = rgba(col);
    crowdSilhouette(b, m.type);
    b.fill();
    if (r >= 6) { R.g.save(); R.g.translate(p[0], p[1]); R.g.rotate((s.roll || 0) + cam.roll); R.g.scale(r, r); R.g.fillStyle = rgba([0, 0, 0], 1 - fog * 0.7); crowdSilhouette(R.g, m.type); R.g.fill(); R.g.restore(); }
    if (r > 5 && rim.k > 0.02) {
      b.save(); b.globalCompositeOperation = 'lighter';
      b.fillStyle = rgba(rim.col, clamp(rim.k * (1 - fog * 0.85), 0, 1) * 0.85);
      crowdRim(b, m.type, Math.max(0.09, 1 / r));
      b.restore();
    }
    // the face: the hood's dark opening with the visor inside it, matching the detailed head
    if (r > 3) {
      b.fillStyle = rgba([lerp(7, fogCol[0], fog), lerp(6, fogCol[1], fog), lerp(13, fogCol[2], fog)]);
      const k = 1 - Math.abs(yaw) * 0.3, ox = yaw * 0.4;
      const X = (x) => ox + x * k;
      const face = new Path2D();
      face.moveTo(X(0), -0.51);
      for (const [x, y] of FACE) face.lineTo(X(x), y);
      face.lineTo(X(0), 0.82);
      for (let i = FACE.length - 1; i >= 0; i--) face.lineTo(X(-FACE[i][0]), FACE[i][1]);
      face.closePath();
      b.fill(face);
      if (s.stripes === 'y') {
        // YOU's lit piping round the face (the detailed head's identifier, at crowd size)
        const ak = 1 - fog * 0.6;
        b.strokeStyle = rgba([120, 236, 255], 0.95 * ak); b.lineWidth = Math.max(0.09, 1.1 / r); b.stroke(face);
        const { g } = R;
        g.save(); g.translate(p[0], p[1]); g.rotate((s.roll || 0) + cam.roll); g.scale(r, r);
        g.strokeStyle = rgba(RGB.cyan, 0.6 * ak); g.lineWidth = Math.max(0.2, 2.6 / r); g.stroke(face);
        g.restore();
      }
    }
    b.restore();
    const eyes = s.eyes || 'dot';
    const I = (s.ledI ?? 1) * (1 - fog * 0.72) * clamp(r / 5, 0.35, 1);
    const ly = -(s.look || 0) * 0.2 * r;
    const ex = p[0] + yaw * r * 0.4;
    if (r > 6) {
      drawTinyEyes(R, ex, p[1] + r * 0.04 + ly, r * 1.26 * (1 - Math.abs(yaw) * 0.3), r * 0.54, led, eyes, I);
    } else {
      // two dots
      const { g } = R;
      const ew = Math.max(0.9, r * 0.36), eh = Math.max(0.9, r * (eyes === 'closed' ? 0.12 : 0.34));
      const c = led;
      b.fillStyle = rgba([Math.min(255, c[0] + 80), Math.min(255, c[1] + 80), Math.min(255, c[2] + 80)], I);
      b.fillRect(ex - r * 0.52, p[1] - eh / 2 + ly, ew, eh); b.fillRect(ex + r * 0.16, p[1] - eh / 2 + ly, ew, eh);
      g.fillStyle = rgba(c, I * 0.9);
      g.fillRect(ex - r * 0.6, p[1] - eh + ly, ew * 1.5, eh * 2); g.fillRect(ex + r * 0.1, p[1] - eh + ly, ew * 1.5, eh * 2);
    }
  }
  return list;
}

// God's-eye rendering (batched): members seen from high above, around a centre.
// st(m) -> { led, ledI, jump, hide, pearl, stripes }
export function drawCrowdTop(R, cam, members, st, env) {
  const { b, g } = R;
  const squash = env.squash ?? 0.78;
  const fogCol = env.fogCol || [22, 19, 42];
  const fn = env.fogNear ?? 20, ff = env.fogFar ?? 90;
  const rimCol = env.rim || RGB.cyan;
  const keyCol = env.keyCol || [230, 240, 255];
  const NB = 5;
  const bands = Array.from({ length: NB }, () => ({ sh: new Path2D(), dome: new Path2D(), key: new Path2D(), rim: new Path2D(), n: 0 }));
  const ledB = new Map(); // key -> { col, I, spill: Path2D, arc: Path2D, dot: Path2D }
  const specials = [];
  const c = cam.p(members.length ? members[0].cx : 0, 1.5, members.length ? members[0].cz : 0);
  const TAU = 6.283185307179586;
  for (const m of members) {
    const s = st(m);
    if (s.hide) continue;
    const p = cam.p(m.x, m.h + (s.jump || 0), m.z);
    if (!p) continue;
    const r = 0.26 * p[3];
    if (p[0] < -r * 4 || p[0] > 1920 + r * 4 || p[1] < -r * 4 || p[1] > 1080 + r * 4) continue;
    const fog = clamp((p[2] - fn) / (ff - fn));
    let dx = 0, dy = 0;
    if (c) { dx = c[0] - p[0]; dy = c[1] - p[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; }
    const led = s.led || RGB.text;
    const I = clamp((s.ledI ?? 1) * (1 - fog * 0.5), 0, 2);
    const Iq = Math.round(I * 4) / 4;
    const key = led.join(',') + '|' + Iq;
    let L = ledB.get(key);
    if (!L) { L = { col: led, I: Iq, spill: new Path2D(), arc: new Path2D(), dot: new Path2D() }; ledB.set(key, L); }
    if (Iq > 0.05) { const sx = p[0] + dx * r * 1.2, sy = p[1] + dy * r * 1.2; L.spill.moveTo(sx + r * 0.75, sy); L.spill.ellipse(sx, sy, r * 0.75, r * 0.75 * squash, 0, 0, TAU); }
    if (r < 1.6) { L.dot.rect(p[0] + dx * r - 0.8, p[1] + dy * r - 0.8, 1.6, 1.6); continue; }
    if (s.pearl || s.stripes) { specials.push([p, r, m, s, dx, dy, fog, L]); continue; }
    const B = bands[Math.min(NB - 1, Math.floor(fog * NB))];
    B.n++;
    const ang = Math.atan2(dy, dx);
    B.sh.moveTo(p[0] - dx * r * 0.5 + r * 1.55, p[1] - dy * r * 0.5 + r * 0.25);
    B.sh.ellipse(p[0] - dx * r * 0.5, p[1] - dy * r * 0.5 + r * 0.25, r * 1.55, r * 1.1 * squash, ang + Math.PI / 2, 0, TAU);
    if (m.type === 'bear' || m.type === 'frog' || m.type === 'cat' || m.type === 'horns') {
      for (const sg of [-1, 1]) { const ex = p[0] - dy * sg * r * 0.8 - dx * r * 0.2, ey = p[1] + dx * sg * r * 0.8 - dy * r * 0.2; B.dome.moveTo(ex + r * 0.36, ey); B.dome.arc(ex, ey, r * 0.36, 0, TAU); }
    }
    B.dome.moveTo(p[0] + r, p[1]); B.dome.ellipse(p[0], p[1], r, r * squash, 0, 0, TAU);
    const kx = p[0] + dx * r * 0.42, ky = p[1] + dy * r * 0.42 * squash;
    B.key.moveTo(kx + r * 0.55, ky); B.key.ellipse(kx, ky, r * 0.55, r * 0.55 * squash, 0, 0, TAU);
    const ra = Math.atan2(-dy, -dx);
    B.rim.moveTo(p[0] + Math.cos(ra - 1.1) * r, p[1] + Math.sin(ra - 1.1) * r * squash);
    B.rim.ellipse(p[0], p[1], r, r * squash, 0, ra - 1.1, ra + 1.1);
    L.arc.moveTo(p[0] + Math.cos(ang - 0.75) * r * 0.86, p[1] + Math.sin(ang - 0.75) * r * 0.86 * squash);
    L.arc.ellipse(p[0], p[1], r * 0.86, r * 0.86 * squash, 0, ang - 0.75, ang + 0.75);
    L.w = Math.max(L.w || 0, Math.max(1, r * 0.3));
  }
  // glow spills
  for (const L of ledB.values()) { if (L.I > 0.05) { g.fillStyle = rgba(L.col, 0.38 * Math.min(1.5, L.I)); g.fill(L.spill); } }
  // bodies per fog band
  for (let i = 0; i < NB; i++) {
    const B = bands[i]; if (!B.n) continue;
    const fog = (i + 0.5) / NB;
    b.fillStyle = rgba([lerp(14, fogCol[0], fog), lerp(13, fogCol[1], fog), lerp(24, fogCol[2], fog)]); b.fill(B.sh);
    b.fillStyle = rgba([lerp(38, fogCol[0], fog), lerp(35, fogCol[1], fog), lerp(56, fogCol[2], fog)]); b.fill(B.dome);
    b.fillStyle = rgba(keyCol, 0.3 * (1 - fog) * (env.keyK ?? 1)); b.fill(B.key);
    b.strokeStyle = rgba(rimCol, 0.45 * (1 - fog)); b.lineWidth = 1.2; b.stroke(B.rim);
  }
  // visors + dots
  for (const L of ledB.values()) {
    const hot = [lerp(L.col[0], 255, 0.35), lerp(L.col[1], 255, 0.35), lerp(L.col[2], 255, 0.35)];
    b.strokeStyle = rgba(hot, Math.min(1, L.I)); b.lineWidth = L.w || 1.5; b.stroke(L.arc);
    b.fillStyle = rgba(hot, Math.min(1, L.I) * 0.9); b.fill(L.dot);
  }
  // special players (the hero): drawn individually on top
  for (const [p, r, m, s, dx, dy, fog] of specials) {
    const led = s.led || RGB.text; const I = s.ledI ?? 1;
    b.fillStyle = rgba([14, 13, 24]); b.beginPath(); b.ellipse(p[0] - dx * r * 0.5, p[1] - dy * r * 0.5 + r * 0.25, r * 1.55, r * 1.1 * squash, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU); b.fill();
    const pearl = s.shell ? s.shell[0] > 150 : !!s.pearl;
    b.fillStyle = pearl ? 'rgb(214,212,232)' : rgba([44, 42, 60]); b.beginPath(); b.ellipse(p[0], p[1], r, r * squash, 0, 0, TAU); b.fill();
    if (!pearl && s.stripes === 'y') {
      // YOU's hood is piped in lit cyan, round the face and down the centre seam
      const ang = Math.atan2(dy, dx);
      const pip = new Path2D();
      pip.moveTo(p[0] + Math.cos(ang - 1.1) * r * 1.0, p[1] + Math.sin(ang - 1.1) * r * squash);
      pip.ellipse(p[0], p[1], r, r * squash, 0, ang - 1.1, ang + 1.1);
      pip.moveTo(p[0] + dx * r * 0.62, p[1] + dy * r * 0.62 * squash); pip.lineTo(p[0] - dx * r * 1.05, p[1] - dy * r * 1.05 * squash);
      b.strokeStyle = rgba([150, 242, 255], 1); b.lineWidth = Math.max(1.4, r * 0.17); b.stroke(pip);
      g.strokeStyle = rgba(RGB.cyan, 0.85); g.lineWidth = Math.max(3, r * 0.45); g.stroke(pip);
      // and the hood's crown catches the piping's light
      b.strokeStyle = rgba(RGB.cyan, 0.35); b.lineWidth = Math.max(1, r * 0.1);
      b.beginPath(); b.ellipse(p[0], p[1], r * 1.02, r * 1.02 * squash, 0, 0, TAU); b.stroke();
    }
    // YOU's Yochi mark on the forehead, just behind the visor, its stem toward the candle
    if (s.stripes === 'y' && r >= 5) {
      for (const [c, al] of [[b, 1], [g, 0.3]]) {
        c.save(); c.translate(p[0], p[1]); c.rotate(Math.atan2(dy, dx));
        c.translate(r * 0.36, 0); c.rotate(-Math.PI / 2); c.scale(r * 0.42 / 1.87, r * 0.3 / 1.56);
        c.fillStyle = rgba(RGB.cyan, al); logoPath(c); c.fill();
        c.restore();
      }
    }
    b.strokeStyle = rgba([lerp(led[0], 255, 0.35), lerp(led[1], 255, 0.35), lerp(led[2], 255, 0.35)], Math.min(1, I)); b.lineWidth = Math.max(1, r * 0.3);
    const ang = Math.atan2(dy, dx);
    b.beginPath(); b.ellipse(p[0], p[1], r * 0.86, r * 0.86 * squash, 0, ang - 0.75, ang + 0.75); b.stroke();
    g.fillStyle = rgba(led, 0.6 * I); g.beginPath(); g.ellipse(p[0] + dx * r * 1.2, p[1] + dy * r * 1.2, r, r * squash, 0, 0, TAU); g.fill();
  }
}
