// Helmet concept exploration. Every concept sits on the same neutral bust and shares the display
// system, so the comparison is only about the head. Units: helmet height ~1, head centre at origin.

const COMMON = /* glsl */ `
// LED display on glass. g = grid coordinates in LEDs, pitch = world size of one LED.
void ledGlass(inout Surf s, vec2 g, float pitch, float inside) {
  s.glass = 1.0; s.alb = vec3(0.004, 0.004, 0.009); s.gloss = 0.9; s.sharp = 1.0; s.rimK = 0.8;
  vec2 cell = floor(g); vec2 f = fract(g) - 0.5;
  float r = length(f);
  float aa = max(s.px / pitch, 0.03);
  float dotm = smoothstep(0.37 + aa, 0.37 - aa, r);
  // when LEDs are sub-pixel, fill the cell: the glyph reads as a solid shape at crowd scale
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
float lineAA(float d, float w, float px) { return smoothstep(w + px, w - px, abs(d)); }
float fillAA(float d, float px) { return smoothstep(px, -px, d); }

// ---- neutral bust -----------------------------------------------------------------------
float cpl(vec3 p, vec3 c, vec3 n, float R) { return length(p - (c - n * R)) - R; }
vec2 bustBody(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  float neck = sdRoundCone(p, vec3(0.0, -0.30, -0.06), vec3(0.0, -0.74, -0.04), 0.125, 0.145);
  float chest = sdEllipsoid(p - vec3(0.0, -1.10, 0.0), vec3(0.45, 0.43, 0.26));
  float trap = sdCapsule(q, vec3(0.08, -0.80, -0.06), vec3(0.49, -0.87, -0.03), 0.11);
  float waist = sdEllipsoid(p - vec3(0.0, -1.75, -0.01), vec3(0.32, 0.62, 0.21));
  float torso = smin(smin(chest, trap, 0.14), waist, 0.24);
  float delt = sdEllipsoid(q - vec3(0.59, -0.89, -0.02), vec3(0.16, 0.18, 0.17));
  float arm = sdRoundCone(q, vec3(0.625, -0.94, -0.03), vec3(0.69, -1.85, -0.05), 0.125, 0.096);
  float d = smin(torso, delt, 0.08);
  d = min(d, smin(arm, delt, 0.04));
  d = smin(d, neck, 0.07);
  d = max(d, -2.3 - p.y);
  vec2 r = vec2(d, MAT_SUIT);
  float collar = sdTorusY(p - vec3(0.0, -0.70, -0.04), 0.155, 0.032);
  if (collar < r.x) r = vec2(collar, MAT_TRIM);
  return r;
}
void bustSurface(inout Surf s) {
  vec3 p = s.p;
  s.alb = uSuit; s.gloss = 0.35; s.sharp = 0.0; s.rimK = 0.9;
  if (s.mat == MAT_TRIM) {
    s.alb = uTrim; s.gloss = 0.8; s.sharp = 1.0;
    float ln = lineAA(p.y + 0.70, 0.006, s.px) * step(0.0, p.z + 0.1);
    s.emit += uAccent * ln * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.3) * ln * uAccentI;
  }
}
`;

