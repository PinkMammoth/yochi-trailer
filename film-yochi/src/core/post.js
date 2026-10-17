// WebGL2 post-processing, adapted from film/src/core/post.js for ink on paper.
// Inputs: a "base" canvas (the ink, opaque on the void) and a "glow" canvas (emissive light only).
// Adds what Canvas 2D cannot: the paper's fibre (static, it is the sheet, not film grain), ink bleed
// (滲み: a wide blur of the ink thresholded against the fibre, so wet ink feathers into the paper
// irregularly), granulation inside the ink, a restrained bloom from the glow layer, and a light grain.

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const DOWN = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D src; uniform vec2 texel; uniform float prefilter; uniform vec3 voidC;
vec3 tap(vec2 off){
  vec3 c = texture(src, uv + texel * off).rgb;
  if (prefilter > 0.5) c = max(pow(max(c, 0.0), vec3(2.2)) - voidC, 0.0);
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
uniform sampler2D src; uniform vec2 texel; uniform float weight;
void main(){
  vec2 d = texel;
  vec3 s = texture(src, uv + vec2(-d.x, d.y)).rgb + 2.0 * texture(src, uv + vec2(0.0, d.y)).rgb + texture(src, uv + d).rgb
         + 2.0 * texture(src, uv + vec2(-d.x, 0.0)).rgb + 4.0 * texture(src, uv).rgb + 2.0 * texture(src, uv + vec2(d.x, 0.0)).rgb
         + texture(src, uv - d).rgb + 2.0 * texture(src, uv + vec2(0.0, -d.y)).rgb + texture(src, uv + vec2(d.x, -d.y)).rgb;
  o = vec4(s / 16.0 * weight, 1.0);
}`;

const COMP = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D baseT, glowT, bloomT, bleedT, bleedWideT;
uniform vec2 res; uniform float S;
uniform float time;
uniform float bloom, glowDirect, exposure, contrast;
uniform float paper, bleed, bleedWide, gran, vignette, grain, fade, flash;
uniform vec3 voidC, paperC;
uniform vec2 shift; uniform float zoom;

float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1, 0)), u.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), u.x), u.y);
}
// paper fibre: long thin fibres in a few directions over a soft cloud, fixed to the sheet
float fibre(vec2 q){
  float f = 0.0;
  mat2 r1 = mat2(0.94, 0.34, -0.34, 0.94), r2 = mat2(0.5, -0.87, 0.87, 0.5), r3 = mat2(-0.2, 0.98, -0.98, -0.2);
  vec2 a = r1 * q, b = r2 * q, c = r3 * q;
  f += pow(vn(vec2(a.x * 0.07, a.y * 0.7)), 12.0);
  f += pow(vn(vec2(b.x * 0.06, b.y * 0.6) + 11.0), 12.0);
  f += pow(vn(vec2(c.x * 0.08, c.y * 0.8) + 37.0), 12.0) * 0.8;
  return f;
}
float cloud(vec2 q){ return vn(q * 0.012) * 0.55 + vn(q * 0.031 + 5.0) * 0.3 + vn(q * 0.09 + 9.0) * 0.15; }
vec3 lin(vec3 c){ return pow(max(c, 0.0), vec3(2.2)); }
vec3 srgb(vec3 c){ return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main(){
  vec2 px = uv * res;
  vec2 q = (px - res * 0.5) / (S * pow(zoom, 0.35)) + shift;   // sheet coordinates: stable across output sizes, easing with the camera's zoom
  vec3 b = lin(texture(baseT, uv).rgb);
  vec3 ink = max(b - voidC, 0.0);
  float li = luma(ink);
  float fib = fibre(q);
  float cl = cloud(q);
  // ink bleed (滲み): wet ink creeps a few px into the fibres around a stroke. Sample a ring around the
  // pixel at a radius the fibre noise decides, so the fringe is hairy and irregular, never a halo.
  float cap = vn(q * vec2(0.9, 0.25)) * 0.45 + vn(q * vec2(0.22, 1.1) + 3.0) * 0.35 + fib * 0.8;
  float rad = (1.0 + 4.5 * cap * cap) * S * pow(zoom, 0.35);
  vec3 nb = vec3(0.0);
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.785398 + cap * 2.0;
    nb += max(lin(texture(baseT, uv + vec2(cos(a), sin(a)) * rad / res).rgb) - voidC, 0.0);
  }
  nb /= 8.0;
  vec3 halo = nb * smoothstep(0.3, 0.75, cap) * 0.75 * bleed;
  // and a faint wide soak where a lot of ink sits
  vec3 blw = texture(bleedWideT, uv).rgb;
  float lbw = luma(blw);
  vec3 haloW = (blw / max(lbw, 1e-4)) * min(lbw * 0.6, 0.03) * smoothstep(0.2, 0.9, cap) * bleedWide;
  // granulation: pigment settles into the paper's tooth
  float tooth = 1.0 - gran * (0.5 - vn(q * 0.55)) * 0.9 - gran * (0.5 - fib) * 0.6;
  vec3 col = voidC + max(ink * tooth, max(halo, haloW));
  // the sheet itself
  col += paperC * paper * (fib * 0.55 + (cl - 0.5) * 0.5) * (1.0 - smoothstep(0.0, 0.25, li));
  col *= exposure;
  // emissive (restrained)
  vec3 g = lin(texture(glowT, uv).rgb);
  vec3 bm = texture(bloomT, uv).rgb;
  col += g * glowDirect * 0.12 + bm * bloom;
  // soft shoulder
  float m = max(col.r, max(col.g, col.b));
  float knee = 0.78;
  if (m > knee) { float mm = knee + (1.0 - knee) * (1.0 - exp(-(m - knee) / (1.0 - knee))); col *= mm / m; }
  vec3 d = srgb(col);
  d = (d - 0.5) * contrast + 0.5;
  vec2 v = uv - 0.5; v.x *= res.x / res.y;
  d *= mix(1.0, smoothstep(1.2, 0.3, length(v)), vignette);
  d += vec3(flash);
  d = mix(d, srgb(voidC), fade);
  float n = h12(floor(px / max(1.0, S * 1.5)) + vec2(floor(time * 30.0) * 13.1, 41.7)) - 0.5;
  d += n * grain * (1.0 - 0.5 * luma(d));
  o = vec4(clamp(d, 0.0, 1.0), 1.0);
}`;

export const POST_DEFAULTS = {
  bloom: 0.18, glowDirect: 1.0, exposure: 1.0, contrast: 1.02,
  paper: 0.026, bleed: 1.0, bleedWide: 0.25, gran: 0.35, vignette: 0.35, grain: 0.022, fade: 0, flash: 0,
  shift: [0, 0], zoom: 1,
};

export class Post {
  constructor(canvas, S) {
    this.canvas = canvas; this.S = S;
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
    this.glowMips = this.chain(6);
    this.baseMips = this.chain(5);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  chain(n) {
    const gl = this.gl; const out = [];
    let w = this.W, h = this.H;
    for (let i = 0; i < n; i++) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      out.push({ t, fb, w, h });
    }
    return out;
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
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    return t;
  }
  draw(prog) {
    const gl = this.gl;
    gl.useProgram(prog.p);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  blur(srcTex, mips, voidC) {
    const gl = this.gl;
    let src = srcTex, sw = this.W, sh = this.H;
    gl.disable(gl.BLEND);
    for (let i = 0; i < mips.length; i++) {
      const m = mips[i];
      gl.bindFramebuffer(gl.FRAMEBUFFER, m.fb);
      gl.viewport(0, 0, m.w, m.h);
      gl.useProgram(this.progDown.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
      gl.uniform1i(this.progDown.uni.src, 0);
      gl.uniform2f(this.progDown.uni.texel, 1 / sw, 1 / sh);
      gl.uniform1f(this.progDown.uni.prefilter, i === 0 ? 1 : 0);
      gl.uniform3fv(this.progDown.uni.voidC, voidC);
      this.draw(this.progDown);
      src = m.t; sw = m.w; sh = m.h;
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = mips.length - 2; i >= 0; i--) {
      const m = mips[i], s = mips[i + 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, m.fb);
      gl.viewport(0, 0, m.w, m.h);
      gl.useProgram(this.progUp.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.t);
      gl.uniform1i(this.progUp.uni.src, 0);
      gl.uniform2f(this.progUp.uni.texel, 1 / s.w, 1 / s.h);
      gl.uniform1f(this.progUp.uni.weight, 0.5);
      this.draw(this.progUp);
    }
    gl.disable(gl.BLEND);
  }
  run(baseCanvas, glowCanvas, P, time) {
    const gl = this.gl;
    const voidC = [7, 6, 12].map((v) => Math.pow(v / 255, 2.2));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.baseT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, baseCanvas);
    gl.bindTexture(gl.TEXTURE_2D, this.glowT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glowCanvas);
    this.blur(this.glowT, this.glowMips, [0, 0, 0]);
    this.blur(this.baseT, this.baseMips, voidC);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.W, this.H);
    const c = this.progComp; const u = c.uni;
    gl.useProgram(c.p);
    const bind = (unit, tex, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u[name], unit); };
    bind(0, this.baseT, 'baseT'); bind(1, this.glowT, 'glowT'); bind(2, this.glowMips[0].t, 'bloomT');
    bind(3, this.baseMips[0].t, 'bleedT'); bind(4, this.baseMips[2].t, 'bleedWideT');
    gl.uniform2f(u.res, this.W, this.H);
    gl.uniform1f(u.S, this.S);
    gl.uniform1f(u.time, time);
    for (const k of ['bloom', 'glowDirect', 'exposure', 'contrast', 'paper', 'bleed', 'bleedWide', 'gran', 'vignette', 'grain', 'fade', 'flash', 'zoom']) gl.uniform1f(u[k], P[k]);
    gl.uniform3fv(u.voidC, voidC);
    gl.uniform3fv(u.paperC, [0.05, 0.05, 0.065]);
    gl.uniform2fv(u.shift, P.shift);
    this.draw(c);
  }
  read(buf) {
    const gl = this.gl;
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return buf;
  }
}
