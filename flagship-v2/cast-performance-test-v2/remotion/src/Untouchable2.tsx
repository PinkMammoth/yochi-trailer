// UNTOUCHABLE v2: the mythic win, on the approved landscape with the approved portrait's figure (tools/prep_un_hybrid.py).
//
// Layers (tools/prep_un_strands.py), composited in one WebGL pass per frame:
//   plate   the hybrid canvas with every free strand lifted off (the paper continued underneath)
//   T0..T2  three interleaved groups of separated strands (ribbons, hair ends, hem tatters) as ink TRANSMITTANCE:
//           out = plate x T0(p - d0) x T1(p - d1) x T2(p - d2). Ink multiplies like ink; at rest it is the painting
//   F0..F2  each group's motion field: tangent (root -> tip), s (0 root .. 1 tip, geodesic), strand id
//   core    the body occluder (hybrid pixels, alpha on the body): drawn last, so no strand ever crosses her
//   paper   blank paper, for the ink bloom
// Motion, per strand k (uniforms SP/SQ from un-strands.json): a travelling wave along the strand plus a slower
// second harmonic and a slow swing, all perpendicular to the LOCAL tangent, growing as s^1.6 (still at the root,
// largest at the tip); each strand has its own frequency, wavelength, phases and a gust delay (the wind crosses the
// frame left to right), so no two move together. A per-strand depth gives a little parallax against the camera.
// She never moves: the core is pixel-still. At the win beat the world's clock stops (ribbons, motes, sound).
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { MONO, useFonts } from '../../../film/remotion/src/lib/brand';
import { clamp } from '../../../film/remotion/src/lib/motion';
import { camAt, Motes, stageTf, WinAmount } from './common';
import meta from '../../assets/derived/layers/un-strands.json';
import { FPS, UNCut } from './timing';

const [CW, CH] = meta.canvas; const [NW, NH] = meta.native;
const SU = 1080 / CH;                               // canvas px -> stage px at z = 1
const MOON: [number, number] = [888 / meta.scale_native_per_canvas, 158 / meta.scale_native_per_canvas];
const N = 64;

