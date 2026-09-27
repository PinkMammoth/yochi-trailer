// WebGL2 post-processing.
// Inputs: a "base" canvas (the scene) and a "glow" canvas (emissive light only).
// Bloom is computed from the glow layer so every glow in the film is art-directed.

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const DOWN = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D src; uniform vec2 texel; uniform float prefilter;
vec3 tap(vec2 off){
  vec3 c = texture(src, uv + texel * off).rgb;
  if (prefilter > 0.5) c = pow(max(c, 0.0), vec3(2.2)) * 1.0;
  return c;
}
void main(){
  vec3 a = tap(vec2(-2, 2)), b = tap(vec2(0, 2)), c = tap(vec2(2, 2));
  vec3 d = tap(vec2(-2, 0)), e = tap(vec2(0, 0)), f = tap(vec2(2, 0));
  vec3 g = tap(vec2(-2, -2)), h = tap(vec2(0, -2)), i = tap(vec2(2, -2));
  vec3 j = tap(vec2(-1, 1)), k = tap(vec2(1, 1)), l = tap(vec2(-1, -1)), m = tap(vec2(1, -1));
  vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  o = vec4(col, 1.0);
}`;

const UP = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D src; uniform vec2 texel; uniform float radius; uniform float weight;
void main(){
  vec2 d = texel * radius;
  vec3 s = texture(src, uv + vec2(-d.x, d.y)).rgb + 2.0 * texture(src, uv + vec2(0.0, d.y)).rgb + texture(src, uv + d).rgb
         + 2.0 * texture(src, uv + vec2(-d.x, 0.0)).rgb + 4.0 * texture(src, uv).rgb + 2.0 * texture(src, uv + vec2(d.x, 0.0)).rgb
         + texture(src, uv - d).rgb + 2.0 * texture(src, uv + vec2(0.0, -d.y)).rgb + texture(src, uv + vec2(d.x, -d.y)).rgb;
  o = vec4(s / 16.0 * weight, 1.0);
}`;

const COMP = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D baseT, glowT, bloomT, haloT;
uniform vec2 res;
uniform float time;
uniform float bloom, halo, glowDirect, exposure, contrast, satBase, satGlow;
uniform vec3 lift, gain;
uniform float ca, vignette, grain, flash, invert, fade;
uniform vec2 blurVec; uniform float zoomBlur; uniform vec2 zoomCenter;
uniform float glitch, glitchSeed;
uniform vec3 flashColor;
uniform float monoTint; uniform vec3 monoColor;

