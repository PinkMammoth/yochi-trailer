// Helmet silhouette variants: the dome reads as a circle in silhouette. Try cut corners.
import { renderer } from '../../src/character/renderer.js';
import { face } from '../../src/character/face.js';
import { HEAD_BUST, HEAD_BOX } from '../../src/character/head.glsl.js';
import { label, COL, LIGHT } from './lib.js';

// replace the profile block (frontProf .. outerShell) of the head model
function variant(code) {
  const a = HEAD_BUST.indexOf('float frontProf(vec2 p) {');
  const b = HEAD_BUST.indexOf('// seam between hood and lower section');
  return HEAD_BUST.slice(0, a) + code + '\n' + HEAD_BUST.slice(b);
}
// the helmet as it was before this pass: an egg from the front
const ROUND = variant(/* glsl */ `
float frontProf(vec2 p) {
  vec2 q = vec2(abs(p.x), p.y);
  float e = ell2(p - vec2(0.0, 0.05), vec2(0.39, 0.45));
  float side = q.x - 0.372;
  float jaw = dot(q - vec2(0.372, 0.02), normalize(vec2(0.90, -0.44)));
  float chin = -0.47 - p.y;
  return smax(smax(smax(e, side, 0.08), jaw, 0.09), chin, 0.07);
}
float sideProf(vec2 p) { // p = (z, y)
  float e = ell2(p - vec2(-0.075, 0.035), vec2(0.505, 0.47));
  float face = dot(p - vec2(0.40, 0.02), normalize(vec2(1.0, 0.26)));
  float jaw = dot(p - vec2(0.30, -0.465), normalize(vec2(-0.2, -0.98)));
  return smax(smax(e, face, 0.06), jaw, 0.04);
}
float outerShell(vec3 p) {
  float d = smax(frontProf(p.xy), sideProf(p.zy), 0.04);
  float cran = sdEllipsoid(p - vec3(0.0, 0.035, 0.0), vec3(0.395, 0.465, 0.44));
  float tail = sdRoundCone(p, vec3(0.0, 0.06, -0.08), vec3(0.0, -0.09, -0.47), 0.345, 0.12);
  float vol = smin(cran, tail, 0.14);
  vol = smax(vol, abs(p.x) - 0.378, 0.1);
  return smax(d, vol, 0.04);
}
`);

// B: chamfered crown shoulders at 30 degrees from vertical, straight flanks, crisp jaw, narrow chin
const CUT = variant(/* glsl */ `
float frontProf(vec2 p) {
  vec2 q = vec2(abs(p.x), p.y);
  float e = ell2(p - vec2(0.0, 0.02), vec2(0.41, 0.49));
  float side = q.x - 0.368;
  float sh = dot(q - vec2(0.272, 0.322), vec2(0.866, 0.5));
  float jaw = dot(q - vec2(0.368, -0.04), normalize(vec2(0.85, -0.53)));
  float chin = -0.47 - p.y;
  float d = smax(e, side, 0.025);
  d = smax(d, sh, 0.022);
  d = smax(d, jaw, 0.03);
  return smax(d, chin, 0.05);
}
float sideProf(vec2 p) { // p = (z, y)
  float e = ell2(p - vec2(-0.075, 0.035), vec2(0.505, 0.47));
  float face = dot(p - vec2(0.40, 0.02), normalize(vec2(1.0, 0.26)));
  float jaw = dot(p - vec2(0.30, -0.465), normalize(vec2(-0.2, -0.98)));
  return smax(smax(e, face, 0.05), jaw, 0.04);
}
float outerShell(vec3 p) {
  float d = smax(frontProf(p.xy), sideProf(p.zy), 0.035);
  float box = sdRoundBox(p - vec3(0.0, 0.02, -0.06), vec3(0.4, 0.5, 0.52), 0.2);
  float tail = sdRoundCone(p, vec3(0.0, 0.06, -0.08), vec3(0.0, -0.09, -0.47), 0.345, 0.12);
  return smax(d, smin(box, tail, 0.1), 0.03);
}
`);

