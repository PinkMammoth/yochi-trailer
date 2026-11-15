// Implementation A: pure Remotion 2.5D.
// One WebGL2 pass composites the derived plates (inpainted background + depth, character
// with matte + motion weights) through a parallax camera, with inverse warps for breath,
// head and wind, a moving key light (rim + cast shadow + directional wash), the ink slash
// sandwiched between background and figure, a shockwave, and grain. Every frame is a pure
// function of the frame number.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { CANVAS, H, IMPACT, W, WINDOW, camera, impactEnv, light, performance } from '../shared/timeline';
import { drawSlash, slashCenter } from '../shared/slash';

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uChar, uBg, uDepth, uWts, uSlash;
uniform vec2 uCanvas, uRes;
uniform float uWinW;
uniform float uZoom; uniform vec2 uCenter, uTruck, uShake; uniform float uShakeRot;
uniform float uBreathScale, uBreathLift, uBreathShift, uHeadRot, uHeadLift, uWind, uTime;
uniform vec2 uLight; uniform float uLightI, uFlash;
uniform float uImpact, uSinceImpact; uniform vec2 uShockC; uniform float uInkFrame;
uniform vec2 uNeck, uChest;

vec4 cr(sampler2D tex, vec2 px){ // Catmull-Rom (9 bilinear taps), px in canvas pixels
  vec2 ts = uCanvas;
  vec2 sp = px; vec2 t1 = floor(sp-0.5)+0.5; vec2 f = sp-t1;
  vec2 w0 = f*(-0.5+f*(1.0-0.5*f)); vec2 w1 = 1.0+f*f*(-2.5+1.5*f);
  vec2 w2 = f*(0.5+f*(2.0-1.5*f)); vec2 w3 = f*f*(-0.5+0.5*f);
  vec2 w12 = w1+w2; vec2 t12 = (t1 + w2/w12)/ts; vec2 t0=(t1-1.0)/ts; vec2 t3=(t1+2.0)/ts;
  vec4 r = texture(tex, vec2(t0.x,t0.y))*w0.x*w0.y + texture(tex, vec2(t12.x,t0.y))*w12.x*w0.y + texture(tex, vec2(t3.x,t0.y))*w3.x*w0.y
         + texture(tex, vec2(t0.x,t12.y))*w0.x*w12.y + texture(tex, vec2(t12.x,t12.y))*w12.x*w12.y + texture(tex, vec2(t3.x,t12.y))*w3.x*w12.y
         + texture(tex, vec2(t0.x,t3.y))*w0.x*w3.y + texture(tex, vec2(t12.x,t3.y))*w12.x*w3.y + texture(tex, vec2(t3.x,t3.y))*w3.x*w3.y;
  return r;
}
vec4 lin(sampler2D tex, vec2 px){ return texture(tex, px/uCanvas); }
vec2 clampPx(vec2 p){ return clamp(p, vec2(2.0), uCanvas-2.0); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }

// output px (centred, y down) -> canvas px for a layer at depth z (0 far .. 1 near)
vec2 toCanvas(vec2 o, float z){
  float zl = 1.0 + (uZoom-1.0)*(0.45+0.65*z);
  float s = uWinW / uRes.x / zl;
  return uCenter + uTruck*z + o*s;
}

