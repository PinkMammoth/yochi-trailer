// UNTOUCHABLE, the win: a mythic reveal. Her own painting on its own paper (the ink-wash ribbons can't be matted onto
// the arena: they're translucent wash on paper), extended to 16:9 with matching paper (tools/prep.py).
//
// One WebGL pass per frame:
//  - the ribbons: a displacement field that moves ONLY the free ends (ribbons, hair tips, the hem's tatters, the wind
//    strokes), weighted by distance from her rigid core (body, head, arms, sword, the ink moon and the ground have
//    weight 0 and are pixel-still). Waves travel outward along each ribbon (direction = the gradient of the distance
//    from the core), plus a slow wind drift to the left. Amplitude <= `ribbons` px at the tips. This is a local warp
//    (the style guide's rung 5), confined to cloth ends, never the figure: a documented exception for this test;
//    `ribbons: 0` is the strictly-rigid A/B.
//  - the reveal: the painting's ink blooms out of the paper from the moon outward, on a ragged wet edge.
// She never moves. Everything around her does, and at the win beat everything freezes for half a second (the motes,
// the ribbons, the sound) while she, already still, is unchanged: eerie control.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { useFonts } from '../../../film/remotion/src/lib/brand';
import { clamp } from '../../../film/remotion/src/lib/motion';
import { camAt, Motes, stageTf, WinAmount } from './common';
import meta from '../../assets/derived/layers/un.json';
import { FPS, UNCut } from './timing';

const [CW, CH] = meta.canvas;
const SU = 1080 / CH; // canvas px -> stage px (the canvas fills the stage at z = 1)
const MOON: [number, number] = [meta.painting_at[0] + meta.moon[0], meta.moon[1]];

const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }`;
const FS = `precision highp float;
uniform sampler2D img, flow, paperTex; uniform vec2 size, moon; uniform float t, amp, reveal;
varying vec2 uv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a*noise(p); p *= 2.03; a *= .5; } return s; }
void main(){
  vec2 px = uv*size;
  vec4 f = texture2D(flow, uv);
  vec2 dir = f.rg*2. - 1.; float W = f.b; float d = f.a*600.;
  vec2 perp = vec2(-dir.y, dir.x);
  float n = fbm(px/260. + vec2(t*0.12, t*0.03));
  float ph = d/38. - t*2.3 + n*3.;
  vec2 disp = W*amp*(perp*sin(ph) + dir*0.35*sin(ph*0.6 + 1.7)) + W*amp*0.7*vec2(-1., 0.12)*(n - 0.42);
  vec3 c = texture2D(img, (px - disp)/size).rgb;
  // the ink bloom: from the moon outward, ragged; a darker wet edge as it spreads
  float T = length((px - moon)/size.y)*1.05 + (fbm(px/70.) - 0.5)*0.5;
  float x = reveal*2.0 - 0.15;
  float r = smoothstep(T - 0.06, T + 0.01, x);
  float edge = smoothstep(T - 0.06, T - 0.02, x) * (1. - smoothstep(T - 0.02, T + 0.02, x));
  vec3 pap = texture2D(paperTex, uv).rgb;
  float ink = clamp((dot(pap, vec3(.333)) - dot(c, vec3(.333))) / 0.35, 0., 1.); // the wet edge only where there is ink
  c = mix(pap, c, r) * (1. - 0.2*edge*ink);
  gl_FragColor = vec4(c, 1.);
}`;

interface GLState { gl: WebGLRenderingContext; prog: WebGLProgram; ready: boolean }
let imgs: Promise<HTMLImageElement[]> | null = null;
const loadImg = (s: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = s; });

const RibbonGL: React.FC<{ t: number; amp: number; reveal: number }> = ({ t, amp, reveal }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<GLState | null>(null);
  const [loaded, setLoaded] = useState<HTMLImageElement[] | null>(null);
  const [h] = useState(() => delayRender('untouchable textures'));
  useLayoutEffect(() => {
    imgs ??= Promise.all([loadImg(staticFile('cp/un-canvas.png')), loadImg(staticFile('cp/un-flow.png')), loadImg(staticFile('cp/un-paper.png'))]);
    imgs.then((v) => { setLoaded(v); continueRender(h); });
  }, [h]);
  useLayoutEffect(() => {
    if (!loaded) return;
    if (!st.current) {
      const gl = ref.current!.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false })!;
      const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader'); return s; };
      const prog = gl.createProgram()!; gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      loaded.forEach((im, i) => {
        const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      });
      gl.uniform1i(gl.getUniformLocation(prog, 'img'), 0); gl.uniform1i(gl.getUniformLocation(prog, 'flow'), 1); gl.uniform1i(gl.getUniformLocation(prog, 'paperTex'), 2);
      st.current = { gl, prog, ready: true };
    }
    const { gl, prog } = st.current;
    gl.viewport(0, 0, CW, CH);
    gl.uniform2f(gl.getUniformLocation(prog, 'size'), CW, CH);
    gl.uniform2f(gl.getUniformLocation(prog, 'moon'), MOON[0], MOON[1]);
    gl.uniform1f(gl.getUniformLocation(prog, 't'), t);
    gl.uniform1f(gl.getUniformLocation(prog, 'amp'), amp);
    gl.uniform1f(gl.getUniformLocation(prog, 'reveal'), reveal);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
  });
  return <canvas ref={ref} width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, width: CW * SU, height: CH * SU }} />;
};

export const UntouchableShot: React.FC<{ cut: UNCut; type?: boolean; diag?: boolean }> = ({ cut, type = true, diag = false }) => {
  useFonts();
  const t = useCurrentFrame() / FPS;
  // the world's clock: stopped during the freeze
  const tw = t < cut.freeze ? t : t < cut.freeze + cut.freezeFor ? cut.freeze : t - cut.freezeFor;
  const gust = Math.exp(-Math.pow((tw - cut.gust) / 0.28, 2)); // the wind rises into the win beat
  const amp = cut.ribbons * (0.55 + 0.45 * clamp((t - cut.reveal0) / 1.2)) * (1 + 1.3 * gust);
  const reveal = clamp((t - cut.reveal0) / (cut.reveal1 - cut.reveal0));
  const cam = camAt(cut.cams, t);
  const frozen = t >= cut.freeze && t < cut.freeze + cut.freezeFor;
  return (
    <AbsoluteFill style={{ background: `rgb(${meta.paper.join(',')})`, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transformOrigin: '0 0', transform: stageTf(cam) }}>
        <RibbonGL t={tw} amp={amp} reveal={reveal} />
      </AbsoluteFill>
      <Motes t={t} n={70} seed={11} wind={-90} life={clamp((t - cut.reveal0 - 0.3) / 1.0)} cam={cam} freezeAt={cut.freeze} freezeFor={cut.freezeFor} />
      <Grade W={1920} H={1080} vignette={0.3 + (frozen ? 0.06 : 0)} grain={0.4} />
      {type && <WinAmount t={t} at={cut.amount} x={110} y={760} align="left" size={100} handle="GHOST · 40 USDC ▲ UP" amount="+52.63" ground="paper" />}
      {diag && <div style={{ position: 'absolute', left: 16, bottom: 12, fontFamily: 'monospace', fontSize: 22, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '3px 8px' }}>
        t {t.toFixed(3)} f {Math.round(t * FPS)} · world t {tw.toFixed(2)} · amp {amp.toFixed(1)} · reveal {reveal.toFixed(2)} · z {cam[2].toFixed(2)}{frozen ? ' · FROZEN' : ''}</div>}
    </AbsoluteFill>
  );
};