// C: B plus side chamfers: a raked cut over the back of the crown, a chin cut, a brow edge
const CUT_SIDE = variant(/* glsl */ `
float frontProf(vec2 p) {
  vec2 q = vec2(abs(p.x), p.y);
  float e = ell2(p - vec2(0.0, 0.02), vec2(0.41, 0.49));
  float side = q.x - 0.368;
  float sh = dot(q - vec2(0.272, 0.322), vec2(0.866, 0.5));
  float jaw = dot(q - vec2(0.368, -0.04), normalize(vec2(0.85, -0.53)));
  float chin = -0.47 - p.y;
  float d = smax(e, side, 0.025);
  d = smax(d, sh, 0.022);
  d = smax(d, jaw, 0.03);
  return smax(d, chin, 0.05);
}
float sideProf(vec2 p) { // p = (z, y)
  float e = ell2(p - vec2(-0.06, 0.035), vec2(0.52, 0.475));
  float face = dot(p - vec2(0.40, 0.02), normalize(vec2(1.0, 0.24)));
  float brow = dot(p - vec2(0.36, 0.33), normalize(vec2(0.62, 0.78)));
  float back = dot(p - vec2(-0.36, 0.34), normalize(vec2(-0.5, 0.866)));
  float nape = dot(p - vec2(-0.5, -0.1), normalize(vec2(-0.98, -0.2)));
  float jaw = dot(p - vec2(0.30, -0.465), normalize(vec2(-0.2, -0.98)));
  float d = smax(e, face, 0.04);
  d = smax(d, brow, 0.025);
  d = smax(d, back, 0.03);
  d = smax(d, nape, 0.04);
  return smax(d, jaw, 0.035);
}
float outerShell(vec3 p) {
  float d = smax(frontProf(p.xy), sideProf(p.zy), 0.035);
  float box = sdRoundBox(p - vec3(0.0, 0.02, -0.06), vec3(0.4, 0.5, 0.54), 0.2);
  float tail = sdRoundCone(p, vec3(0.0, 0.06, -0.08), vec3(0.0, -0.08, -0.49), 0.35, 0.13);
  return smax(d, smin(box, tail, 0.1), 0.03);
}
`);

// D: C, taller and narrower (an elongated gem)
const TALL = variant(/* glsl */ `
float frontProf(vec2 p) {
  vec2 q = vec2(abs(p.x), p.y);
  float e = ell2(p - vec2(0.0, 0.03), vec2(0.385, 0.52));
  float side = q.x - 0.345;
  float sh = dot(q - vec2(0.248, 0.352), vec2(0.866, 0.5));
  float jaw = dot(q - vec2(0.345, -0.06), normalize(vec2(0.87, -0.49)));
  float chin = -0.49 - p.y;
  float d = smax(e, side, 0.025);
  d = smax(d, sh, 0.022);
  d = smax(d, jaw, 0.03);
  return smax(d, chin, 0.05);
}
float sideProf(vec2 p) { // p = (z, y)
  float e = ell2(p - vec2(-0.06, 0.04), vec2(0.52, 0.5));
  float face = dot(p - vec2(0.40, 0.02), normalize(vec2(1.0, 0.24)));
  float brow = dot(p - vec2(0.36, 0.35), normalize(vec2(0.62, 0.78)));
  float back = dot(p - vec2(-0.36, 0.37), normalize(vec2(-0.5, 0.866)));
  float nape = dot(p - vec2(-0.5, -0.1), normalize(vec2(-0.98, -0.2)));
  float jaw = dot(p - vec2(0.30, -0.485), normalize(vec2(-0.2, -0.98)));
  float d = smax(e, face, 0.04);
  d = smax(d, brow, 0.025);
  d = smax(d, back, 0.03);
  d = smax(d, nape, 0.04);
  return smax(d, jaw, 0.035);
}
float outerShell(vec3 p) {
  float d = smax(frontProf(p.xy), sideProf(p.zy), 0.035);
  float box = sdRoundBox(p - vec3(0.0, 0.03, -0.06), vec3(0.38, 0.53, 0.54), 0.2);
  float tail = sdRoundCone(p, vec3(0.0, 0.06, -0.08), vec3(0.0, -0.08, -0.49), 0.34, 0.13);
  return smax(d, smin(box, tail, 0.1), 0.03);
}
`);

// E: GEM = TALL's front (scaled to ~1.0 tall) + the side chamfers + a cranium that only rounds the back
export const GEM_PROFILES = /* glsl */ `
float frontProf(vec2 p) {
  vec2 q = vec2(abs(p.x), p.y);
  float e = ell2(p - vec2(0.0, 0.029), vec2(0.37, 0.5));
  float side = q.x - 0.331;
  float sh = dot(q - vec2(0.238, 0.338), vec2(0.866, 0.5));
  float jaw = dot(q - vec2(0.331, -0.058), normalize(vec2(0.87, -0.49)));
  float chin = -0.47 - p.y;
  float d = smax(e, side, 0.024);
  d = smax(d, sh, 0.02);
  d = smax(d, jaw, 0.028);
  return smax(d, chin, 0.045);
}
float sideProf(vec2 p) { // p = (z, y)
  float e = ell2(p - vec2(-0.06, 0.035), vec2(0.5, 0.48));
  float face = dot(p - vec2(0.385, 0.02), normalize(vec2(1.0, 0.24)));
  float brow = dot(p - vec2(0.345, 0.32), normalize(vec2(0.62, 0.78)));
  float back = dot(p - vec2(-0.33, 0.33), normalize(vec2(-0.5, 0.866)));
  float jaw = dot(p - vec2(0.29, -0.455), normalize(vec2(-0.2, -0.98)));
  float d = smax(e, face, 0.04);
  d = smax(d, brow, 0.024);
  d = smax(d, back, 0.03);
  return smax(d, jaw, 0.035);
}
float outerShell(vec3 p) {
  float d = smax(frontProf(p.xy), sideProf(p.zy), 0.03);
  // the cranium only rounds the back (it is wider and taller than the front profile)
  float cran = sdEllipsoid(p - vec3(0.0, 0.03, -0.01), vec3(0.47, 0.58, 0.43));
  float tail = sdRoundCone(p, vec3(0.0, 0.05, -0.08), vec3(0.0, -0.08, -0.46), 0.33, 0.12);
  return smax(d, smin(cran, tail, 0.12), 0.035);
}
`;
const GEM = variant(GEM_PROFILES);

