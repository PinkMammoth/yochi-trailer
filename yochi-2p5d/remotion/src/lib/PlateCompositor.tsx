// One WebGL2 pass that turns a prepared character (fig + clean ground + depth [+ flow]) into a 2.5D frame:
// Catmull-Rom sampling (keeps the painting's linework crisp under upscale), depth parallax inside the ground,
// the figure as a rigid near layer (breath/sway about its anchor: never a local warp), world light (a soft
// figure shadow on the ground, a drifting light pool), optional figure light (off by default), the house
// grey / silhouette variants, and the impact layer: shockwave, gust on the free ends, ink-negative frame,
// paper-white flash. An optional behind-the-figure canvas (the slash) is sandwiched between ground and figure.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import { rgb01, tokens, type Ground } from './brand';
import type { CharacterMeta, ShotState } from './shot';

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uFig, uBg, uDepth, uFlow, uBehind;
uniform vec2 uPlate;          // plate size (px)
uniform vec2 uOrigin;         // plate origin in card px
uniform vec2 uRes;
uniform float uWinW;          // framing width, card px
uniform float uZoom; uniform vec2 uCenter, uTruck, uShake; uniform float uShakeRot;
uniform vec2 uAnchor; uniform vec2 uFigScale; uniform float uFigRot;
uniform float uGust, uTime, uHasFlow;
uniform vec2 uLight; uniform float uLightI, uShadow, uPool, uFigLight;
uniform float uFlash, uInk, uShock, uSince, uImpact; uniform vec2 uShockC;
uniform int uVariant; uniform vec3 uOut, uInkCol, uPaperCol, uSil, uGround;
uniform float uHasBehind;

vec4 cr(sampler2D tex, vec2 px){
  vec2 ts = uPlate; vec2 t1 = floor(px-0.5)+0.5; vec2 f = px-t1;
  vec2 w0 = f*(-0.5+f*(1.0-0.5*f)); vec2 w1 = 1.0+f*f*(-2.5+1.5*f);
  vec2 w2 = f*(0.5+f*(2.0-1.5*f)); vec2 w3 = f*f*(-0.5+0.5*f);
  vec2 w12 = w1+w2; vec2 t12 = (t1 + w2/w12)/ts; vec2 t0=(t1-1.0)/ts; vec2 t3=(t1+2.0)/ts;
  return texture(tex, vec2(t0.x,t0.y))*w0.x*w0.y + texture(tex, vec2(t12.x,t0.y))*w12.x*w0.y + texture(tex, vec2(t3.x,t0.y))*w3.x*w0.y
       + texture(tex, vec2(t0.x,t12.y))*w0.x*w12.y + texture(tex, vec2(t12.x,t12.y))*w12.x*w12.y + texture(tex, vec2(t3.x,t12.y))*w3.x*w12.y
       + texture(tex, vec2(t0.x,t3.y))*w0.x*w3.y + texture(tex, vec2(t12.x,t3.y))*w12.x*w3.y + texture(tex, vec2(t3.x,t3.y))*w3.x*w3.y;
}
vec4 lin(sampler2D tex, vec2 px){ return texture(tex, px/uPlate); }
vec2 cl(vec2 p){ return clamp(p, vec2(2.0), uPlate-2.0); }

// output px (centred, y down) -> plate px for a layer at depth z
vec2 toPlate(vec2 o, float z){
  float zl = 1.0 + (uZoom-1.0)*(0.45+0.65*z);
  float s = uWinW / uRes.x / zl;
  return uCenter + uTruck*z + o*s - uOrigin;
}