// ---------------------------------------------------------------------------------------------
const VANE = /* glsl */ `
float hBase(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  float d = sdEllipsoid(p - vec3(0.0, 0.03, -0.02), vec3(0.365, 0.46, 0.46));
  float tail = sdRoundCone(p, vec3(0.0, 0.10, -0.14), vec3(0.0, -0.08, -0.68), 0.30, 0.03);
  d = smin(d, tail, 0.2);
  float jaw = sdEllipsoid(p - vec3(0.0, -0.22, 0.07), vec3(0.27, 0.30, 0.33));
  d = smin(d, jaw, 0.12);
  d = smax(d, dot(q - vec3(0.365, -0.02, 0.0), normalize(vec3(0.92, -0.38, 0.08))), 0.07);
  d = smax(d, dot(p - vec3(0.0, 0.0, 0.40), normalize(vec3(0.0, 0.26, 1.0))), 0.05);
  d = smax(d, dot(p - vec3(0.0, -0.47, 0.0), normalize(vec3(0.0, -1.0, 0.6))), 0.03);
  return d;
}
// wraparound band in (angle, y)
float bandTop(float a) { a = abs(a); return 0.075 + 0.05 * smoothstep(0.0, 0.32, a) - 0.05 * smoothstep(0.35, 1.3, a); }
float bandBot(float a) { a = abs(a); return -0.165 + 0.13 * pow(clamp(a / 1.3, 0.0, 1.0), 1.6); }
float sdBand(vec3 p) {
  float a = atan(p.x, p.z);
  float R = 0.38;
  float d = max(max(p.y - bandTop(a), bandBot(a) - p.y), (abs(a) - 1.28) * R);
  return d;
}
vec2 helmet(vec3 p) {
  float b = hBase(p);
  float band = sdBand(p);
  float d = smax(b, -max(band, -(b + 0.024)), 0.005);
  float keel = max(max(b - 0.02, abs(p.x) - 0.013), max(0.15 - p.y + 0.4 * max(0.0, p.z - 0.2), -0.25 - p.y));
  vec2 r = vec2(min(d, keel), MAT_SHELL);
  float gl = max(max(band + 0.005, b + 0.013), -(b + 0.06));
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  return r;
}
void helmetSurface(inout Surf s) {
  vec3 p = s.p;
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0195;
    vec2 g = vec2((p.x + 16.5 * pitch) / pitch, (0.13 - p.y) / pitch);
    float a = atan(p.x, p.z);
    float inside = step(abs(a), 0.95);
    ledGlass(s, g, pitch, inside);
    // band ends carry the pick colour as a solid bar (side read)
    float side = smoothstep(0.95, 1.0, abs(a));
    s.emit += uPick * side * uPickI * 0.9; s.emitBase += mix(uPick, vec3(1.0), 0.4) * side * uPickI * 0.8;
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    float keel = lineAA(p.x, 0.006, s.px) * step(0.2, p.y + 0.4 * max(0.0, 0.2 - p.z)) * step(p.z, 0.3);
    float chin = lineAA(p.x, 0.005, s.px) * step(p.y, -0.24) * step(0.1, p.z);
    s.emit += uAccent * (keel + chin) * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.3) * (keel + chin) * uAccentI;
  }
}
`;

// ---------------------------------------------------------------------------------------------
const MASK = /* glsl */ `
#define SH_N 14
const vec2 SH[SH_N] = vec2[SH_N](
  vec2(0.0, 0.255), vec2(0.15, 0.245), vec2(0.285, 0.205), vec2(0.335, 0.06), vec2(0.305, -0.10), vec2(0.17, -0.29),
  vec2(0.045, -0.425), vec2(0.0, -0.44), vec2(-0.045, -0.425), vec2(-0.17, -0.29), vec2(-0.305, -0.10), vec2(-0.335, 0.06),
  vec2(-0.285, 0.205), vec2(-0.15, 0.245));
float sdShield(vec2 p) {
  float d = dot(p - SH[0], p - SH[0]); float s = 1.0;
  for (int i = 0, j = SH_N - 1; i < SH_N; j = i, i++) {
    vec2 e = SH[j] - SH[i]; vec2 w = p - SH[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= SH[i].y, p.y < SH[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}
float hBase(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  float d = sdEllipsoid(p - vec3(0.0, 0.02, -0.04), vec3(0.385, 0.49, 0.47));
  d = smax(d, dot(q - vec3(0.385, 0.02, 0.0), normalize(vec3(0.87, -0.49, 0.0))), 0.09);
  d = smax(d, dot(p - vec3(0.0, -0.47, 0.0), normalize(vec3(0.0, -1.0, 0.5))), 0.03);
  return d;
}
vec2 helmet(vec3 p) {
  float b = hBase(p);
  float sd = p.z > 0.05 ? sdShield(p.xy) : 0.2;
  // glass sits proud of the shell by a hair, with a dark seam around it
  float front = step(0.0, p.z);
  float seam = max(abs(sd) - 0.0045, -(b + 0.015));
  float d = smax(b, -seam * front - (1.0 - front), 0.002);
  vec2 r = vec2(d, MAT_SHELL);
  float gl = max(sd + 0.0045, b - 0.004);
  gl = max(gl, -p.z);
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  return r;
}
void helmetSurface(inout Surf s) {
  vec3 p = s.p;
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0195;
    vec2 g = vec2((p.x + 16.5 * pitch) / pitch, (0.155 - p.y) / pitch);
    ledGlass(s, g, pitch, 1.0);
    // edge bars on the wrap carry the pick colour
    float side = smoothstep(0.27, 0.30, abs(p.x)) * step(-0.08, p.y) * step(p.y, 0.16);
    s.emit += uPick * side * uPickI * 0.8; s.emitBase += mix(uPick, vec3(1.0), 0.4) * side * uPickI * 0.7;
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    float twin = lineAA(abs(p.x) - 0.042, 0.0065, s.px) * step(0.27, p.y + max(0.0, -p.z) * 1.5) * step(p.z, 0.25);
    s.emit += uAccent * twin * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.3) * twin * uAccentI;
  }
}
`;

