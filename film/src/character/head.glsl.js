// The Yochi competitor's helmet ("the Caller").
// Construction (head space: helmet height ~1, head centre at the origin, y up, +z the way it faces):
//   HOOD   lacquer crown shell: a cut gem (a crowned top, 30-degree chamfers at the crown's shoulders,
//          straight flanks, a chamfered jaw) revolved around an elliptical plan, then raked by a side
//          profile (brow facet, a facet across the back of the crown). It sits above a seam that runs at
//          the logo's 30 degrees in profile and makes a shallow V over the brow. The Y's double stroke
//          runs brow to nape as twin light-lines.
//   LOWER  the same shell in a satin, darker tone below the seam, stepped a hair inside the hood.
//          Carries the cheek status slits and the taillight (both show the pick colour).
//   GLASS  one pick-shaped black-glass pane, flush with the cheek section, holding the LED display.
//   CREST  optional identity modules in the same language (bear fins, bull horns, antenna, frog pods,
//          cat fins, blade fin), selected by uCrest.
export const HEAD = /* glsl */ `
#define MAT_LOWER 7.0
#define STEP 0.008
float ell2(vec2 p, vec2 r) { return sdEllipsoid(vec3(p, 0.0), vec3(r, 1.0)); }
float lineAA(float d, float w, float px) { return smoothstep(w + px, w - px, abs(d)); }
float fillAA(float d, float px) { return smoothstep(px, -px, d); }

#define GP_N 13
const vec2 GP[GP_N] = vec2[GP_N](
  vec2(0.0, 0.186), vec2(0.17, 0.212), vec2(0.276, 0.196), vec2(0.318, 0.10), vec2(0.31, -0.05), vec2(0.25, -0.19),
  vec2(0.12, -0.315), vec2(0.0, -0.352), vec2(-0.12, -0.315), vec2(-0.25, -0.19), vec2(-0.31, -0.05), vec2(-0.318, 0.10),
  vec2(-0.276, 0.196));
float sdGlassOutline(vec2 p) {
  float d = dot(p - GP[0], p - GP[0]); float s = 1.0;
  for (int i = 0, j = GP_N - 1; i < GP_N; j = i, i++) {
    vec2 e = GP[j] - GP[i]; vec2 w = p - GP[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= GP[i].y, p.y < GP[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}

// Front profile: a cut gem. A crowned top, 30-degree chamfers at the crown's shoulders (the logo's
// angle, and Chakra Petch's cut corners), straight flanks, jaw chamfers down to a narrow chin.
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
// Side profile: raked. A slightly forward-leaning face, a brow facet, a facet across the back of the
// crown at 30 degrees, and a jaw line rising toward the nape.
float sideProf(vec2 p) { // p = (z, y)
  float face = dot(p - vec2(0.385, 0.02), normalize(vec2(1.0, 0.24)));
  float brow = dot(p - vec2(0.345, 0.32), normalize(vec2(0.62, 0.78)));
  float back = dot(p - vec2(-0.37, 0.36), normalize(vec2(-0.5, 0.866)));
  float jaw = dot(p - vec2(0.29, -0.455), normalize(vec2(-0.2, -0.98)));
  float d = smax(face, brow, 0.024);
  d = smax(d, back, 0.035);
  return smax(d, jaw, 0.035);
}
// The gem is revolved around an elliptical plan (0.66 wide, 0.9 deep), so the crown chamfer and the jaw
// taper run all the way round and every view has the cut-gem silhouette. The side profile then rakes it.
float outerShell(vec3 p) {
  const float k = 0.331 / 0.45;
  float rho = length(vec2(p.x, (p.z + 0.03) * k));
  float gem = frontProf(vec2(rho, p.y)) * (0.5 + 0.5 * k);
  return smax(gem, sideProf(p.zy), 0.03);
}
// seam between hood and lower section: 30 degrees in profile, a shallow V over the brow
float seamPlane(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  return dot(q - vec3(0.0, 0.175, 0.35), normalize(vec3(-0.2, 0.86, -0.5)));
}
// ---- crest modules: identity / clan silhouettes, in the helmet's own language ----------------------
// uCrest: 0 dome, 1 bear (ear fins), 2 bull (swept horns), 3 antenna, 4 frog (sensor pods), 5 cat, 6 fin
uniform float uCrest;
vec2 crestSDF(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  float c = uCrest;
  if (c < 0.5) return vec2(1e9, MAT_SHELL);
  if (c < 1.5) {
    // bear: broad, flat-topped fins growing from the crown's shoulder facets, leaning out at 30 degrees
    vec3 e = rotZ(0.5236) * (q - vec3(0.205, 0.42, -0.06));
    float fin = sdRoundBox(e - vec3(0.0, 0.07, 0.0), vec3(0.082, 0.1, 0.028), 0.03);
    fin = smax(fin, -(e.y + 0.03), 0.01);
    return vec2(fin, MAT_SHELL);
  }
  if (c < 2.5) {
    // bull: blade horns sweeping out from the flanks, then up and forward
    float h = sdRoundCone(q, vec3(0.27, 0.27, -0.02), vec3(0.45, 0.33, 0.02), 0.05, 0.036);
    h = smin(h, sdRoundCone(q, vec3(0.45, 0.33, 0.02), vec3(0.53, 0.51, 0.07), 0.036, 0.022), 0.02);
    h = smin(h, sdRoundCone(q, vec3(0.53, 0.51, 0.07), vec3(0.49, 0.67, 0.15), 0.022, 0.007), 0.015);
    return vec2(h, MAT_SHELL);
  }
  if (c < 3.5) {
    // antenna: a hairline rod with an LED tip
    float rod = sdCapsule(p, vec3(0.13, 0.4, -0.14), vec3(0.24, 0.92, -0.2), 0.011);
    float base = sdEllipsoid(p - vec3(0.13, 0.42, -0.14), vec3(0.05, 0.03, 0.05));
    vec2 r = vec2(min(rod, base), MAT_TRIM);
    float tip = length(p - vec3(0.245, 0.95, -0.202)) - 0.034;
    if (tip < r.x) r = vec2(tip, MAT_EMIT);
    return r;
  }
  if (c < 4.5) {
    // frog: two sensor pods on the brow, each with a dark lens
    float pod = sdEllipsoid(q - vec3(0.15, 0.39, 0.19), vec3(0.1, 0.085, 0.1));
    vec2 r = vec2(pod, MAT_SHELL);
    float lens = max(sdEllipsoid(q - vec3(0.15, 0.40, 0.212), vec3(0.068, 0.056, 0.085)), -(q.z - 0.23));
    if (lens < r.x) r = vec2(lens, MAT_GLASS);
    return r;
  }
  if (c < 5.5) {
    // cat: sharp triangular fins on the shoulder facets, leaning out at 30 degrees
    vec3 e = rotZ(0.5236) * (q - vec3(0.2, 0.41, -0.03));
    float t = max(max(-e.y - 0.03, dot(vec2(abs(e.x), e.y), normalize(vec2(0.94, 0.34))) - 0.06), abs(e.z) - 0.022);
    t = max(t, e.y - 0.24);
    return vec2(t - 0.008, MAT_SHELL);
  }
  // fin: a single blade along the crown, tallest at the back
  float h = 0.02 + 0.13 * smoothstep(0.25, -0.35, p.z);
  float fin = max(max(outerShell(p) - h, abs(p.x) - 0.014), max(p.z - 0.3, -0.48 - p.z));
  fin = max(fin, 0.12 - p.y);
  return vec2(fin, MAT_SHELL);
}
// face coordinates: wrap around a vertical axis behind the face, so outlines and LEDs follow the glass
vec2 faceUV(vec3 p) { return vec2(atan(p.x, p.z + 0.26) * 0.62, p.y); }
// returns (distance, material)
vec2 headSDF(vec3 p) {
  float o = outerShell(p);
  float sp = seamPlane(p);
  // hood: the outer shell above the seam
  float hood = smax(o, -sp, 0.004);
  // lower section: stepped inside the hood, below the seam
  float lower = smax(o + STEP, sp - 0.002, 0.004);
  // the face: a flush glass pane following the cheek section's own curvature, with a gasket
  float lo = o + STEP;
  float w = p.z > -0.1 ? sdGlassOutline(faceUV(p)) : 0.3;
  lower = smax(lower, -max(w, -(lo + 0.03)), 0.003);
  vec2 r = vec2(hood, MAT_SHELL);
  if (lower < r.x) r = vec2(lower, MAT_LOWER);
  float gl = max(max(w + 0.006, lo + 0.007), -(lo + 0.08));
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  vec2 cr = crestSDF(p);
  if (cr.x < r.x) r = vec2(smin(r.x, cr.x, 0.012), cr.y);
  return r;
}

// LED display on glass. g = grid coordinates in LEDs, pitch = world size of one LED.
void ledGlass(inout Surf s, vec2 g, float pitch, float inside) {
  s.glass = 1.0; s.alb = vec3(0.004, 0.004, 0.009); s.gloss = 1.0; s.sharp = 1.0; s.rimK = 0.8; s.edgeK = 0.25;
  vec2 cell = floor(g); vec2 f = fract(g) - 0.5;
  float r = length(f);
  float aa = max(s.px / pitch, 0.03);
  float dotm = smoothstep(0.37 + aa, 0.37 - aa, r);
  float solid = smoothstep(0.35, 0.9, s.px / pitch);
  dotm = mix(dotm, 0.75, solid);
  bool ok = cell.x >= 0.0 && cell.y >= 0.0 && cell.x < uFaceGrid.x && cell.y < uFaceGrid.y;
  vec4 lc = ok ? texelFetch(uFace, ivec2(cell), 0) : vec4(0.0);
  lc.a *= inside;
  vec3 led = pow(lc.rgb, vec3(2.2)) * lc.a * uLedI;
  s.emit = led * dotm * 1.7 + led * 0.06;
  s.emitBase = mix(led, vec3(lc.a * uLedI), 0.42) * dotm + led * 0.05;
  s.alb += vec3(0.02, 0.022, 0.04) * dotm * uShowOff * (1.0 - lc.a) * inside * (1.0 - solid);
}

void headSurface(inout Surf s, vec3 p) {
  if (s.mat == MAT_EMIT) {
    s.alb = uAccent * 0.3; s.gloss = 0.4; s.emit = uAccent * 1.4 * uAccentI; s.emitBase = mix(uAccent, vec3(1.0), 0.55) * uAccentI; return;
  }
  if (s.mat == MAT_GLASS && uCrest > 3.5 && uCrest < 4.5 && p.y > 0.3 && length(vec2(abs(p.x) - 0.15, p.y - 0.4)) < 0.11) {
    s.glass = 1.0; s.alb = vec3(0.004, 0.004, 0.009); s.gloss = 1.0; s.sharp = 1.0;
    float ringL = lineAA(length(vec2(abs(p.x) - 0.15, (p.y - 0.4) * 1.2)) - 0.045, 0.006, s.px);
    s.emit = uPick * ringL * uPickI; s.emitBase = mix(uPick, vec3(1.0), 0.4) * ringL * uPickI;
    return;
  }
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0192;
    vec2 uv = faceUV(p);
    vec2 g = vec2((uv.x + 16.5 * pitch) / pitch, (0.172 - uv.y) / pitch);
    ledGlass(s, g, pitch, 1.0);
  } else if (s.mat == MAT_LOWER) {
    // same shell, satin finish, a step darker: one object in two tones
    s.alb = uShell * 0.62; s.gloss = 0.5; s.sharp = 0.0; s.rimK = 0.9;
    // cheek status slits beside the glass
    float sl = fillAA(sdBox2(vec2(p.z - 0.13, p.y + 0.02), vec2(0.011, 0.07)), s.px) * step(0.28, abs(p.x));
    // taillight under the ducktail
    float tl = fillAA(sdBox2(vec2(p.x, p.y + 0.25), vec2(0.085, 0.012)), s.px) * step(p.z, -0.3);
    s.emit += uPick * (sl + tl) * uPickI * 1.25; s.emitBase += mix(uPick, vec3(1.0), 0.5) * (sl + tl) * uPickI;
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    // twin light-lines: the double stroke of the Y, brow to nape
    float on = step(0.0, seamPlane(p) - 0.03) * step(p.z, 0.34);
    float twin = lineAA(abs(p.x) - 0.036, 0.0058, s.px) * on;
    s.emit += uAccent * twin * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.35) * twin * uAccentI;
  }
}
`;

// The helmet alone on a short neck stub (visor studies, profile images).
export const HEAD_BUST = HEAD + /* glsl */ `
vec2 map(vec3 p) {
  vec2 h = headSDF(p);
  // a short neck stub so the head sits on something
  float neck = sdRoundCone(p, vec3(0.0, -0.28, -0.07), vec3(0.0, -0.75, -0.05), 0.125, 0.14);
  if (neck < h.x) h = vec2(neck, MAT_SUIT);
  return h;
}
void surface(inout Surf s) {
  if (s.mat == MAT_SUIT) { s.alb = uSuit; s.gloss = 0.35; s.sharp = 0.0; return; }
  headSurface(s, s.p);
}
`;
export const HEAD_BOX = [[-0.46, -0.78, -0.66], [0.46, 0.56, 0.5]];