// F: REVOLVED GEM. The gem profile revolved around an elliptical plan, so the crown chamfer and the
// jaw taper run all the way round: every view has the cut-gem silhouette, not just front and back.
const REV = (tail) => variant(/* glsl */ `
float frontProf(vec2 p) {
  vec2 q = vec2(abs(p.x), p.y);
  float e = ell2(p - vec2(0.0, 0.029), vec2(0.37, 0.5));
  float side = q.x - 0.331;
  float sh = dot(q - vec2(0.238, 0.338), vec2(0.866, 0.5));
  float jaw = dot(q - vec2(0.331, -0.058), normalize(vec2(0.87, -0.49)));
  float chin = -0.47 - p.y;
  float d = smax(e, side, 0.024);
  d = smax(d, sh, 0.02);
  d = smax(d, jaw, 0.028);
  return smax(d, chin, 0.045);
}
float sideProf(vec2 p) { // p = (z, y)
  float face = dot(p - vec2(0.385, 0.02), normalize(vec2(1.0, 0.24)));
  float brow = dot(p - vec2(0.345, 0.32), normalize(vec2(0.62, 0.78)));
  float back = dot(p - vec2(-0.37, 0.36), normalize(vec2(-0.5, 0.866)));
  float jaw = dot(p - vec2(0.29, -0.455), normalize(vec2(-0.2, -0.98)));
  float d = smax(face, brow, 0.024);
  d = smax(d, back, 0.035);
  return smax(d, jaw, 0.035);
}
float outerShell(vec3 p) {
  // plan: an ellipse 0.331 wide, 0.45 deep; the front profile revolves around it
  float k = 0.331 / 0.45;
  float rho = length(vec2(p.x, (p.z + 0.03) * k));
  float gem = frontProf(vec2(rho, p.y)) * (0.5 + 0.5 * k);
  float d = smax(gem, sideProf(p.zy), 0.03);
  ${tail ? 'd = smin(d, max(sdRoundCone(p, vec3(0.0, 0.02, -0.2), vec3(0.0, -0.1, -0.5), 0.2, 0.1), sideProf(p.zy)), 0.08);' : ''}
  return d;
}
`);
const REVGEM = REV(false);
const REVGEM_TAIL = REV(true);

const FINAL = HEAD_BUST; // the revolved gem, as adopted in src/character/head.glsl.js
export const VARIANTS = { 'ROUND (BEFORE)': ROUND, 'GEM, FRONT ONLY': GEM, 'REVOLVED GEM (FINAL)': FINAL, 'WITH DUCKTAIL': REVGEM_TAIL };

export const SILVARIANTS = {
  async silvariants(R) {
    const { b } = R;
    const bg = b.createRadialGradient(960, 540, 30, 960, 540, 1200);
    bg.addColorStop(0, '#1a1830'); bg.addColorStop(1, '#07060c');
    b.fillStyle = bg; b.fillRect(0, 0, 1920, 1080);
    const names = Object.keys(VARIANTS);
    const box = [[-0.48, -0.8, -0.7], [0.48, 0.62, 0.52]];
    names.forEach((n, i) => {
      const y = 140 + i * 250;
      label(R, n, 40, y - 114, { size: 16, col: n.includes('FINAL') ? COL.cyan : COL.text, track: 4 });
      const views = [0, 0.62, Math.PI / 2, 2.6];
      views.forEach((yaw, k) => {
        renderer().draw(R, { model: VARIANTS[n], box, anchor: [0, 0, 0], x: 180 + k * 250, y, scale: 190, yaw, elev: 0.04, fov: 0.15, ss: 2,
          lights: LIGHT.studio, shell: COL.pearl, accent: COL.cyan, suit: [22, 21, 32], face: face('up', COL.green), pick: COL.green });
      });
      [0, 0.62, Math.PI / 2].forEach((yaw, k) => {
        renderer().draw(R, { model: VARIANTS[n], box, anchor: [0, 0, 0], x: 1170 + k * 175, y, scale: 160, yaw, elev: 0.0, fov: 0.1, ss: 2, defines: '#define SILHOUETTE' });
      });
      // crowd scale
      for (let k = 0; k < 5; k++) {
        renderer().draw(R, { model: VARIANTS[n], box, anchor: [0, 0, 0], x: 1690 + k * 48, y: y - 30 + (k % 2) * 40, scale: 38, yaw: (k - 3) * 0.25, elev: 0.1, fov: 0.1, ss: 3,
          lights: LIGHT.studio, shell: COL.slate, accent: [150, 144, 190], accentI: 0.35, suit: [22, 21, 32], face: face(k % 3 ? 'up' : 'down', k % 3 ? COL.green : COL.red), pick: k % 3 ? COL.green : COL.red });
      }
    });
    return { stats: renderer().stats };
  },
};
