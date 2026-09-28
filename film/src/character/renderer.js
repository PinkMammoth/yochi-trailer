// Character renderer: raymarches a signed-distance character model in WebGL2, toon-shades it in the
// film's lighting language, and composites it into the film's two layers (R.b base, R.g emissive).
// The character is modelled in its own space (y up, +z = the way it faces); the camera orbits it.
import { program, texture, FULLSCREEN_VS } from './gl.js';
import { buildFragment, RESOLVE_FS } from './shade.glsl.js';

const lin1 = (v) => Math.pow(Math.max(0, v) / 255, 2.2);
const lin = (c) => [lin1(c[0]), lin1(c[1]), lin1(c[2])];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

export const DEFAULT_LIGHTS = {
  key: { x: -0.55, y: -0.6, z: 0.75, col: [205, 228, 255], k: 1.0 },
  rim: { x: 0.85, y: -0.45, z: -0.55, col: [24, 224, 255], k: 1.0 },
  rim2: { x: -0.9, y: -0.2, z: -0.5, col: [120, 90, 255], k: 0.0 },
  fill: { x: 0.0, y: 1.0, z: 0.3, col: [40, 44, 90], k: 1.0 },
  amb: [20, 18, 36],
};

export class CharacterRenderer {
  constructor() {
    const cv = (this.canvas = document.createElement('canvas'));
    cv.width = 64; cv.height = 64;
    const gl = (this.gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, depth: false, stencil: false }));
    if (!gl) throw new Error('WebGL2 unavailable');
    gl.getExtension('EXT_color_buffer_float');
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.progs = new Map();
    this.resolve = program(gl, FULLSCREEN_VS, RESOLVE_FS);
    this.tw = 0; this.th = 0; this.fbo = null;
    this.faceTex = texture(gl, 1, 1, { filter: gl.NEAREST });
    this.stats = { px: 0, ms: 0, draws: 0 };
  }

  prog(model, defines = '') {
    const key = defines + '\n' + model;
    let p = this.progs.get(key);
    if (!p) { p = program(this.gl, FULLSCREEN_VS, buildFragment(model, defines)); this.progs.set(key, p); }
    return p;
  }

  targets(w, h) {
    const gl = this.gl;
    if (w <= this.tw && h <= this.th && this.fbo) return;
    const W = Math.max(w, this.tw), H = Math.max(h, this.th);
    if (this.fbo) { gl.deleteFramebuffer(this.fbo); gl.deleteTexture(this.tBase); gl.deleteTexture(this.tGlow); }
    this.tBase = texture(gl, W, H, { filter: gl.NEAREST });
    this.tGlow = texture(gl, W, H, { filter: gl.NEAREST });
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tBase, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.tGlow, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    this.tw = W; this.th = H;
  }

  // Camera for a draw: returns model-space camera and a projector to stage px.
  camera(o) {
    const anchor = o.anchor || [0, 0, 0];
    const yaw = o.yaw || 0, el = o.elev || 0;
    const fov = o.fov ?? 0.2;
    const fStage = (1080 / 2) / Math.tan(fov / 2);     // stage px
    const D = fStage / o.scale;                           // so that scale holds at the anchor depth
    const az = -yaw;
    const dir = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    const cam = add(anchor, mul(dir, D));
    const F = norm(sub(anchor, cam));
    let Rt = norm(cross(F, [0, 1, 0]));
    let U = cross(Rt, F);
    if (o.roll) {
      const c = Math.cos(o.roll), s = Math.sin(o.roll);
      const R2 = add(mul(Rt, c), mul(U, -s)), U2 = add(mul(Rt, s), mul(U, c));
      Rt = R2; U = U2;
    }
    const project = (pt) => {
      const v = sub(pt, cam); const z = dot(v, F);
      return [o.x + (dot(v, Rt) / z) * fStage, o.y - (dot(v, U) / z) * fStage, z];
    };
    const lightDir = (L) => norm(add(add(mul(Rt, L.x), mul(U, -L.y)), mul(F, -(L.z ?? 0))));
    return { cam, F, R: Rt, U, fStage, D, project, lightDir };
  }

  /**
   * o: { model (GLSL map/surface), defines ('#define SILHOUETTE' | '#define DEBUG_STEPS'),
   *      x, y (stage px of the anchor), scale (stage px per unit at the anchor), anchor [x,y,z],
   *      yaw, elev, fov, roll, box:[min,max] (model-space bounds), ss (supersampling 1..4),
   *      clip:[x0,y0,x1,y1] (stage px), mirror:{y, alpha} (floor reflection),
   *      lights:{key,rim,rim2,fill,amb} (directions x right, y down, z toward the camera; see DEFAULT_LIGHTS),
   *      shell, accent, suit, trim, pick, led (colours), pickI, ledI, accentI, gloss, knotI, crest, rimT,
   *      face:{data,w,h} (visor grid from face.js), fog, fogCol, shadowK, uniforms:(gl,uni,cam)=>{} }
   */
  draw(R, o) {
    const gl = this.gl;
    const t0 = performance.now();
    const cam = this.camera(o);
    const [bmin, bmax] = o.box;
    // screen bounds of the model's box
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      const c = [i & 1 ? bmax[0] : bmin[0], i & 2 ? bmax[1] : bmin[1], i & 4 ? bmax[2] : bmin[2]];
      const [sx, sy] = cam.project(c);
      x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
    }
    const clip = o.clip || [-40, -40, 1960, 1120];
    x0 = Math.max(Math.floor(x0) - 2, clip[0]); y0 = Math.max(Math.floor(y0) - 2, clip[1]);
    x1 = Math.min(Math.ceil(x1) + 2, clip[2]); y1 = Math.min(Math.ceil(y1) + 2, clip[3]);
    if (x1 <= x0 || y1 <= y0) return null;
    const S = R.S || 1, ss = Math.max(1, Math.min(4, o.ss || 2));
    const wo = Math.ceil((x1 - x0) * S), ho = Math.ceil((y1 - y0) * S);
    const wr = wo * ss, hr = ho * ss;
    this.targets(wr, hr);
    if (this.canvas.width < wo || this.canvas.height < ho) {
      this.canvas.width = Math.max(this.canvas.width, wo); this.canvas.height = Math.max(this.canvas.height, ho);
    }

    // ---- pass 1: raymarch into the supersampled MRT ---------------------------------------
    const P = this.prog(o.model, o.defines || '');
    const u = P.uni;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.viewport(0, 0, wr, hr);
    gl.disable(gl.BLEND);
    gl.useProgram(P.p);
    const k = S * ss;
    gl.uniform2f(u.uRes, wr, hr);
    gl.uniform2f(u.uPP, (o.x - x0) * k, (o.y - y0) * k);
    gl.uniform1f(u.uFocal, cam.fStage * k);
    gl.uniform3fv(u.uCamPos, cam.cam);
    gl.uniformMatrix3fv(u.uCam, false, [...cam.R, ...cam.U, ...cam.F]);
    gl.uniform3fv(u.uBoxMin, bmin); gl.uniform3fv(u.uBoxMax, bmax);
    gl.uniform1f(u.uPxAngle, 1 / (cam.fStage * k));
    const L = { ...DEFAULT_LIGHTS, ...(o.lights || {}) };
    const setL = (name, l, dflt) => {
      const d = { ...dflt, ...(l || {}) };
      if (u[`u${name}Dir`]) gl.uniform3fv(u[`u${name}Dir`], cam.lightDir(d));
      if (u[`u${name}Col`]) gl.uniform3fv(u[`u${name}Col`], mul(lin(d.col), d.k ?? 1));
    };
    setL('Key', L.key, DEFAULT_LIGHTS.key);
    setL('Rim', L.rim, DEFAULT_LIGHTS.rim);
    setL('Rim2', L.rim2, DEFAULT_LIGHTS.rim2);
    setL('Fill', L.fill, DEFAULT_LIGHTS.fill);
    gl.uniform3fv(u.uAmb, lin(L.amb || DEFAULT_LIGHTS.amb));
    gl.uniform3fv(u.uFogCol, lin(o.fogCol || [20, 18, 34]));
    gl.uniform1f(u.uFog, o.fog || 0);
    gl.uniform1f(u.uShadowK, o.shadowK ?? 12);
    if (u.uRimT) gl.uniform1f(u.uRimT, o.rimT ?? 0.72);
    const col = (name, c, d) => {
      const v = c || d;
      if (!Array.isArray(v) || v.length < 3) throw new Error(`${name}: expected [r,g,b], got ${JSON.stringify(v)}`);
      if (u[name]) gl.uniform3fv(u[name], lin(v));
    };
    col('uShell', o.shell, [44, 42, 60]);
    col('uAccent', o.accent, [24, 224, 255]);
    col('uSuit', o.suit, [26, 24, 38]);
    col('uTrim', o.trim, [60, 58, 76]);
    col('uPick', o.pick, [245, 243, 255]);
    col('uLed', o.led, [245, 243, 255]);
    const f1 = (name, v) => { if (u[name]) gl.uniform1f(u[name], v); };
    f1('uPickI', o.pickI ?? 1); f1('uLedI', o.ledI ?? 1); f1('uAccentI', o.accentI ?? 1); f1('uGloss', o.gloss ?? 1);
    f1('uShowOff', o.showOff ?? 1); f1('uTime', o.time ?? 0);
    // per-character options live in the program between draws: always reset them
    f1('uCrest', o.crest ?? 0); f1('uKnotI', o.knotI ?? 1);
    // face grid
    if (o.face) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.faceTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, o.face.w, o.face.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, o.face.data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      if (u.uFace) gl.uniform1i(u.uFace, 0);
      if (u.uFaceGrid) gl.uniform2f(u.uFaceGrid, o.face.w, o.face.h);
    }
    if (o.uniforms) o.uniforms(gl, u, cam);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ---- pass 2: resolve each layer to the canvas and composite ------------------------------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const ch = this.canvas.height;
    gl.viewport(0, ch - ho, wo, ho);
    gl.useProgram(this.resolve.p);
    gl.uniform1i(this.resolve.uni.uSS, ss);
    gl.uniform1f(this.resolve.uni.uCanvasH, ch);
    gl.uniform1f(this.resolve.uni.uSrcH, hr);
    gl.uniform1i(this.resolve.uni.uSrc, 1);
    gl.activeTexture(gl.TEXTURE1);
    const w = wo / S, h = ho / S;
    for (const [tex, ctx] of [[this.tBase, R.b], [this.tGlow, R.g]]) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      ctx.drawImage(this.canvas, 0, 0, wo, ho, x0, y0, w, h);
      // floor reflection: the same pixels flipped about a screen line, faded
      if (o.mirror) {
        ctx.save();
        ctx.globalAlpha = o.mirror.alpha ?? 0.25;
        ctx.translate(0, o.mirror.y * 2); ctx.scale(1, -1);
        ctx.drawImage(this.canvas, 0, 0, wo, ho, x0, y0, w, h);
        ctx.restore();
      }
    }
    gl.activeTexture(gl.TEXTURE0);
    this.stats.px += wr * hr; this.stats.draws++; this.stats.ms += performance.now() - t0;
    return { x0, y0, x1: x0 + w, y1: y0 + h, cam };
  }
}

let _r = null;
export function renderer() { return (_r = _r || new CharacterRenderer()); }
