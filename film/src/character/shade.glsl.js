// Raymarch + toon shading for the character (GLSL). The model is injected: it must define
//   vec2 map(vec3 p)                    -> (distance, material)
//   void surface(inout Surf s)          -> albedo / emissive / decals for a hit
// Outputs: location 0 = lit base colour (premultiplied), location 1 = emissive (premultiplied).
import { SDF_LIB } from './sdf.glsl.js';

export const MATS = { SHELL: 1, GLASS: 2, SUIT: 3, TRIM: 4, EMIT: 5, SOLE: 6 };

export function buildFragment(model, defines = '') {
  return /* glsl */ `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
${defines}
layout(location = 0) out vec4 oBase;
layout(location = 1) out vec4 oGlow;

uniform vec2 uRes;       // render size (px, supersampled)
uniform vec2 uPP;        // principal point (render px, top-left origin)
uniform float uFocal;    // focal length (render px)
uniform vec3 uCamPos;    // model space
uniform mat3 uCam;       // columns: right, up, forward (model space)
uniform vec3 uBoxMin, uBoxMax;
uniform float uPxAngle;  // radians per render pixel (for cone AA / detail LOD)

uniform vec3 uKeyDir, uKeyCol;
uniform vec3 uRimDir, uRimCol;
uniform vec3 uRim2Dir, uRim2Col;
uniform vec3 uFillDir, uFillCol;
uniform vec3 uAmb;
uniform vec3 uFogCol; uniform float uFog;
uniform float uShadowK;
uniform float uRimT;

uniform vec3 uShell, uAccent, uSuit, uTrim, uPick, uLed;
uniform float uPickI, uLedI, uAccentI, uGloss, uShowOff;
uniform sampler2D uFace;
uniform vec2 uFaceGrid;
uniform float uTime;

#define MAT_SHELL 1.0
#define MAT_GLASS 2.0
#define MAT_SUIT 3.0
#define MAT_TRIM 4.0
#define MAT_EMIT 5.0
#define MAT_SOLE 6.0

struct Surf {
  vec3 p;        // model-space hit
  vec3 n;        // normal
  float mat;
  vec3 alb;      // albedo (linear)
  float gloss;   // specular strength
  float sharp;   // specular tightness 0..1
  float rimK;    // rim response
  vec3 emit;     // emissive colour (linear) for the glow layer
  vec3 emitBase; // what the emissive adds to the base layer (hot core)
  float line;    // panel-line darkening 0..1
  float edgeK;   // how strongly creases catch light
  float glass;   // 1 for display glass
  float px;      // world size of a pixel at the hit (for AA)
};

${SDF_LIB}

${model}

vec3 calcNormal(vec3 p, float e) {
  const vec2 k = vec2(1.0, -1.0);
  return normalize(k.xyy * map(p + k.xyy * e).x + k.yyx * map(p + k.yyx * e).x +
                   k.yxy * map(p + k.yxy * e).x + k.xxx * map(p + k.xxx * e).x);
}
float softShadow(vec3 ro, vec3 rd, float tmin, float tmax) {
  float res = 1.0, t = tmin;
  for (int i = 0; i < 24; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, uShadowK * h / t);
    t += clamp(h, 0.012, 0.3);
    if (res < 0.002 || t > tmax) break;
  }
  return clamp(res, 0.0, 1.0);
}
// discrete Laplacian of the distance field: > 0 on convex creases, < 0 in grooves
// (tetrahedral taps: sum - 4 f(p) ~ 2 e^2 laplacian; f(p) ~ 0 at the hit)
float curvature(vec3 p, float e, float c) {
  const vec2 k = vec2(1.0, -1.0);
  float sum = map(p + k.xyy * e).x + map(p + k.yyx * e).x + map(p + k.yxy * e).x + map(p + k.xxx * e).x;
  return (sum - 4.0 * c) / (2.0 * e);
}
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.014 + 0.085 * float(i);
    float d = map(p + n * h).x;
    occ += (h - d) * sca; sca *= 0.78;
  }
  return clamp(1.0 - 2.2 * occ, 0.0, 1.0);
}
vec2 boxHit(vec3 ro, vec3 rd) {
  vec3 inv = 1.0 / rd;
  vec3 t0 = (uBoxMin - ro) * inv, t1 = (uBoxMax - ro) * inv;
  vec3 tn = min(t0, t1), tf = max(t0, t1);
  return vec2(max(max(tn.x, tn.y), tn.z), min(min(tf.x, tf.y), tf.z));
}
// rectangular area light seen in reflection: axes from the light direction and a screen axis
float softbox(vec3 r, vec3 L, vec3 ax, vec2 size, float soft) {
  float c = dot(r, L);
  if (c <= 0.05) return 0.0;
  vec3 bx = normalize(ax - L * dot(ax, L)); vec3 by = cross(L, bx);
  vec2 q = vec2(dot(r, bx), dot(r, by)) / c;
  return smoothstep(soft, -soft, sdBox2(q, size) - soft);
}
vec3 toLin(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }

void main() {
  vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 rd = normalize(uCam * vec3(q.x - uPP.x, -(q.y - uPP.y), uFocal));
  vec3 ro = uCamPos;
  vec2 bh = boxHit(ro, rd);
  oBase = vec4(0.0); oGlow = vec4(0.0);
  if (bh.x > bh.y || bh.y < 0.0) return;
  float t = max(bh.x, 0.0);
  float hitT = -1.0; float mat = 0.0; float hitD = 0.0;
  int steps = 0;
  for (int i = 0; i < 200; i++) {
    steps = i;
    vec2 h = map(ro + rd * t);
    float eps = max(0.0004, t * uPxAngle * 0.35);
    if (h.x < eps) { hitT = t; mat = h.y; hitD = h.x; break; }
    t += h.x;
    if (t > bh.y) break;
  }
#ifdef SILHOUETTE
  if (hitT >= 0.0) { oBase = vec4(0.83, 0.82, 0.88, 1.0); oGlow = vec4(0.0, 0.0, 0.0, 1.0); }
  return;
#endif
#ifdef DEBUG_STEPS
  { float k = float(steps) / 120.0; oBase = vec4(k, k * 0.3, hitT < 0.0 ? 0.0 : 0.4, 1.0); oGlow = vec4(0.0, 0.0, 0.0, 1.0); return; }
#endif
  if (hitT < 0.0) return;
  vec3 p = ro + rd * hitT;
  float px = hitT * uPxAngle;
  vec3 n = calcNormal(p, max(0.0006, px * 0.5));
  vec3 v = -rd;
  if (dot(n, v) < 0.0) n = normalize(n + v * (0.01 - dot(n, v)));

  Surf s;
  s.p = p; s.n = n; s.mat = mat; s.px = px;
  s.alb = vec3(0.5); s.gloss = 0.0; s.sharp = 0.5; s.rimK = 1.0;
  s.emit = vec3(0.0); s.emitBase = vec3(0.0); s.line = 0.0; s.glass = 0.0; s.edgeK = 1.0;
  surface(s);
  n = s.n;

  float sh = 1.0;
  float ndl = dot(n, uKeyDir);
  if (ndl > -0.1) sh = softShadow(p + n * 0.004, uKeyDir, 0.01, 4.0);
  sh = smoothstep(0.25, 0.75, sh);
  float ao = calcAO(p, n);
  float cv = curvature(p, max(0.003, px * 2.5), hitD);
  float edge = smoothstep(0.12, 0.5, cv) * s.edgeK;
  float cavity = smoothstep(0.1, 0.45, -cv) * s.edgeK;

  // ---- toon lighting ------------------------------------------------------------------
  float term = smoothstep(-0.03, 0.06, ndl) * sh;                  // crisp terminator
  float form = clamp(ndl, 0.0, 1.0);
  vec3 fill = uFillCol * clamp(dot(n, uFillDir) * 0.6 + 0.4, 0.0, 1.0);
  vec3 shadeC = s.alb * (uAmb + fill);
  vec3 litC = s.alb * (uKeyCol * (0.5 + 0.5 * form) + uAmb + fill * 0.5);
  vec3 col = mix(shadeC, litC, term);
  col *= mix(0.42, 1.0, ao);

  // rim lights: a thin, crisp line on the light's side of the silhouette (as in the 2D film)
  float fres = 1.0 - clamp(dot(n, v), 0.0, 1.0);
  float r1 = smoothstep(-0.15, 0.45, dot(n, uRimDir)) * fres;
  float rim1 = smoothstep(uRimT, uRimT + 0.04, r1) * s.rimK;
  float r2 = smoothstep(-0.15, 0.45, dot(n, uRim2Dir)) * fres;
  float rim2 = smoothstep(uRimT + 0.02, uRimT + 0.065, r2) * s.rimK;
  vec3 rimC = uRimCol * rim1 + uRim2Col * rim2;

  // reflections: studio softboxes instead of round toy highlights
  vec3 rr = reflect(-v, n);
  vec3 camR = uCam[0], camU = uCam[1];
  float sbKey = softbox(rr, uKeyDir, camR, vec2(0.34, 0.075), 0.012) * sh;
  vec3 topDir = normalize(camU * 0.9 - uCam[2] * 0.25 + camR * 0.1);
  float sbTop = softbox(rr, topDir, camR, vec2(0.55, 0.035), 0.01);
  float sbRim = softbox(rr, uRimDir, camU, vec2(0.05, 0.5), 0.02);
  float sheen = pow(clamp(dot(n, normalize(uKeyDir + v)), 0.0, 1.0), 14.0) * sh;
  vec3 refl = uKeyCol * (sbKey * 0.9 + sheen * s.sharp * 0.0) + vec3(0.55, 0.62, 0.8) * sbTop * 0.35 + uRimCol * sbRim * 0.5;
  refl = mix(uKeyCol * sheen * 0.35 + uRimCol * sbRim * 0.25, refl, s.sharp);
  col += refl * s.gloss;
  col += rimC * mix(1.0, 0.7, s.glass);

  // machined edges: creases catch the key (and the rim on its side); grooves go dark
  float rimSide = smoothstep(-0.2, 0.4, dot(n, uRimDir));
  col += edge * (uKeyCol * 0.4 * (0.25 + 0.75 * term) + uRimCol * 0.45 * rimSide) * (1.0 - s.glass * 0.5);
  col *= 1.0 - cavity * 0.55;
  // glass: a dim studio environment and fresnel
  if (s.glass > 0.0) {
    float fr = 0.05 + 0.95 * pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 4.0);
    float sky = smoothstep(-0.3, 0.7, dot(rr, camU));
    vec3 env = mix(vec3(0.002, 0.002, 0.005), vec3(0.03, 0.035, 0.06), sky);
    col += env * (0.6 + 1.4 * fr) * s.glass;
  }
  col *= 1.0 - s.line;
  col += s.emitBase;

  // fog toward the world's haze
  col = mix(col, uFogCol, uFog);
  vec3 glow = s.emit * (1.0 - uFog * 0.7) + rimC * 0.07 * (1.0 - uFog);

  oBase = vec4(toSrgb(col), 1.0);
  oGlow = vec4(toSrgb(glow), 1.0);
}
`;
}

// Downsample (box filter over ss x ss) from the supersampled targets to the output canvas.
export const RESOLVE_FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform int uSS;
uniform float uCanvasH;  // output canvas height (the region sits at its top-left)
uniform float uSrcH;     // rows of the source actually rendered
out vec4 o;
void main() {
  // output pixel (top-left origin in the region) -> source texels
  vec2 q = vec2(gl_FragCoord.x, uCanvasH - gl_FragCoord.y);
  ivec2 base = ivec2(floor(q)) * uSS;
  vec4 acc = vec4(0.0);
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    if (i >= uSS || j >= uSS) continue;
    ivec2 tc = base + ivec2(i, j);
    vec4 c = texelFetch(uSrc, ivec2(tc.x, int(uSrcH) - 1 - tc.y), 0);
    // premultiply, averaging in linear light
    acc += vec4(pow(c.rgb, vec3(2.2)) * c.a, c.a);
  }
  acc /= float(uSS * uSS);
  vec3 rgb = acc.a > 0.0 ? pow(acc.rgb / acc.a, vec3(1.0 / 2.2)) : vec3(0.0);
  o = vec4(rgb * acc.a, acc.a);
}
`;
