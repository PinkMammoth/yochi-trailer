// Crowd readability: the new competitor in a crowd laid out like the film's crowd shot.
import { renderer } from '../../src/character/renderer.js';
import { rngFrom } from '../../src/core/math.js';
import { drawCaller, CAST } from './body.js';
import { drawCompetitor } from '../../src/character/index.js';
import { backdrop, label, COL } from './lib.js';

// simple pinhole camera: position, pitch (down +), fov
function cameraRig({ h = 7.4, pitch = 0.2, fov = 0.87, x = 0 }) {
  const f = 540 / Math.tan(fov / 2);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  // camera at (x, h, 0) looking toward -z, pitched down
  const project = (X, Y, Z) => {
    const dx = X - x, dy = Y - h, dz = Z;
    // rotate into camera space (pitch about x)
    const yc = dy * cp - dz * sp;      // up
    const zc = -dz * cp - dy * sp;     // forward depth
    if (zc <= 0.1) return null;
    return { sx: 960 + (dx / zc) * f, sy: 540 - (yc / zc) * f, depth: zc, scale: f / zc };
  };
  return { project, h, pitch, f, x };
}

export const CROWD = {
  async crowd(R, P, arg) {
    const { b } = R;
    const bg = b.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#07060c'); bg.addColorStop(0.35, '#0b0a16'); bg.addColorStop(1, '#171530');
    b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
    const cam = cameraRig({ h: 7.6, pitch: 0.2 });
    const rnd = rngFrom('crowd-test', 3);
    const members = [];
    for (let z = 4.2; z < 46; z += 1.45 * (1 + (z - 4) * 0.012)) {
      const span = 10 + z * 0.95;
      const step = 1.5 * (1 + (z - 4) * 0.012);
      const off = (Math.floor(z * 7) % 2) * step * 0.5;
      for (let x = -span / 2 + off; x < span / 2; x += step) {
        const jx = (rnd() - 0.5) * step * 0.4, jz = (rnd() - 0.5) * 0.5;
        const X = x + jx, Z = -(z + jz);
        const pr = cam.project(X, 0, Z);
        if (!pr || pr.sx < -200 || pr.sx > 2120) continue;
        const r = rnd();
        const call = r < 0.05 ? 0 : r < 0.57 ? 1 : -1;
        members.push({ X, Z, call, yawJ: (rnd() - 0.5) * 0.35, shellK: 0.8 + rnd() * 0.35, pose: rnd() < 0.5 ? 'neutral' : 'neutral' });
      }
    }
    members.sort((a, c) => a.Z - c.Z); // far (more negative z) first
    const fog = [20, 18, 38];
    let n = 0;
    for (const m of members) {
      const feet = cam.project(m.X, 0, m.Z);
      const depth = feet.depth;
      // yaw so each member faces the camera, plus jitter; elevation from the camera height
      const yaw = Math.atan2(m.X - cam.x, -m.Z) * -1 + m.yawJ;
      const elev = Math.atan2(cam.h - 5.6, depth) + 0.0;
      const fk = Math.min(1, Math.max(0, (depth - 8) / 40)) ** 0.9;
      const shell = COL.slate.map((v) => v * m.shellK);
      const sc = feet.scale;
      if (sc * 1.0 < 6) continue;
      drawCaller(R, {
        x: feet.sx, y: feet.sy, scale: sc, yaw, elev: elev - cam.pitch * 0.0, fov: 0.05, call: m.call,
        cast: { ...CAST.crowd, shell }, ss: sc > 60 ? 2 : 3,
        fog: fk * 0.8, fogCol: fog,
        box: [[-1.0, 3.2, -0.8], [1.0, 6.3, 0.8]],
      });
      n++;
    }
    label(R, `${n} COMPETITORS  ·  CROWD READABILITY TEST`, 60, 1040, { size: 16, col: COL.faint });
    return { stats: renderer().stats };
  },
};