float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 lin(vec3 c){ return pow(max(c, 0.0), vec3(2.2)); }
vec3 srgb(vec3 c){ return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 sampleBase(vec2 u){
  // chromatic aberration: radial split
  vec2 dir = u - 0.5;
  float r2 = dot(dir, dir);
  vec2 off = dir * ca * (0.4 + r2 * 2.5);
  vec3 c;
  c.r = texture(baseT, u + off).r;
  c.g = texture(baseT, u).g;
  c.b = texture(baseT, u - off).b;
  return c;
}
vec3 sampleGlow(vec2 u){
  vec2 dir = u - 0.5;
  float r2 = dot(dir, dir);
  vec2 off = dir * ca * (0.4 + r2 * 2.5);
  vec3 c;
  c.r = texture(glowT, u + off).r;
  c.g = texture(glowT, u).g;
  c.b = texture(glowT, u - off).b;
  return c;
}

void main(){
  vec2 u = uv;
  // glitch: displaced horizontal slices
  if (glitch > 0.0) {
    float band = floor(u.y * 38.0);
    float r = h12(vec2(band, glitchSeed));
    if (r < glitch * 0.6) u.x += (h12(vec2(band + 7.0, glitchSeed)) - 0.5) * 0.12 * glitch;
  }
  vec3 b = vec3(0.0), g = vec3(0.0);
  float blen = length(blurVec);
  if (blen > 0.0005 || zoomBlur > 0.0005) {
    const int N = 24;
    float wsum = 0.0;
    for (int i = 0; i < N; i++) {
      float k = (float(i) / float(N - 1)) - 0.5;
      float w = 1.0 - abs(k) * 1.2;
      vec2 su = u + blurVec * k + (u - zoomCenter) * zoomBlur * k;
      b += lin(texture(baseT, su).rgb) * w; g += lin(texture(glowT, su).rgb) * w; wsum += w;
    }
    b /= wsum; g /= wsum;
  } else {
    b = lin(sampleBase(u)); g = lin(sampleGlow(u));
  }
  // grade the base
  float lb = luma(b);
  b = mix(vec3(lb), b, satBase);
  b = b * exposure;
  vec3 col = b;
  // emissive layers
  float lg = luma(g);
  g = mix(vec3(lg), g, satGlow);
  vec3 bl = texture(bloomT, uv).rgb; float lbl = luma(bl); bl = mix(vec3(lbl), bl, satGlow);
  vec3 hl = texture(haloT, uv).rgb;  float lhl = luma(hl); hl = mix(vec3(lhl), hl, satGlow);
  col += g * glowDirect * exposure + bl * bloom * exposure + hl * halo * exposure;
  // mono tint (used for frozen time)
  if (monoTint > 0.0) {
    float l = luma(col);
    col = mix(col, monoColor * l * 1.6, monoTint);
  }
  // hue-preserving filmic shoulder
  float m = max(col.r, max(col.g, col.b));
  float knee = 0.72;
  if (m > knee) {
    float mm = knee + (1.0 - knee) * (1.0 - exp(-(m - knee) / (1.0 - knee)));
    col *= mm / m;
    float over = clamp((m - 1.0) / 4.0, 0.0, 1.0);
    col = mix(col, vec3(mm), over * 0.55);
  }
  // contrast in display space + lift/gain
  vec3 d = srgb(col);
  d = (d - 0.5) * contrast + 0.5;
  d = d * gain + lift * (1.0 - d);
  // vignette
  vec2 q = uv - 0.5; q.x *= res.x / res.y;
  float v = smoothstep(1.15, 0.25, length(q));
  d *= mix(1.0, v, vignette);
  // impact frame
  d = mix(d, vec3(1.0) - d, invert);
  d += flashColor * flash;
  d *= (1.0 - fade);
  // grain, luminance weighted
  float n = h12(uv * res + vec2(time * 61.3, time * 17.9)) - 0.5;
  float n2 = h12(uv * res * 0.5 + vec2(time * 13.1, time * 41.7)) - 0.5;
  float gw = 1.0 - 0.6 * luma(d);
  d += (n * 0.7 + n2 * 0.5) * grain * gw;
  o = vec4(clamp(d, 0.0, 1.0), 1.0);
}`;

export const POST_DEFAULTS = {
  bloom: 0.9, halo: 0.35, glowDirect: 1.0, exposure: 1.0, contrast: 1.04,
  satBase: 1.0, satGlow: 1.0, lift: [0.012, 0.010, 0.022], gain: [1, 1, 1],
  ca: 0.0018, vignette: 0.55, grain: 0.045, flash: 0, invert: 0, fade: 0,
  blurVec: [0, 0], zoomBlur: 0, zoomCenter: [0.5, 0.5], glitch: 0, glitchSeed: 0,
  flashColor: [1, 1, 1], monoTint: 0, monoColor: [0.75, 0.9, 1.0],
};

export class Post {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    this.W = canvas.width; this.H = canvas.height;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.progDown = this.program(DOWN);
    this.progUp = this.program(UP);
    this.progComp = this.program(COMP);
    this.baseT = this.tex(); this.glowT = this.tex();
    // bloom chain at 1/2 .. 1/64
    this.mips = [];
    let w = this.W, h = this.H;
    for (let i = 0; i < 6; i++) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      this.mips.push({ t, fb, w, h });
    }
    // a copy of the halo level (mip 3 after upsampling contains deep levels)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  program(fs) {
    const gl = this.gl;
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const uni = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); uni[info.name] = gl.getUniformLocation(p, info.name); }
    return { p, uni };
  }
  tex() {
    const gl = this.gl; const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  draw(prog) {
    const gl = this.gl;
    gl.useProgram(prog.p);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  run(baseCanvas, glowCanvas, P, time) {
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.baseT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, baseCanvas);
    gl.bindTexture(gl.TEXTURE_2D, this.glowT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glowCanvas);
    gl.disable(gl.BLEND);
    // downsample chain
    let src = this.glowT, sw = this.W, sh = this.H;
    for (let i = 0; i < this.mips.length; i++) {
      const m = this.mips[i];
      gl.bindFramebuffer(gl.FRAMEBUFFER, m.fb);
      gl.viewport(0, 0, m.w, m.h);
      gl.useProgram(this.progDown.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
      gl.uniform1i(this.progDown.uni.src, 0);
      gl.uniform2f(this.progDown.uni.texel, 1 / sw, 1 / sh);
      gl.uniform1f(this.progDown.uni.prefilter, i === 0 ? 1 : 0);
      this.draw(this.progDown);
      src = m.t; sw = m.w; sh = m.h;
    }
    // upsample with additive blend
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = this.mips.length - 2; i >= 0; i--) {
      const m = this.mips[i], s = this.mips[i + 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, m.fb);
      gl.viewport(0, 0, m.w, m.h);
      gl.useProgram(this.progUp.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.t);
      gl.uniform1i(this.progUp.uni.src, 0);
      gl.uniform2f(this.progUp.uni.texel, 1 / s.w, 1 / s.h);
      gl.uniform1f(this.progUp.uni.radius, 1.0);
      gl.uniform1f(this.progUp.uni.weight, 1.0);
      this.draw(this.progUp);
    }
    gl.disable(gl.BLEND);
    // composite
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.W, this.H);
    const c = this.progComp; const u = c.uni;
    gl.useProgram(c.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.baseT); gl.uniform1i(u.baseT, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.glowT); gl.uniform1i(u.glowT, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.mips[0].t); gl.uniform1i(u.bloomT, 2);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.mips[3].t); gl.uniform1i(u.haloT, 3);
    const f1 = (k) => gl.uniform1f(u[k], P[k]);
    gl.uniform2f(u.res, this.W, this.H);
    gl.uniform1f(u.time, time);
    ['bloom', 'halo', 'glowDirect', 'exposure', 'contrast', 'satBase', 'satGlow', 'ca', 'vignette', 'grain', 'flash', 'invert', 'fade', 'zoomBlur', 'glitch', 'glitchSeed', 'monoTint'].forEach(f1);
    gl.uniform3fv(u.lift, P.lift); gl.uniform3fv(u.gain, P.gain);
    gl.uniform2fv(u.blurVec, P.blurVec); gl.uniform2fv(u.zoomCenter, P.zoomCenter);
    gl.uniform3fv(u.flashColor, P.flashColor); gl.uniform3fv(u.monoColor, P.monoColor);
    this.draw(c);
  }
  read(buf) {
    const gl = this.gl;
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return buf;
  }
}