// ---------------------------------------------------------------------------------------------
const HALO = /* glsl */ `
float hBase(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  float d = sdEllipsoid(p - vec3(0.0, 0.0, -0.02), vec3(0.355, 0.50, 0.44));
  d = smax(d, dot(q - vec3(0.355, -0.02, 0.0), normalize(vec3(0.9, -0.43, 0.0))), 0.1);
  d = smax(d, dot(p - vec3(0.0, -0.49, 0.0), normalize(vec3(0.0, -1.0, 0.4))), 0.03);
  return d;
}
float ringTop(float a) { float k = 0.5 - 0.5 * cos(a); return 0.13 - 0.075 * k - 0.03 * (1.0 - smoothstep(0.0, 0.3, abs(a))); }
float ringBot(float a) { float k = 0.5 - 0.5 * cos(a); return -0.155 + 0.14 * k; }
vec2 helmet(vec3 p) {
  float b = hBase(p);
  float a = atan(p.x, p.z);
  float ring = max(p.y - ringTop(a), ringBot(a) - p.y);
  float d = smax(b, -max(ring, -(b + 0.026)), 0.006);
  vec2 r = vec2(d, MAT_SHELL);
  float gl = max(max(ring + 0.005, b + 0.014), -(b + 0.06));
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  return r;
}
void helmetSurface(inout Surf s) {
  vec3 p = s.p;
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0195;
    vec2 g = vec2((p.x + 16.5 * pitch) / pitch, (0.135 - p.y) / pitch);
    float a = atan(p.x, p.z);
    ledGlass(s, g, pitch, step(abs(a), 0.9));
    // the rest of the ring is a continuous status line in the pick colour
    float mid = 0.5 * (ringTop(a) + ringBot(a));
    float ln = lineAA(p.y - mid, 0.012, s.px) * smoothstep(0.85, 1.0, abs(a));
    s.emit += uPick * ln * uPickI; s.emitBase += mix(uPick, vec3(1.0), 0.45) * ln * uPickI;
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    float seam = lineAA(p.x, 0.003, s.px) * step(0.2, p.y) * 0.5;
    s.line = seam;
  }
}
`;