const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }`;
const FS = `precision highp float;
uniform sampler2D plate, core, paperT, T0, T1, T2, F0, F1, F2;
uniform vec4 SP[${N}]; uniform vec4 SQ[${N}];
uniform vec2 size, nsize, moon, par; uniform float t, amp, reveal, wind, sweep;
varying vec2 uv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a*noise(p); p *= 2.03; a *= .5; } return s; }
const float TAU = 6.2831853;
vec2 disp(vec4 f){
  float id = floor(f.a*255. + .5);
  if (id < .5) return vec2(0.);
  vec4 P = vec4(0.), Q = vec4(0.);
  for (int i = 0; i < ${N}; i++) { if (float(i) == id) { P = SP[i]; Q = SQ[i]; } }
  // P = (amp, freq, lam, phase); Q = (phase2, depth, delay, attached)
  vec2 tg = f.rg*2. - 1.; float tl = length(tg); tg = tl > .01 ? tg/tl : vec2(1.,0.);
  vec2 nr = vec2(-tg.y, tg.x);
  float s = f.b;
  float tt = t - Q.z;
  float w1 = sin(TAU*(P.y*tt - s*P.z) + P.w);
  float w2 = sin(TAU*(1.63*P.y*tt - 1.7*s*P.z) + Q.x);
  float sw = 0.6*sin(TAU*0.19*tt + Q.x*0.7) + 0.4*sin(TAU*0.113*tt + P.w);
  float a = P.x * amp * pow(s, 1.6) * wind;
  vec2 d = nr * a * (0.6*w1 + 0.22*w2 + 0.42*sw) + tg * a * 0.16 * sin(TAU*0.5*P.y*tt + 1.3 + P.w);
  d += par * Q.y * s;                                     // a little depth against the camera
  return d;                                              // native px
}
vec3 layer(sampler2D T, sampler2D F){
  vec2 d = disp(texture2D(F, uv));
  return texture2D(T, uv - d/nsize).rgb * 1.3;
}
void main(){
  vec3 c = texture2D(plate, uv).rgb;
  c *= layer(T0, F0); c *= layer(T1, F1); c *= layer(T2, F2);
  vec4 k = texture2D(core, uv);
  c = mix(c, k.rgb, k.a);
  // the light: a slow warm sweep across the paper, crossing her as the bloom completes
  float lx = uv.x - sweep;
  c *= 1. + 0.055*exp(-lx*lx/0.03);
  // the ink bloom: from the moon outward, ragged, a darker wet edge where there is ink
  vec2 px = uv*size;
  vec3 pap = texture2D(paperT, uv).rgb;
  float T = length((px - moon)/size.y)*1.05 + (fbm(px/70.) - 0.5)*0.5;
  float x = reveal*2.1 - 0.15;
  float r = smoothstep(T - 0.06, T + 0.01, x);
  float edge = smoothstep(T - 0.06, T - 0.02, x) * (1. - smoothstep(T - 0.02, T + 0.02, x));
  float inkness = clamp((dot(pap, vec3(.333)) - dot(c, vec3(.333))) / 0.35, 0., 1.);
  c = mix(pap, c, r) * (1. - 0.2*edge*inkness);
  gl_FragColor = vec4(c, 1.);
}`;

const TEX = ['un-plate', 'un-core', 'un-paper', 'un-T0', 'un-T1', 'un-T2', 'un-F0', 'un-F1', 'un-F2'];
const NAMES = ['plate', 'core', 'paperT', 'T0', 'T1', 'T2', 'F0', 'F1', 'F2'];
let imgs: Promise<HTMLImageElement[]> | null = null;
const loadImg = (s: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = s; });

const SPv = new Float32Array(N * 4), SQv = new Float32Array(N * 4);
for (const s of meta.strands as { id: number; amp: number; freq: number; lam: number; phase: number; phase2: number; depth: number; delay: number; attached: boolean }[]) {
  SPv.set([s.amp, s.freq, s.lam, s.phase], s.id * 4); SQv.set([s.phase2, s.depth, s.delay, s.attached ? 1 : 0], s.id * 4);
}

const StrandGL: React.FC<{ t: number; amp: number; reveal: number; wind: number; sweep: number; par: [number, number] }> = ({ t, amp, reveal, wind, sweep, par }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<{ gl: WebGLRenderingContext; prog: WebGLProgram } | null>(null);
  const [loaded, setLoaded] = useState<HTMLImageElement[] | null>(null);
  const [h] = useState(() => delayRender('untouchable v2 textures'));
  useLayoutEffect(() => {
    imgs ??= Promise.all(TEX.map((n) => loadImg(staticFile(`cp/${n}.png`))));
    imgs.then((v) => { setLoaded(v); continueRender(h); });
  }, [h]);
  useLayoutEffect(() => {
    if (!loaded) return;
    if (!st.current) {
      const gl = ref.current!.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false })!;
      if (gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) < TEX.length) throw new Error('needs ' + TEX.length + ' texture units, have ' + gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
      const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader'); return s; };
      const prog = gl.createProgram()!; gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      loaded.forEach((im, i) => {
        const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        const filt = NAMES[i].startsWith('F') ? gl.NEAREST : gl.LINEAR;     // fields carry ids: never interpolated
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(prog, NAMES[i]), i);
      });
      gl.uniform4fv(gl.getUniformLocation(prog, 'SP'), SPv); gl.uniform4fv(gl.getUniformLocation(prog, 'SQ'), SQv);
      st.current = { gl, prog };
    }
    const { gl, prog } = st.current;
    const U = (n: string) => gl.getUniformLocation(prog, n);
    gl.viewport(0, 0, CW, CH);
    gl.uniform2f(U('size'), CW, CH); gl.uniform2f(U('nsize'), NW, NH); gl.uniform2f(U('moon'), MOON[0], MOON[1]); gl.uniform2f(U('par'), par[0], par[1]);
    gl.uniform1f(U('t'), t); gl.uniform1f(U('amp'), amp); gl.uniform1f(U('reveal'), reveal); gl.uniform1f(U('wind'), wind); gl.uniform1f(U('sweep'), sweep);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
  });
  return <canvas ref={ref} width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, width: CW * SU, height: CH * SU }} />;
};

export interface Payout { show: boolean; handle: string; amount: string; provisional: boolean }
export const PROVISIONAL_PAYOUT: Payout = { show: true, handle: 'GHOST · 40 USDC ▲ UP', amount: '+52.63', provisional: true };

export const Untouchable2Shot: React.FC<{ cut: UNCut; payout?: Payout; diag?: boolean }> = ({ cut, payout = PROVISIONAL_PAYOUT, diag = false }) => {
  useFonts();
  const t = useCurrentFrame() / FPS;
  const frozen = t >= cut.freeze && t < cut.freeze + cut.freezeFor;
  const tw = t < cut.freeze ? t : frozen ? cut.freeze : t - cut.freezeFor;        // the world's clock
  let wind = cut.breeze * clamp((tw - cut.reveal0 - 0.2) / 1.4);
  for (const g of cut.gusts) wind += g.k * Math.exp(-Math.pow((tw - g.t) / g.w, 2));
  const reveal = clamp((t - cut.reveal0) / (cut.reveal1 - cut.reveal0));
  const sweep = -0.2 + 1.4 * clamp((t - cut.sweep[0]) / (cut.sweep[1] - cut.sweep[0]));
  const cam0 = camAt(cut.cams, t);
  const sw = (CW * SU), sh = (CH * SU), hw = 960 / cam0[2], hh = 540 / cam0[2];
  const cam: [number, number, number] = [clamp(cam0[0], hw, sw - hw), clamp(cam0[1], hh, sh - hh), cam0[2]];
  const par: [number, number] = [-(cam[0] - 1000) * 0.03, -(cam[1] - 540) * 0.03];
  return (
    <AbsoluteFill style={{ background: '#d6c2a8', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: stageTf(cam) }}>
        <StrandGL t={tw} amp={cut.ribbons} reveal={reveal} wind={wind} sweep={sweep} par={par} />
      </AbsoluteFill>
      <Motes t={t} n={46} seed={11} wind={-80} life={0.7 * clamp((t - cut.reveal0 - 0.5) / 1.0)} cam={cam} freezeAt={cut.freeze} freezeFor={cut.freezeFor} />
      <Grade W={1920} H={1080} vignette={0.32 + (frozen ? 0.07 : 0)} grain={0.35} />
      {payout.show && (
        <>
          <WinAmount t={t} at={cut.amount} x={110} y={600} align="right" size={96} handle={payout.handle} amount={payout.amount} ground="paper" />
          {payout.provisional && <div style={{ position: 'absolute', right: 112, top: 820, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: '0.2em', color: '#8a7d6a',
            opacity: clamp((t - cut.amount - 0.2) / 0.3) }}>PROVISIONAL · FIGURES TO BE VERIFIED</div>}
        </>
      )}
      {diag && <div style={{ position: 'absolute', left: 16, top: 12, fontFamily: 'monospace', fontSize: 22, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '3px 8px' }}>
        t {t.toFixed(3)} f {Math.round(t * FPS)} · world {tw.toFixed(2)} · wind {wind.toFixed(2)} · reveal {reveal.toFixed(2)} · z {cam[2].toFixed(2)}{frozen ? ' · FROZEN' : ''}</div>}
    </AbsoluteFill>
  );
};
