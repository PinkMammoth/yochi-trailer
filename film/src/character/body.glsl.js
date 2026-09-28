// The Yochi competitor's body: the helmet on an articulated, layered figure ~6.1 helmet-heights tall.
// Visual hierarchy: the helmet (the star) > lacquer Y-harness, pauldrons, collar and boot caps >
// dark satin suit with dark-lacquer tonal panels > gunmetal trim (neck seal, belt, soles, cuffs).
// The Y of the logo is structural: the harness straps rise from a hex knot at 30 degrees to the
// pauldrons (the Y's arms) and a single strap drops to the belt (the stem); a Y-back mirrors it.
// The knot's core shows the pick. Each part is evaluated in its bone's frame (uBone[i], see rig.js).
import { HEAD } from './head.glsl.js';

export const BODY = HEAD + /* glsl */ `
#define MAT_PANEL 8.0
uniform mat4 uBone[19];
uniform vec2 uFist;    // curl of the left / right hand (0 open .. 1 fist)
uniform vec2 uPoint;   // left / right index finger extended
uniform float uKnotI;  // brightness of the harness knot (the pick, worn on the chest)
uniform vec3 uHeadC;   // head centre (model space), for bounds
uniform vec3 uLimbA[4], uLimbM[4], uLimbB[4]; // bounding capsules (root-joint-end): arm L, arm R, leg L, leg R
#define BP(i, p) ((uBone[i] * vec4(p, 1.0)).xyz)
#define HEAD_OFS 0.5

// ---- torso ------------------------------------------------------------------------------------
float chestCore(vec3 pc) {
  vec3 q = vec3(abs(pc.x), pc.y, pc.z);
  float rib = sdEllipsoid(pc - vec3(0.0, 0.22, -0.015), vec3(0.42, 0.50, 0.25));
  float pec = sdEllipsoid(q - vec3(0.18, 0.33, 0.06), vec3(0.22, 0.19, 0.17));
  float trap = sdCapsule(q, vec3(0.1, 0.76, -0.06), vec3(0.44, 0.61, -0.04), 0.11);
  float lat = sdEllipsoid(q - vec3(0.29, 0.18, -0.06), vec3(0.16, 0.3, 0.17));
  return smin(smin(smin(rib, pec, 0.1), trap, 0.14), lat, 0.1);
}
float absCore(vec3 ps) { return sdEllipsoid(ps - vec3(0.0, 0.12, 0.0), vec3(0.3, 0.44, 0.2)); }
float pelvisCore(vec3 pp) {
  vec3 q = vec3(abs(pp.x), pp.y, pp.z);
  float hip = sdEllipsoid(pp - vec3(0.0, 0.0, -0.01), vec3(0.35, 0.3, 0.22));
  float glute = sdEllipsoid(q - vec3(0.13, -0.06, -0.08), vec3(0.175, 0.21, 0.165));
  return smin(hip, glute, 0.08);
}
// Y-harness, laid out in chest space (x, y); front and back differ.
// Front: straps from the shoulder caps down at 30 degrees to a hex knot, a single strap to the belt.
// Back: a Y-back, straps over the shoulders to a knot between the shoulder blades, one strap down.
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
const vec2 KNOT_F = vec2(0.0, 0.34);
const vec2 KNOT_B = vec2(0.0, 0.44);
// signed distance to the harness centre-lines in the chest plane, plus which strap (for the inlay)
float harness2D(vec3 pc) {
  vec2 q = vec2(abs(pc.x), pc.y);
  // straps run from the knot up at ~30 degrees and end under the pauldrons (their anchors)
  if (pc.z > -0.04) return min(segD(q, KNOT_F, vec2(0.53, 0.63)), segD(q, KNOT_F, vec2(0.0, -1.2)));
  return min(segD(q, KNOT_B, vec2(0.5, 0.67)), segD(q, KNOT_B, vec2(0.0, -1.2)));
}
float sdHex(vec2 p, float r) { const vec3 k = vec3(-0.866025404, 0.5, 0.577350269); p = abs(p); p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy; p -= vec2(clamp(p.x, -k.z * r, k.z * r), r); return length(p) * sign(p.y); }

// ---- limbs ------------------------------------------------------------------------------------
float deltoid(vec3 pu) { return sdEllipsoid(pu - vec3(0.0, -0.1, -0.005), vec3(0.15, 0.2, 0.158)); }
float upperArm(vec3 pu) {
  float upper = sdRoundCone(pu, vec3(0.0, -0.08, 0.0), vec3(0.0, -0.96, 0.0), 0.122, 0.09);
  float bic = sdEllipsoid(pu - vec3(0.0, -0.42, 0.02), vec3(0.118, 0.3, 0.125));
  return smin(smin(deltoid(pu), upper, 0.06), bic, 0.06);
}
float foreArm(vec3 pf) {
  float fore = sdRoundCone(pf, vec3(0.0, 0.0, 0.0), vec3(0.0, -0.84, 0.0), 0.098, 0.066);
  float mus = sdEllipsoid(pf - vec3(0.0, -0.22, 0.0), vec3(0.106, 0.26, 0.1));
  return smin(fore, mus, 0.06);
}
float handSDF(vec3 ph, float side, float fist, float point) {
  float palm = sdRoundBox(ph - vec3(0.0, -0.12, 0.005), vec3(0.03, 0.095, 0.066), 0.026);
  vec3 fo = rotZ(side * 0.18) * (ph - vec3(-side * 0.012, -0.29, 0.005));
  float fingersOpen = sdRoundBox(fo, vec3(0.024, 0.1, 0.06), 0.022);
  float fingersFist = sdRoundBox(ph - vec3(-side * 0.035, -0.22, 0.005), vec3(0.045, 0.06, 0.064), 0.035);
  float fingers = mix(fingersOpen, fingersFist, fist);
  float thumb = sdCapsule(ph, vec3(-side * 0.015, -0.06, 0.06), vec3(-side * mix(0.02, 0.05, fist), -0.17, mix(0.1, 0.075, fist)), 0.024);
  float d = smin(smin(palm, fingers, 0.02), thumb, 0.015);
  if (point > 0.01) d = min(d, sdCapsule(ph, vec3(0.0, -0.2, 0.05), vec3(0.0, -0.2 - 0.24 * point, 0.05), 0.021));
  return d;
}
float thighSDF(vec3 pt, float side) {
  float th = sdRoundCone(pt, vec3(0.0, -0.02, 0.0), vec3(0.0, -1.40, 0.01), 0.188, 0.122);
  float quad = sdEllipsoid(pt - vec3(side * 0.01, -0.52, 0.045), vec3(0.17, 0.52, 0.165));
  return smin(th, quad, 0.08);
}
float shinSDF(vec3 pn) {
  float knee = sdEllipsoid(pn - vec3(0.0, 0.0, 0.03), vec3(0.115, 0.12, 0.115));
  float sh = sdRoundCone(pn, vec3(0.0, -0.02, 0.0), vec3(0.0, -1.34, -0.01), 0.12, 0.075);
  float calf = sdEllipsoid(pn - vec3(0.0, -0.42, -0.045), vec3(0.128, 0.37, 0.135));
  return smin(smin(sh, calf, 0.1), knee, 0.05);
}
// sneaker upper (above the midsole)
float bootSDF(vec3 pf) {
  float b = sdRoundBox(pf - vec3(0.0, -0.085, 0.15), vec3(0.088, 0.1, 0.29), 0.08);
  b = smax(b, dot(pf - vec3(0.0, -0.04, 0.38), normalize(vec3(0.0, 1.0, 0.75))), 0.06);
  float ank = sdRoundCone(pf, vec3(0.0, 0.14, -0.01), vec3(0.0, -0.1, 0.0), 0.082, 0.1);
  return smin(b, ank, 0.07);
}
// midsole: wider and longer than the upper, flat on the floor
float soleSDF(vec3 pf) {
  float s = sdRoundBox(pf - vec3(0.0, -0.188, 0.155), vec3(0.102, 0.034, 0.325), 0.03);
  return smax(s, dot(pf - vec3(0.0, -0.17, 0.45), normalize(vec3(0.0, 0.5, 1.0))), 0.03);
}



#define ARM(S, IU, IF, IH, SIDE, FIST, POINT) { \
  float ab = min(sdCapsule(p, uLimbA[S], uLimbM[S], 0.28), sdCapsule(p, uLimbM[S], uLimbB[S], 0.26)); \
  if (ab > 0.05) { suit = min(suit, ab); } else { \
    vec3 pu = BP(IU, p), pf = BP(IF, p), ph = BP(IH, p); \
    float ua = upperArm(pu), fa = foreArm(pf); \
    suit = min(suit, smin(smin(ua, fa, 0.04), chest, 0.03)); \
    vec3 pq = pu - vec3((SIDE) * 0.01, -0.05, -0.005); \
    float pa = sdEllipsoid(pq, vec3(0.2, 0.215, 0.195)); \
    pa = smax(pa, pq.y - 0.13, 0.02); \
    pa = smax(pa, dot(vec2((SIDE) * pq.x, pq.y) - vec2(0.115, 0.13), vec2(0.866, 0.5)), 0.016); \
    pa = smax(pa, (SIDE) * pq.x - 0.175, 0.02); \
    pa = max(pa, -(pu.y + 0.18 - 0.5 * abs(pu.z))); \
    shell = min(shell, pa); \
    float vam = max(fa - 0.013, max(max(-0.7 - pf.y, pf.y + 0.16), -(pf.x * (SIDE)) - 0.02)); \
    panel = min(panel, vam); \
    trim = min(trim, max(fa - 0.009, abs(pf.y + 0.78) - 0.035)); \
    panel = min(panel, handSDF(ph, SIDE, FIST, POINT)); } }

#define LEG(S, IT, IK, IF, SIDE) { \
  float lb = min(sdCapsule(p, uLimbA[S], uLimbM[S], 0.34), sdCapsule(p, uLimbM[S], uLimbB[S], 0.36)); \
  if (lb > 0.05) { suit = min(suit, lb); } else { \
    vec3 pt = BP(IT, p), pk = BP(IK, p), pf = BP(IF, p); \
    float th = thighSDF(pt, SIDE), sn = shinSDF(pk); \
    suit = min(suit, smin(smin(th, sn, 0.05), torso, 0.06)); \
    float tp = max(th - 0.012, max(max(-1.18 - pt.y, pt.y + 0.3), -(pt.x * (SIDE)) + 0.03)); \
    float kp = max(sdEllipsoid(pk - vec3(0.0, 0.0, 0.04), vec3(0.122, 0.13, 0.122)), -pk.z + 0.03); \
    float gp = max(sn - 0.012, max(max(-1.16 - pk.y, pk.y + 0.2), -pk.z + 0.02)); \
    panel = min(panel, min(min(tp, kp), gp)); \
    float boot = bootSDF(pf); \
    float upper = max(boot, -(pf.y + 0.15)); \
    shell = min(shell, max(upper, -(pf.z - 0.06))); \
    trim = min(trim, min(soleSDF(pf), max(upper, pf.z - 0.06))); } }

vec2 map(vec3 p) {
  vec2 r = vec2(1e9, MAT_SUIT);
  // head first: often the whole answer near the top (crests reach further)
  float hr = uCrest < 0.5 ? 0.64 : (uCrest > 2.5 && uCrest < 3.5 ? 1.04 : 0.82);
  float hb = length(p - uHeadC) - hr;
  if (hb < 0.06) {
    vec2 h = headSDF(BP(4, p) - vec3(0.0, HEAD_OFS, 0.0));
    r = h;
  } else r = vec2(hb, MAT_SHELL);

  vec3 pp = BP(0, p), ps = BP(1, p), pc = BP(2, p);
  float chest = chestCore(pc);
  float torso = smin(smin(chest, absCore(ps), 0.2), pelvisCore(pp), 0.18);
  vec3 pn = BP(3, p);
  float neck = sdRoundCone(pn, vec3(0.0, -0.04, -0.005), vec3(0.0, 0.16, 0.02), 0.164, 0.15);
  float suit = torso;
  float panel = 1e9, shell = 1e9, trim = neck;

  // arms and legs, unrolled (constant bone indices: dynamic uniform indexing is slow in software GL)
  ARM(0, 7, 9, 11, 1.0, uFist.x, uPoint.x)
  ARM(1, 8, 10, 12, -1.0, uFist.y, uPoint.y)
  LEG(2, 13, 15, 17, 1.0)
  LEG(3, 14, 16, 18, -1.0)
  // the Y-harness: pearl straps over the suit, a hex knot at the junction
  float strap = max(torso - 0.017, harness2D(pc) - 0.036);
  strap = max(strap, pp.y - 0.5 < 0.0 ? 0.3 - pp.y : -1.0);
  shell = min(shell, strap);
  vec2 kn = pc.z > -0.04 ? pc.xy - KNOT_F : pc.xy - KNOT_B;
  float knot = max(torso - 0.03, sdHex(kn.yx, 0.066));
  trim = min(trim, knot);
  // gorget collar and belt
  // mock-neck collar: a tapered ring, its top edge dipping toward the front
  vec3 pg = pc - vec3(0.0, 0.8, -0.045);
  float ring = sdRoundCone(pg, vec3(0.0, -0.05, 0.0), vec3(0.0, 0.15, 0.0), 0.22, 0.186);
  float gorget = max(ring, -sdCylinderY(pg, 0.168, 0.4));
  gorget = smax(gorget, dot(pg - vec3(0.0, 0.17, 0.0), normalize(vec3(0.0, 1.0, 0.4))), 0.01);
  trim = min(trim, gorget);
  float belt = max(torso - 0.014, abs(pp.y - 0.27) - 0.034);
  trim = min(trim, belt);

  if (suit < r.x) r = vec2(suit, MAT_SUIT);
  if (panel < r.x) r = vec2(panel, MAT_PANEL);
  if (shell < r.x) r = vec2(shell, MAT_SHELL);
  if (trim < r.x) r = vec2(trim, MAT_TRIM);
  return r;
}

void surface(inout Surf s) {
  vec3 p = s.p;
  if (length(p - uHeadC) < 1.1) {
    vec3 ph = BP(4, p) - vec3(0.0, HEAD_OFS, 0.0);
    vec2 hh = headSDF(ph);
    if (hh.x < 0.004 + s.px * 2.0) { s.mat = hh.y; headSurface(s, ph); return; }
  }
  vec3 pc = BP(2, p), ps = BP(1, p), pp = BP(0, p);
  if (s.mat == MAT_SHELL) { s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0; }
  else if (s.mat == MAT_TRIM) { s.alb = uTrim; s.gloss = 0.7; s.sharp = 0.6; }
  else if (s.mat == MAT_PANEL) { s.alb = uSuit * 1.35; s.gloss = 0.8; s.sharp = 1.0; s.edgeK = 0.08; }
  else { s.alb = uSuit; s.gloss = 0.3; s.sharp = 0.0; s.rimK = 0.55; }
  float isSuit = step(abs(s.mat - MAT_SUIT), 0.5);
  vec3 pnk = BP(3, p);
  if (s.mat == MAT_TRIM && length(pnk.xz) < 0.2 && pnk.y > -0.1 && pnk.y < 0.3) {
    float rib = abs(fract(pnk.y / 0.045) - 0.5) * 0.045;
    s.line = smoothstep(0.006 + s.px, 0.006 - s.px, rib) * 0.55;
  }
  float isTrim = step(abs(s.mat - MAT_TRIM), 0.5);
  // the double stroke inlaid along every strap; the knot's core
  float hd = harness2D(pc);
  float onStrap = step(abs(s.mat - MAT_SHELL), 0.5) * step(hd, 0.036) * step(0.3, pp.y) * step(length(p - uHeadC), 0.9 + 10.0);
  float inlay = lineAA(hd - 0.012, 0.003, s.px) * onStrap * step(0.0, pc.y - (-1.3)) * 0.7;
  vec2 kn = pc.z > -0.04 ? pc.xy - KNOT_F : pc.xy - KNOT_B;
  float core = fillAA(sdHex(kn.yx, 0.03), s.px) * isTrim * step(abs(length(kn) - 0.0), 0.08);
  float yl = inlay;
  // belt buckle: the knot of the Y
  float buckle = fillAA(sdBox2(vec2(pp.x, pp.y - 0.27), vec2(0.034, 0.017)), s.px) * step(0.0, pp.z) * isTrim;
  // boot sole line
  vec3 pfL = BP(17, p), pfR = BP(18, p);
  float sl = (lineAA(pfL.y + 0.175, 0.006, s.px) * step(length(pfL), 0.7) + lineAA(pfR.y + 0.175, 0.006, s.px) * step(length(pfR), 0.7)) * isTrim;
  // the collar's lip: a thin light ring where the helmet docks
  vec3 pg = pc - vec3(0.0, 0.8, -0.045);
  float lip = dot(pg - vec3(0.0, 0.17, 0.0), normalize(vec3(0.0, 1.0, 0.4)));
  float onCollar = isTrim * step(0.15, length(pg.xz)) * step(length(pg.xz), 0.26) * step(-0.12, pg.y);
  float ring = lineAA(lip + 0.018, 0.0045, s.px) * onCollar;
  float e = clamp(yl + buckle + sl + ring, 0.0, 1.0);
  s.emit += uAccent * e * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.35) * e * uAccentI;
  s.emit += uPick * core * uKnotI * 1.2; s.emitBase += mix(uPick, vec3(1.0), 0.5) * core * uKnotI;
  // pauldron edge inlay (the double stroke, once more)
  for (int k = 0; k < 2; k++) {
    vec3 pu = k == 0 ? BP(7, p) : BP(8, p);
    float edge = pu.y + 0.18 - 0.5 * abs(pu.z);
    float onP = step(abs(s.mat - MAT_SHELL), 0.5) * step(length(pu), 0.3);
    float il = lineAA(edge - 0.018, 0.0035, s.px) * onP;
    s.emit += uAccent * il * uAccentI * 0.8; s.emitBase += mix(uAccent, vec3(1.0), 0.35) * il * uAccentI * 0.8;
  }
}
`;