// ---------------------------------------------------------------------------------------------
const PRISM = /* glsl */ `
#define PW_N 8
const vec2 PW[PW_N] = vec2[PW_N](vec2(-0.24, 0.135), vec2(0.24, 0.135), vec2(0.315, 0.05), vec2(0.315, -0.075),
  vec2(0.235, -0.17), vec2(-0.235, -0.17), vec2(-0.315, -0.075), vec2(-0.315, 0.05));
float sdPW(vec2 p) {
  float d = dot(p - PW[0], p - PW[0]); float s = 1.0;
  for (int i = 0, j = PW_N - 1; i < PW_N; j = i, i++) {
    vec2 e = PW[j] - PW[i]; vec2 w = p - PW[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= PW[i].y, p.y < PW[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}
float hBase(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  const float k = 0.018;
  float d = q.x - 0.365;
  d = smax(d, p.y - 0.47, k);
  d = smax(d, dot(q.xy - vec2(0.365, 0.21), normalize(vec2(0.5, 0.866))), k);
  d = smax(d, dot(q.xy - vec2(0.365, -0.05), normalize(vec2(0.82, -0.57))), k);
  d = smax(d, -0.49 - p.y, k);
  d = smax(d, dot(p - vec3(0.0, 0.0, 0.40), normalize(vec3(0.0, 0.2, 1.0))), k);
  d = smax(d, dot(p - vec3(0.0, 0.30, 0.31), normalize(vec3(0.0, 0.8, 0.6))), k);
  d = smax(d, -0.50 - p.z, k);
  d = smax(d, dot(p - vec3(0.0, 0.31, -0.40), normalize(vec3(0.0, 0.7, -0.7))), k);
  d = smax(d, dot(q - vec3(0.365, 0.0, 0.29), normalize(vec3(0.7, 0.0, 0.7))), k);
  d = smax(d, dot(q - vec3(0.365, 0.0, -0.36), normalize(vec3(0.7, 0.0, -0.7))), k);
  d = smax(d, dot(p - vec3(0.0, -0.49, -0.1), normalize(vec3(0.0, -0.6, -0.8))), k);
  return d;
}
vec2 helmet(vec3 p) {
  float b = hBase(p);
  float w = sdPW(p.xy);
  float d = smax(b, -max(w, -(b + 0.024)), 0.003);
  float keel = max(max(b - 0.018, abs(p.x) - 0.028), 0.19 - p.y);
  vec2 r = vec2(min(d, keel), MAT_SHELL);
  float gl = max(max(w + 0.005, b + 0.013), -(b + 0.06));
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  return r;
}
void helmetSurface(inout Surf s) {
  vec3 p = s.p;
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0195;
    vec2 g = vec2((p.x + 16.5 * pitch) / pitch, (0.14 - p.y) / pitch);
    ledGlass(s, g, pitch, 1.0);
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    // side status slit on the temple facet
    vec2 sq = vec2(p.z - 0.08, p.y + 0.0);
    float sl = fillAA(sdBox2(sq, vec2(0.014, 0.075)), s.px) * step(0.33, abs(p.x));
    s.emit += uPick * sl * uPickI * 1.2; s.emitBase += mix(uPick, vec3(1.0), 0.5) * sl * uPickI;
    float kl = lineAA(p.x, 0.007, s.px) * step(0.22, p.y);
    s.emit += uAccent * kl * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.3) * kl * uAccentI;
  }
}
`;

// ---------------------------------------------------------------------------------------------
const CREST = /* glsl */ `
#define CW_N 9
const vec2 CW[CW_N] = vec2[CW_N](vec2(0.0, 0.055), vec2(0.21, 0.155), vec2(0.315, 0.12), vec2(0.30, -0.05),
  vec2(0.16, -0.175), vec2(-0.16, -0.175), vec2(-0.30, -0.05), vec2(-0.315, 0.12), vec2(-0.21, 0.155));
float sdCW(vec2 p) {
  float d = dot(p - CW[0], p - CW[0]); float s = 1.0;
  for (int i = 0, j = CW_N - 1; i < CW_N; j = i, i++) {
    vec2 e = CW[j] - CW[i]; vec2 w = p - CW[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= CW[i].y, p.y < CW[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}
float hBase(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  float d = sdEllipsoid(p - vec3(0.0, 0.03, -0.04), vec3(0.375, 0.465, 0.48));
  float cheek = sdEllipsoid(q - vec3(0.2, -0.22, 0.15), vec3(0.18, 0.28, 0.27));
  d = smin(d, cheek, 0.08);
  d = smax(d, dot(q - vec3(0.375, 0.0, 0.0), normalize(vec3(0.9, -0.42, 0.12))), 0.06);
  d = smax(d, dot(p - vec3(0.0, 0.0, 0.41), normalize(vec3(0.0, 0.22, 1.0))), 0.03);
  d = smax(d, dot(p - vec3(0.0, -0.48, 0.0), normalize(vec3(0.0, -1.0, 0.5))), 0.03);
  return d;
}
float sdBlade(vec3 p) {
  vec2 q = vec2(p.z, p.y);
  float outer = sdEllipsoid(vec3(q - vec2(-0.08, 0.06), 0.0), vec3(0.47, 0.66, 1.0));
  float inner = sdEllipsoid(vec3(q - vec2(-0.03, 0.02), 0.0), vec3(0.45, 0.48, 1.0));
  float d = max(outer, -inner);
  d = max(d, q.x - 0.22);
  return max(d, abs(p.x) - 0.009);
}
vec2 helmet(vec3 p) {
  float b = hBase(p);
  float w = sdCW(p.xy);
  float d = smax(b, -max(w, -(b + 0.026)), 0.004);
  vec2 r = vec2(d, MAT_SHELL);
  float gl = max(max(w + 0.005, b + 0.014), -(b + 0.06));
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  float bl = sdBlade(p);
  if (bl < r.x) r = vec2(bl, MAT_EMIT);
  return r;
}
void helmetSurface(inout Surf s) {
  vec3 p = s.p;
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0195;
    vec2 g = vec2((p.x + 16.5 * pitch) / pitch, (0.16 - p.y) / pitch);
    ledGlass(s, g, pitch, 1.0);
  } else if (s.mat == MAT_EMIT) {
    s.alb = uAccent * 0.2; s.gloss = 0.6; s.sharp = 1.0; s.rimK = 0.5;
    float edge = smoothstep(0.0, 0.06, abs(p.y - 0.62)); // brighter leading edge
    s.emit = uAccent * 0.55 * uAccentI; s.emitBase = mix(uAccent, vec3(1.0), 0.25) * 0.6 * uAccentI;
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    vec2 sq = vec2(p.z - 0.02, p.y + 0.02);
    float sl = fillAA(sdBox2(sq, vec2(0.013, 0.07)), s.px) * step(0.3, abs(p.x));
    s.emit += uPick * sl * uPickI * 1.2; s.emitBase += mix(uPick, vec3(1.0), 0.5) * sl * uPickI;
  }
}
`;