// Battle Royale scale: full bodies from high above, small, as in the elimination shots.
CROWD.br = async (R) => {
  const { b, g } = R;
  const bg = b.createRadialGradient(960, 560, 50, 960, 560, 1100);
  bg.addColorStop(0, '#2a0d1c'); bg.addColorStop(1, '#07060c');
  b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
  // hex pillars (flat tops, drawn in 2D like the film)
  const hex = (cx, cy, r, col, a) => {
    // the outline goes on both layers: build the path on each context (paths are per-context)
    const path = (c) => {
      c.beginPath();
      for (let i = 0; i < 6; i++) { const t = Math.PI / 6 + i * Math.PI / 3; const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r * 0.62; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.closePath();
    };
    path(b); b.fillStyle = `rgba(${col[0] * 0.25},${col[1] * 0.12},${col[2] * 0.2},0.9)`; b.fill();
    b.strokeStyle = `rgba(${col.join(',')},${a})`; b.lineWidth = 2; b.stroke();
    path(g); g.strokeStyle = `rgba(${col.join(',')},${a * 0.5})`; g.lineWidth = 3; g.stroke();
  };
  const players = [
    [640, 380, 'deano', 'callUp', 'up', COL.green], [1250, 300, 'you', 'victory', 'up', COL.green],
    [520, 700, 'soup', 'slump', 'out', COL.red], [980, 820, 'rival', 'smug', 'smug', COL.red],
    [1450, 690, 'oxtom', 'callDown', 'down', COL.red], [860, 520, 'cope', 'ready', 'down', COL.red],
  ];
  for (const [x, y, k, pose, glyph, led] of players) hex(x, y + 6, 70, k === 'you' ? COL.cyan : [255, 90, 120], 0.8);
  for (const [x, y, k, pose, glyph, led] of players.sort((a, c) => a[1] - c[1])) {
    drawCaller(R, { x, y, scale: 34, yaw: (x - 960) / 2000, elev: 0.75, fov: 0.3, pose, cast: CAST[k], glyph, led, pick: led, ss: 3 });
  }
  label(R, 'BATTLE ROYALE SCALE  ·  FULL BODY FROM ABOVE, ~200 PX TALL', 60, 1040, { size: 16, col: COL.faint });
  return { stats: renderer().stats };
};

// ---- the same crowd with impostor sprites for everything small ---------------------------------
import { ImpostorAtlas } from '../../src/character/impostor.js';
const _atlases = {};
function crowdAtlas(cell = 120, scale = 32) {
  const key = cell + ':' + scale;
  if (_atlases[key]) return _atlases[key];
  const crests = [0, 1, 5, 6, 0, 2, 4];
  const variants = [];
  for (const fog of [0, 0.55]) for (const call of [1, -1, 0]) for (const crest of crests) variants.push({ fog, call, crest });
  const _atlas = _atlases[key] = new ImpostorAtlas({
    cell, yaws: 16, variants, scale,
    render: (R, v, yaw, x, y, scale, clip) => drawCaller(R, {
      x, y, scale, yaw, elev: 0.2, fov: 0.05, call: v.call,
      cast: { ...CAST.crowd, crest: v.crest }, ss: 2, fog: v.fog, fogCol: [20, 18, 38],
      box: [[-1.05, 3.05, -0.8], [1.05, 7.0, 0.8]], anchor: [0, 3.1, 0], clip,
    }),
  }).build();
  _atlas.variantOf = (fog, call, crest) => variants.findIndex((v) => v.fog === fog && v.call === call && v.crest === crest);
  return _atlas;
}
const CROWD_BOX = [[-1.05, 3.05, -0.8], [1.05, 7.0, 0.8]];
CROWD.crowdFast = async (R) => {
  const { b } = R;
  const t0 = performance.now();
  const atlas = crowdAtlas();
  const tBuild = performance.now() - t0;
  const bg = b.createLinearGradient(0, 0, 0, 1080);
  bg.addColorStop(0, '#07060c'); bg.addColorStop(0.35, '#0b0a16'); bg.addColorStop(1, '#171530');
  b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
  const cam = cameraRig({ h: 7.6, pitch: 0.2 });
  const rnd = rngFrom('crowd-test', 3);
  const members = [];
  const crests = [0, 1, 5, 6, 0, 2, 4];
  for (let z = 4.2; z < 70; z += 1.45 * (1 + (z - 4) * 0.012)) {
    const span = 10 + z * 0.95;
    const step = 1.5 * (1 + (z - 4) * 0.012);
    const off = (Math.floor(z * 7) % 2) * step * 0.5;
    for (let x = -span / 2 + off; x < span / 2; x += step) {
      const jx = (rnd() - 0.5) * step * 0.4, jz = (rnd() - 0.5) * 0.5;
      const X = x + jx, Z = -(z + jz);
      const pr = cam.project(X, 0, Z);
      if (!pr || pr.sx < -200 || pr.sx > 2120) continue;
      const r = rnd();
      members.push({ X, Z, call: r < 0.05 ? 0 : r < 0.57 ? 1 : -1, yawJ: (rnd() - 0.5) * 0.35, crest: crests[(rnd() * crests.length) | 0] });
    }
  }
  members.sort((a, c) => a.Z - c.Z);
  let nSprite = 0, nLive = 0;
  const t1 = performance.now();
  for (const m of members) {
    const feet = cam.project(m.X, 0, m.Z);
    const yaw = -Math.atan2(m.X - cam.x, -m.Z) + m.yawJ;
    const sc = feet.scale;
    if (sc < 1.2) continue;
    const fk = Math.min(1, Math.max(0, (feet.depth - 8) / 40)) ** 0.9;
    if (sc > 48) {
      // foreground: live raymarch
      drawCaller(R, { x: feet.sx, y: feet.sy, scale: sc, yaw, elev: Math.atan2(cam.h - 5.6, feet.depth), fov: 0.05, call: m.call,
        cast: { ...CAST.crowd, crest: m.crest }, ss: 2, fog: fk * 0.8, fogCol: [20, 18, 38], box: [[-1.05, 3.05, -0.8], [1.05, 7.0, 0.8]] });
      nLive++;
    } else {
      const anchor = cam.project(m.X, 3.1, m.Z);
      const fogSet = fk > 0.3 ? 0.55 : 0;
      atlas.draw(R, atlas.variantOf(fogSet, m.call, m.crest), yaw, anchor.sx, anchor.sy, sc, 1);
      nSprite++;
    }
  }
  const tDraw = performance.now() - t1;
  label(R, `${nSprite} IMPOSTORS + ${nLive} LIVE  ·  ATLAS ${(tBuild / 1000).toFixed(1)} s ONCE  ·  FRAME ${(tDraw / 1000).toFixed(1)} s`, 60, 1040, { size: 16, col: COL.faint });
  return { stats: renderer().stats, tBuild, tDraw };
};

// Style frame: YOU in front of the crowd (the film's key image). Distant members are impostors from a
// 256 px atlas; the nearest rows and the hero are raymarched live, each seen from the real camera.
CROWD.styleframe = async (R, P) => {
  const { b, g } = R;
  const atlas = crowdAtlas(256, 70);
  const bg = b.createLinearGradient(0, 0, 0, 1080);
  bg.addColorStop(0, '#06050b'); bg.addColorStop(0.42, '#0b0a17'); bg.addColorStop(1, '#131128');
  b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
  const cam = cameraRig({ h: 7.2, pitch: 0.16, fov: 0.7 });
  const view = (X, Y, Z) => {
    const p = cam.project(X, Y, Z);
    return p && { ...p, elev: Math.atan2(cam.h - Y, p.depth), yaw: -Math.atan2(X - cam.x, -Z) };
  };
  const rnd = rngFrom('style', 11);
  const crests = [0, 1, 5, 6, 0, 2, 4, 0];
  const members = [];
  for (let z = 10.5; z < 90; z += 1.4 * (1 + (z - 10) * 0.012)) {
    const span = 16 + z * 0.9, step = 1.5 * (1 + (z - 10) * 0.012);
    const off = (Math.floor(z * 7) % 2) * step * 0.5;
    for (let x = -span / 2 + off; x < span / 2; x += step) {
      const X = x + (rnd() - 0.5) * step * 0.4, Z = -(z + (rnd() - 0.5) * 0.5);
      const r = rnd();
      members.push({ X, Z, call: r < 0.04 ? 0 : r < 0.5 ? 1 : -1, yawJ: (rnd() - 0.5) * 0.4, crest: crests[(rnd() * crests.length) | 0] });
    }
  }
  members.sort((a, c) => a.Z - c.Z);
  let nLive = 0, nSprite = 0;
  for (const m of members) {
    const feet = cam.project(m.X, 0, m.Z);
    if (!feet || feet.sx < -160 || feet.sx > 2080 || feet.scale < 1.2) continue;
    const fk = Math.min(1, Math.max(0, (feet.depth - 12) / 50)) ** 0.8;
    if (feet.scale > 72) {
      const v = view(m.X, 4.48, m.Z);
      drawCompetitor(R, { x: v.sx, y: v.sy, scale: v.scale, anchor: 'chest', yaw: v.yaw + m.yawJ, elev: v.elev, fov: 0.7, call: m.call,
        cast: { ...CAST.crowd, crest: m.crest }, ss: 2, fog: fk * 0.8, fogCol: [20, 18, 38], clip: [-40, -40, 1960, 1120] });
      nLive++;
    } else {
      const anchor = cam.project(m.X, 3.1, m.Z);
      atlas.draw(R, atlas.variantOf(fk > 0.3 ? 0.55 : 0, m.call, m.crest), -Math.atan2(m.X - cam.x, -m.Z) + m.yawJ, anchor.sx, anchor.sy, feet.scale, 1);
      nSprite++;
    }
  }
  // a pool of cyan light where YOU stands, and the strike line through it
  const HX = 0.5, HZ = -6.6;
  const hp = cam.project(HX, 0, HZ);
  const fg = b.createRadialGradient(hp.sx, hp.sy, 5, hp.sx, hp.sy, 560);
  fg.addColorStop(0, 'rgba(24,224,255,0.2)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
  b.save(); b.translate(hp.sx, hp.sy); b.scale(1, 0.22); b.translate(-hp.sx, -hp.sy); b.fillStyle = fg; b.fillRect(0, 0, 1920, 2400); b.restore();
  const hv = view(HX, 4.48, HZ);
  drawCompetitor(R, {
    x: hv.sx, y: hv.sy, scale: hv.scale, anchor: 'chest', yaw: hv.yaw + 0.3, elev: hv.elev, fov: 0.7, pose: 'neutral', cast: CAST.you, call: 1, ss: 2,
    clip: [-40, -40, 1960, 1120],
    lights: {
      key: { x: -0.55, y: -0.6, z: 0.55, col: [205, 228, 255], k: 1.05 },
      rim: { x: 0.85, y: -0.45, z: -0.55, col: [24, 224, 255], k: 1.2 },
      rim2: { x: -0.9, y: 0.1, z: -0.5, col: [57, 255, 20], k: 0.35 },
      fill: { x: 0, y: 1, z: 0.4, col: [20, 70, 80], k: 1 }, amb: [16, 14, 30],
    },
  });
  P.vignette = 0.65;
  return { stats: renderer().stats, nLive, nSprite };
};