void main(){
  vec2 frag = vec2(vUv.x, 1.0-vUv.y)*uRes;
  vec2 o = frag - uRes*0.5;
  // camera shake (rotation + translation), applied to everything in the plate
  float c = cos(-uShakeRot), s = sin(-uShakeRot);
  o = mat2(c,-s,s,c)*o - uShake;
  // shockwave: a ring of radial displacement from the slash centre
  vec2 sc = uShockC - uRes*0.5;
  vec2 dv = o - sc; float dist = length(dv);
  float ring = uSinceImpact*2600.0;
  float band = exp(-pow((dist-ring)/90.0, 2.0)) * uImpact;
  o -= normalize(dv+1e-4)*band*26.0;

  // ---- background with depth parallax
  vec2 pb0 = toCanvas(o, 0.15);
  float z = lin(uDepth, clampPx(pb0)).r;
  vec2 pb = clampPx(toCanvas(o, z));
  vec3 bg = cr(uBg, pb).rgb;

  // ---- character (near layer) with inverse warps
  vec2 p = toCanvas(o, 1.0);
  vec3 wts = lin(uWts, clampPx(p)).rgb; // r hair, g head, b chest
  // head: rotate about the neck pivot, and lift
  float a = radians(uHeadRot)*wts.g;
  vec2 d = p-uNeck; float ca=cos(-a), sa=sin(-a);
  vec2 q = uNeck + mat2(ca,-sa,sa,ca)*d;
  q.y += uHeadLift*wts.g;
  // breathing: the ribcage expands upward from the chest centre, shoulders rise
  float b = wts.b;
  q.y = uChest.y + (q.y-uChest.y)/(1.0+uBreathScale*b);
  q.y += uBreathLift*b; q.x -= uBreathShift*b;
  // wind: travelling waves along the streaming hair and ribbons, toward the free ends
  float A = 5.0*uWind*wts.r;
  float t = uTime;
  vec2 D;
  D.y = A*(sin(0.021*q.x + 0.006*q.y + 3.1*t) + 0.45*sin(0.052*q.x - 0.017*q.y + 5.7*t + 1.3));
  D.x = A*0.45*(sin(0.016*q.y + 0.004*q.x + 2.4*t + 0.7));
  q -= D;
  q = clampPx(q);
  vec4 ch = cr(uChar, q);
  float alpha = clamp(lin(uChar, q).a, 0.0, 1.0);
  vec3 col = clamp(ch.rgb, 0.0, 1.0);

  // ---- light: rim on the edges that face the key, a directional wash, a cast shadow
  vec2 L = normalize(uLight);
  float aT = lin(uChar, clampPx(q + L*7.0)).a;
  float rim = clamp(alpha - aT, 0.0, 1.0);
  // only where the figure really separates from what is behind it (not on matte seams
  // where the figure plate and the background are the same moon)
  vec3 behind = cr(uBg, q).rgb;
  rim *= smoothstep(0.10, 0.28, length(col - behind));
  vec3 rimCol = vec3(1.0, 0.92, 0.78);
  float wash = dot((q - vec2(760.0, 330.0))/700.0, L);
  col *= 0.93 + 0.13*wash*uLightI;
  col += rimCol*rim*0.42*uLightI;
  // the figure's shadow falls on the background away from the light
  float sh = 0.0;
  for(int i=0;i<5;i++){
    vec2 off = L*(16.0+float(i)*7.0);
    sh += lin(uChar, clampPx(toCanvas(o, 1.0) + off)).a;
  }
  sh /= 5.0;
  bg *= 1.0 - 0.22*sh*(1.0-alpha);
  // slow light pool drifting across the plate
  float pool = 0.5+0.5*sin(dot(pb, vec2(0.0042,0.0021)) - t*0.6);
  bg *= 0.95 + 0.07*pool;

  // ---- slash between background and figure (premultiplied canvas)
  vec4 sl = texture(uSlash, (o + uRes*0.5)/uRes);
  bg = bg*(1.0-sl.a) + sl.rgb;

  vec3 comp = mix(bg, col, alpha);

  // impact flash: paper-white lift, then a 2-frame ink negative (manga impact frame)
  comp = mix(comp, vec3(1.0,0.97,0.91), uFlash*0.35);
  if (uInkFrame > 0.5) {
    float l = dot(comp, vec3(0.299,0.587,0.114));
    float ink = smoothstep(0.42, 0.52, l);
    comp = mix(vec3(0.945,0.925,0.878), vec3(0.086,0.075,0.059), ink);
  }
  // (vignette and grain come from the shared Grade overlay, identical for A and B)
  outColor = vec4(clamp(comp,0.0,1.0), 1.0);
}`;

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

export const WarpShot: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const slashRef = useRef<HTMLCanvasElement | null>(null);
  const glState = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('plates'));

  useEffect(() => {
    (async () => {
      const [ch, bg, dp, wt] = await Promise.all(
        ['char.png', 'bg.png', 'bg_depth.png', 'weights.png'].map((f) => loadImg(staticFile(f))),
      );
      const gl = ref.current!.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false })!;
      const mk = (type: number, src: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
        return sh;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      const tex = (unit: number, img: TexImageSource, name: string, premul = false) => {
        const t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(prog, name), unit);
        return t;
      };
      tex(0, ch, 'uChar');
      tex(1, bg, 'uBg');
      tex(2, dp, 'uDepth');
      tex(3, wt, 'uWts');
      const sc = document.createElement('canvas');
      sc.width = W;
      sc.height = H;
      slashRef.current = sc;
      const slashTex = tex(4, sc, 'uSlash', true);
      glState.current = { gl, prog, slashTex };
      setReady(true);
      continueRender(handle);
    })().catch((e) => {
      console.error(e);
      throw e;
    });
  }, [handle]);

  useLayoutEffect(() => {
    if (!ready) return;
    const { gl, prog, slashTex } = glState.current;
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const cam = camera(frame);
    const perf = performance(frame);
    const li = light(frame);
    // slash layer (output space, premultiplied)
    const sc = slashRef.current!;
    const sctx = sc.getContext('2d')!;
    sctx.clearRect(0, 0, W, H);
    drawSlash(sctx, frame);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, slashTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sc);

    gl.viewport(0, 0, W, H);
    gl.uniform2f(U('uCanvas'), CANVAS.w, CANVAS.h);
    gl.uniform2f(U('uRes'), W, H);
    gl.uniform1f(U('uWinW'), WINDOW.w);
    gl.uniform1f(U('uZoom'), cam.zoom);
    gl.uniform2f(U('uCenter'), cam.cx, cam.cy);
    gl.uniform2f(U('uTruck'), cam.truckX, cam.truckY);
    gl.uniform2f(U('uShake'), cam.shakeX, cam.shakeY);
    gl.uniform1f(U('uShakeRot'), (cam.shakeRot * Math.PI) / 180);
    gl.uniform1f(U('uBreathScale'), perf.breathScale);
    gl.uniform1f(U('uBreathLift'), perf.breathLift);
    gl.uniform1f(U('uBreathShift'), perf.breathShift);
    gl.uniform1f(U('uHeadRot'), perf.headRot);
    gl.uniform1f(U('uHeadLift'), perf.headLift);
    gl.uniform1f(U('uWind'), perf.wind);
    gl.uniform1f(U('uTime'), perf.time);
    gl.uniform2f(U('uLight'), li.dx, -li.dy);
    gl.uniform1f(U('uLightI'), li.intensity);
    gl.uniform1f(U('uFlash'), li.flash);
    const since = Math.max(0, (frame - IMPACT) / 30);
    gl.uniform1f(U('uImpact'), frame >= IMPACT ? impactEnv(frame) : 0);
    gl.uniform1f(U('uSinceImpact'), since);
    const c = slashCenter();
    gl.uniform2f(U('uShockC'), c.x, c.y);
    gl.uniform1f(U('uInkFrame'), frame === IMPACT || frame === IMPACT + 1 ? 1 : 0);
    gl.uniform2f(U('uNeck'), 760, 470);
    gl.uniform2f(U('uChest'), 720, 700);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
  }, [frame, ready]);

  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, width: W, height: H }} />;
};