// ---------------------------------------------------------------------------------------------
const SHIELD = /* glsl */ `
#define SW_N 11
const vec2 SW[SW_N] = vec2[SW_N](
  vec2(0.0, 0.195), vec2(0.215, 0.245), vec2(0.305, 0.19), vec2(0.33, 0.05), vec2(0.265, -0.17), vec2(0.12, -0.35),
  vec2(0.0, -0.405), vec2(-0.12, -0.35), vec2(-0.265, -0.17), vec2(-0.33, 0.05), vec2(-0.305, 0.19));
float sdSW(vec2 p) {
  float d = dot(p - SW[0], p - SW[0]); float s = 1.0;
  for (int i = 0, j = SW_N - 1; i < SW_N; j = i, i++) {
    vec2 e = SW[j] - SW[i]; vec2 w = p - SW[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= SW[i].y, p.y < SW[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}
float hBase(vec3 p) {
  vec3 q = vec3(abs(p.x), p.y, p.z);
  const float k = 0.012;
  float d = sdEllipsoid(p - vec3(0.0, 0.01, -0.06), vec3(0.405, 0.50, 0.52));
  d = smax(d, cpl(q, vec3(0.37, 0.08, 0.0), normalize(vec3(1.0, 0.0, -0.06)), 1.8), k);
  d = smax(d, cpl(q, vec3(0.27, 0.40, 0.0), normalize(vec3(0.5, 0.866, 0.0)), 1.8), k);
  d = smax(d, cpl(p, vec3(0.0, 0.49, -0.05), normalize(vec3(0.0, 1.0, -0.08)), 1.8), k);
  d = smax(d, cpl(q, vec3(0.365, -0.03, 0.0), normalize(vec3(0.86, -0.5, 0.04)), 1.8), k);
  d = smax(d, cpl(p, vec3(0.0, -0.47, 0.1), normalize(vec3(0.0, -1.0, 0.5)), 1.8), k);
  d = smax(d, dot(p - vec3(0.0, -0.46, -0.1), normalize(vec3(0.0, -1.0, -0.55))), k);
  return d;
}
float hLens(vec3 p) { return sdEllipsoid(p - vec3(0.0, 0.0, -0.26), vec3(0.62, 1.1, 0.665)); }
vec2 helmet(vec3 p) {
  float b = hBase(p);
  float lens = hLens(p);
  float sh = smax(b, lens, 0.01);
  float w = p.z > 0.0 ? sdSW(p.xy) : 0.3;
  // pocket for the glass, leaving a bezel of shell around it
  float d = smax(sh, -max(w, -(lens + 0.02)), 0.004);
  vec2 r = vec2(d, MAT_SHELL);
  float gl = max(max(w + 0.004, lens + 0.01), -(lens + 0.06));
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  return r;
}
void helmetSurface(inout Surf s) {
  vec3 p = s.p;
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0195;
    vec2 g = vec2((p.x + 16.5 * pitch) / pitch, (0.18 - p.y) / pitch);
    ledGlass(s, g, pitch, 1.0);
    s.edgeK = 0.3;
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    // twin light lines over the crown (the double stroke of the Y)
    float onTop = step(0.255, p.y + max(0.0, -p.z) * 1.2) * step(p.z, 0.3) * step(-0.2, p.y);
    float twin = lineAA(abs(p.x) - 0.036, 0.0058, s.px) * onTop;
    s.emit += uAccent * twin * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.35) * twin * uAccentI;
    // temple status slit
    float sl = fillAA(sdBox2(vec2(p.z - 0.09, p.y - 0.03), vec2(0.012, 0.075)), s.px) * step(0.3, abs(p.x));
    // rear status bar
    float rb = fillAA(sdBox2(vec2(p.x, p.y + 0.02), vec2(0.07, 0.011)), s.px) * step(p.z, -0.35);
    s.emit += uPick * (sl + rb) * uPickI * 1.2; s.emitBase += mix(uPick, vec3(1.0), 0.5) * (sl + rb) * uPickI;
  }
}
`;