void main(){
  vec2 frag = vec2(vUv.x, 1.0-vUv.y)*uRes;
  vec2 o = frag - uRes*0.5;
  float c = cos(-uShakeRot), s = sin(-uShakeRot);
  o = mat2(c,-s,s,c)*o - uShake;
  // shockwave ring (impact only)
  if (uShock > 0.0) {
    vec2 dv = o - (uShockC - uRes*0.5); float d = length(dv);
    float ring = uSince*2600.0*(uRes.x/1920.0+uRes.y/1920.0)*0.5;
    float band = exp(-pow((d-ring)/90.0, 2.0))*uImpact*uShock;
    o -= normalize(dv+1e-4)*band*26.0;
  }

  // ground, with depth parallax
  float z = lin(uDepth, cl(toPlate(o, 0.15))).r;
  vec2 pb = cl(toPlate(o, z));
  vec3 bg = cr(uBg, pb).rgb;

  // figure: rigid inverse transform about the anchor (breath = scale, sway = rotation)
  vec2 an = uAnchor - uOrigin;
  vec2 p = toPlate(o, 1.0);
  vec2 d = p - an; float ca = cos(-uFigRot), sa = sin(-uFigRot);
  vec2 q = an + (mat2(ca,-sa,sa,ca)*d) / uFigScale;
  // impact gust: travelling waves on the free hair/cloth ends only, while the gust lasts
  if (uGust > 0.0 && uHasFlow > 0.5) {
    float w = lin(uFlow, cl(q)).r;
    float A = uGust*w; float t = uTime;
    vec2 D = vec2(0.45*sin(0.016*q.y + 0.004*q.x + 2.4*t + 0.7),
                  sin(0.021*q.x + 0.006*q.y + 3.1*t) + 0.45*sin(0.052*q.x - 0.017*q.y + 5.7*t + 1.3));
    q -= D*A;
  }
  q = cl(q);
  vec4 fc = cr(uFig, q);
  float alpha = clamp(lin(uFig, q).a, 0.0, 1.0);
  vec3 col = clamp(fc.rgb, 0.0, 1.0);

  // world light: the figure's soft shadow on the ground, a light pool drifting over the ground
  vec2 L = normalize(vec2(uLight.x, -uLight.y));
  float sh = 0.0;
  for (int i=0;i<5;i++){ sh += lin(uFig, cl(p + L*(16.0+float(i)*7.0))).a; }
  bg *= 1.0 - uShadow*(sh/5.0)*(1.0-alpha);
  float pool = 0.5+0.5*sin(dot(pb, vec2(0.0042,0.0021)) - uTime*0.6);
  bg *= 1.0 - 0.6*uPool + uPool*pool;

  // figure light (off by default: OPEN_DECISIONS #7)
  if (uFigLight > 0.0) {
    float rim = clamp(alpha - lin(uFig, cl(q + L*7.0)).a, 0.0, 1.0);
    rim *= smoothstep(0.10, 0.28, length(col - cr(uBg, q).rgb));
    float wash = dot((q - an)/1400.0, L);
    col *= 1.0 + uFigLight*0.13*wash*uLightI;
    col += vec3(1.0,0.92,0.78)*rim*0.42*uLightI*uFigLight;
  }
  // variants, matching film-flagship/src/lib/cast.js
  if (uVariant == 1) {          // grey: grayscale, contrast 0.72, brightness 1.1, 35% out-grey atop
    float g = dot(col, vec3(0.2126,0.7152,0.0722));
    g = ((g-0.5)*0.72+0.5)*1.1;
    col = mix(vec3(g), uOut, 0.35);
  } else if (uVariant == 2) {   // ink silhouette
    col = uSil;
  }

  // a loss greys the whole painting (house drawPlate grey: grayscale, contrast 0.7); a silhouette sits on plain ground
  if (uVariant == 1) { float gb = dot(bg, vec3(0.2126,0.7152,0.0722)); bg = vec3((gb-0.5)*0.7+0.5); }
  else if (uVariant == 2) { bg = uGround; }
  // the behind-the-figure layer (premultiplied canvas, sampled with the shake so it sits in the plate)
  if (uHasBehind > 0.5) {
    vec4 sl = texture(uBehind, (o + uRes*0.5)/uRes);
    bg = bg*(1.0-sl.a) + sl.rgb;
  }
  vec3 comp = mix(bg, col, alpha);

  comp = mix(comp, uPaperCol, uFlash*0.35);
  if (uInk > 0.5) {
    float l = dot(comp, vec3(0.299,0.587,0.114));
    comp = mix(uPaperCol, uInkCol, smoothstep(0.42, 0.52, l));
  }
  outColor = vec4(clamp(comp,0.0,1.0), 1.0);
}`;

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('failed to load ' + src));
    i.src = src;
  });
}

type GLState = { gl: WebGL2RenderingContext; prog: WebGLProgram; behindTex: WebGLTexture; U: (n: string) => WebGLUniformLocation | null };

export const PlateCompositor: React.FC<{
  meta: CharacterMeta;
  state: ShotState;
  ground: Ground;
  /** draws the behind-the-figure layer (output space, unshaken); omit for none */
  drawBehind?: (ctx: CanvasRenderingContext2D) => void;
  shockCenter?: [number, number];
}> = ({ meta, state, ground, drawBehind, shockCenter }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const behindRef = useRef<HTMLCanvasElement | null>(null);
  const gs = useRef<GLState | null>(null);
  const [ready, setReady] = useState(false);
  const { W, H } = state;

  useLayoutEffect(() => {
    const handle = delayRender('plates ' + meta.id);
    const dir = `characters/${meta.id}/`;
    const files = ['fig.png', 'bg.png', 'depth.png', meta.flow ? 'flow.png' : 'depth.png'];
    Promise.all(files.map((f) => loadImg(staticFile(dir + f))))
      .then(([fig, bg, depth, flow]) => {
        const gl = ref.current!.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false })!;
        const sh = (type: number, src: string) => {
          const x = gl.createShader(type)!;
          gl.shaderSource(x, src);
          gl.compileShader(x);
          if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x) || 'shader');
          return x;
        };
        const prog = gl.createProgram()!;
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        const U = (n: string) => gl.getUniformLocation(prog, n);
        const tex = (unit: number, img: TexImageSource, name: string, premul = false) => {
          const t = gl.createTexture()!;
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.uniform1i(U(name), unit);
          return t;
        };
        tex(0, fig, 'uFig');
        tex(1, bg, 'uBg');
        tex(2, depth, 'uDepth');
        tex(3, flow, 'uFlow');
        const bc = document.createElement('canvas');
        bc.width = W;
        bc.height = H;
        behindRef.current = bc;
        const behindTex = tex(4, bc, 'uBehind', true);
        gs.current = { gl, prog, behindTex, U };
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  }, [meta.id, meta.flow, W, H]);

  useLayoutEffect(() => {
    if (!ready || !gs.current) return;
    const { gl, behindTex, U } = gs.current;
    const st = state;
    const tk = tokens(ground);
    if (drawBehind) {
      const bc = behindRef.current!;
      const bctx = bc.getContext('2d')!;
      bctx.clearRect(0, 0, W, H);
      drawBehind(bctx);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, behindTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bc);
    }
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U('uPlate'), meta.plate.w, meta.plate.h);
    gl.uniform2f(U('uOrigin'), meta.plate.x, meta.plate.y);
    gl.uniform2f(U('uRes'), W, H);
    gl.uniform1f(U('uWinW'), st.cam.winW);
    gl.uniform1f(U('uZoom'), st.cam.zoom);
    gl.uniform2f(U('uCenter'), st.cam.cx, st.cam.cy);
    gl.uniform2f(U('uTruck'), st.cam.truckX, st.cam.truckY);
    gl.uniform2f(U('uShake'), st.cam.shakeX, st.cam.shakeY);
    gl.uniform1f(U('uShakeRot'), (st.cam.shakeRot * Math.PI) / 180);
    gl.uniform2f(U('uAnchor'), st.fig.anchor[0], st.fig.anchor[1]);
    gl.uniform2f(U('uFigScale'), st.fig.scaleX, st.fig.scaleY);
    gl.uniform1f(U('uFigRot'), st.fig.rot);
    // gust is authored in px at 1080; the plate is sampled in card px
    gl.uniform1f(U('uGust'), (st.gust * st.cam.winW) / st.W / st.unit);
    gl.uniform1f(U('uHasFlow'), meta.flow ? 1 : 0);
    gl.uniform1f(U('uTime'), st.t);
    gl.uniform2f(U('uLight'), st.light.dx, st.light.dy);
    gl.uniform1f(U('uLightI'), st.light.intensity);
    gl.uniform1f(U('uShadow'), st.light.shadow);
    gl.uniform1f(U('uPool'), st.light.pool);
    gl.uniform1f(U('uFigLight'), st.light.figure);
    gl.uniform1f(U('uFlash'), st.impact.flash);
    gl.uniform1f(U('uInk'), st.impact.inkFrame ? 1 : 0);
    gl.uniform1f(U('uShock'), st.impact.since >= 0 ? st.impact.shockwave : 0);
    gl.uniform1f(U('uSince'), Math.max(0, st.impact.since));
    gl.uniform1f(U('uImpact'), st.impact.env);
    const sc = shockCenter ?? [0.5, 0.5];
    gl.uniform2f(U('uShockC'), sc[0] * W, sc[1] * H);
    gl.uniform1i(U('uVariant'), st.variant);
    gl.uniform3f(U('uOut'), ...rgb01(tk.out));
    gl.uniform3f(U('uInkCol'), ...rgb01('#16130f'));
    gl.uniform3f(U('uPaperCol'), ...rgb01('#f1ece0'));
    gl.uniform3f(U('uSil'), ...rgb01('#16130f')); // house 'sil' = PAPER.ink on either ground
    gl.uniform3f(U('uGround'), ...rgb01(tk.bg));
    gl.uniform1f(U('uHasBehind'), drawBehind ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
  });

  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, width: W, height: H }} />;
};