// ---------------------------------------------------------------------------------------------
// CALLER: two designed profiles (front "pick", raked side with ducktail) intersected, one glass face.
const CALLER_CORE = /* glsl */ `
#define CG_N 13
const vec2 CG[CG_N] = vec2[CG_N](
  vec2(0.0, 0.198), vec2(0.19, 0.232), vec2(0.285, 0.205), vec2(0.325, 0.11), vec2(0.318, -0.04), vec2(0.265, -0.19),
  vec2(0.13, -0.37), vec2(0.0, -0.425), vec2(-0.13, -0.37), vec2(-0.265, -0.19), vec2(-0.318, -0.04), vec2(-0.325, 0.11),
  vec2(-0.285, 0.205));
float sdCG(vec2 p) {
  float d = dot(p - CG[0], p - CG[0]); float s = 1.0;
  for (int i = 0, j = CG_N - 1; i < CG_N; j = i, i++) {
    vec2 e = CG[j] - CG[i]; vec2 w = p - CG[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= CG[i].y, p.y < CG[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}
float ell2(vec2 p, vec2 r) { return sdEllipsoid(vec3(p, 0.0), vec3(r, 1.0)); }
float frontProf(vec2 p) {
  vec2 q = vec2(abs(p.x), p.y);
  float e = ell2(p - vec2(0.0, 0.035), vec2(0.385, 0.465));
  float jaw = dot(q - vec2(0.385, 0.07), normalize(vec2(0.884, -0.468)));
  float chin = -0.475 - p.y;
  return smax(smax(e, jaw, 0.07), chin, 0.06);
}
float sideProf(vec2 p) { // p = (z, y)
  float e = ell2(p - vec2(-0.07, 0.02), vec2(0.50, 0.485));
  float face = dot(p - vec2(0.405, 0.04), normalize(vec2(1.0, 0.24)));
  float jaw = dot(p - vec2(0.31, -0.47), normalize(vec2(-0.30, -0.95)));
  float d = smax(smax(e, face, 0.05), jaw, 0.035);
  // ducktail: a small lip over the nape
  float lip = ell2(p - vec2(-0.47, -0.17), vec2(0.10, 0.045));
  return smin(d, lip, 0.06);
}
float hShell0(vec3 p) {
  float d = smax(frontProf(p.xy), sideProf(p.zy), 0.035);
  float vol = sdEllipsoid(p - vec3(0.0, 0.02, -0.05), vec3(0.435, 0.545, 0.575));
  return smax(d, vol, 0.09);
}
float hLens(vec3 p) {
  vec3 q = rotX(-0.2) * (p - vec3(0.0, 0.0, -0.29));
  return sdEllipsoid(q, vec3(0.60, 1.2, 0.695));
}
`;
function callerVariant(fins) {
  return CALLER_CORE + /* glsl */ `
vec2 helmet(vec3 p) {
  float b = hShell0(p);
  float lens = hLens(p);
  float sh = smax(b, lens, 0.012);
  float w = p.z > 0.0 ? sdCG(p.xy) : 0.3;
  float d = smax(sh, -max(w, -(lens + 0.022)), 0.004);
  ${fins ? `
  // twin fins: the double stroke of the Y, rising toward the back
  float h = 0.012 + 0.07 * smoothstep(0.28, -0.42, p.z);
  float fin = max(b - h, abs(abs(p.x) - 0.062) - 0.0125);
  fin = max(fin, max(p.z - 0.30, -0.53 - p.z));
  fin = max(fin, 0.05 - p.y);
  d = smin(d, fin, 0.008);` : ''}
  vec2 r = vec2(d, MAT_SHELL);
  float gl = max(max(w + 0.004, lens + 0.011), -(lens + 0.06));
  if (gl < r.x) r = vec2(gl, MAT_GLASS);
  return r;
}
void helmetSurface(inout Surf s) {
  vec3 p = s.p;
  if (s.mat == MAT_GLASS) {
    float pitch = 0.0195;
    vec2 g = vec2((p.x + 16.5 * pitch) / pitch, (0.19 - p.y) / pitch);
    ledGlass(s, g, pitch, 1.0);
    s.edgeK = 0.3;
  } else {
    s.alb = uShell; s.gloss = 1.0; s.sharp = 1.0;
    ${fins ? `
    float lip = step(0.05, p.y) * step(p.z, 0.29) * step(abs(abs(p.x) - 0.062), 0.0126);
    float top = lineAA(abs(p.x) - 0.062, 0.004, s.px) * lip * step(0.03, 0.012 + 0.07 * smoothstep(0.28, -0.42, p.z) - (hShell0(p) - 0.0) * 0.0);
    float ln = lip * smoothstep(0.004, 0.0, abs(hShell0(p) + 0.0 - (0.012 + 0.07 * smoothstep(0.28, -0.42, p.z)) ) - 0.0);
    s.emit += uAccent * ln * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.35) * ln * uAccentI;` : `
    float onTop = step(0.23, p.y + max(0.0, -p.z) * 1.1) * step(p.z, 0.3) * step(-0.2, p.y);
    float twin = lineAA(abs(p.x) - 0.04, 0.0065, s.px) * onTop;
    s.emit += uAccent * twin * uAccentI; s.emitBase += mix(uAccent, vec3(1.0), 0.35) * twin * uAccentI;`}
    float sl = fillAA(sdBox2(vec2(p.z - 0.10, p.y - 0.03), vec2(0.012, 0.08)), s.px) * step(0.3, abs(p.x));
    float rb = fillAA(sdBox2(vec2(p.x, p.y + 0.05), vec2(0.075, 0.011)), s.px) * step(p.z, -0.35);
    s.emit += uPick * (sl + rb) * uPickI * 1.2; s.emitBase += mix(uPick, vec3(1.0), 0.5) * (sl + rb) * uPickI;
  }
}
`;
}
const CALLER_A = callerVariant(true);
const CALLER_B = callerVariant(false);

export const CONCEPTS = { VANE, MASK, HALO, PRISM, CREST, SHIELD, CALLER_A, CALLER_B };
export const CONCEPT_INFO = {
  VANE: 'Aero racer. Swept tail, wraparound band display, single keel.',
  MASK: 'The face is one black-glass shield. Cowl shell, pointed chin, twin crest lines.',
  HALO: 'A display ring wraps the whole head: the pick reads from every angle.',
  PRISM: 'Machined facets, 30-degree chamfers, hex window, temple status slits.',
  CREST: 'Arena helmet: cheek guards, V-brow window, a light-blade crest.',
  SHIELD: 'Soft facets with crisp creases around one full-face black-glass pane. Twin crest lines.',
  CALLER_A: 'Pick-shaped face, raked profile, ducktail. One glass face. Twin fins: the Y double stroke.',
  CALLER_B: 'Pick-shaped face, raked profile, ducktail. One glass face. Flush twin light-lines.',
};

export function conceptModel(name) {
  return COMMON + CONCEPTS[name] + /* glsl */ `
vec2 map(vec3 p) {
  vec2 h = helmet(p);
  vec2 b = bustBody(p);
  return h.x < b.x ? h : b;
}
void surface(inout Surf s) {
  if (s.mat == MAT_SUIT || s.mat == MAT_TRIM) bustSurface(s); else helmetSurface(s);
}
`;
}
export const BUST_BOX = [[-0.95, -2.3, -0.8], [0.95, 0.82, 0.62]];
