// The ground: paper with washi fibre that sumi ink drops land on, spread and swirl through until the frame is
// sumi (the first ad's ink flood, paper into sumi as the match starts). Once flooded, the ink keeps turning slowly
// in faint tonal swirls: the dark ground the players sit around. One WebGL pass, pure function of time.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; vUv.y = 1.0-vUv.y; gl_Position = vec4(aPos,0.,1.); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uT; uniform float uFlood; uniform float uSwirl; uniform float uLight;
uniform vec2 uLightC; uniform float uLightR; uniform vec3 uLightCol;
uniform vec4 uDrops[6];   // x, y (frame units, y scaled by aspect), t0, radius
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),u.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return s; }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
void main(){
  float asp = uRes.y/uRes.x;
  vec2 p = vec2(vUv.x, vUv.y*asp);
  // paper: warm off-white with washi fibre
  float fib = fbm(vec2(p.x*90., p.y*9.)) * .5 + fbm(p*40.) * .5;
  vec3 paper = vec3(0.949,0.925,0.878) - 0.05*fib + 0.02*(h(p*900.)-.5);
  // ink coverage from the drops: each spreads with a ragged, swirled edge
  float ink = 0.0, rim = 0.0, bleed = 0.0, fresh = 0.0;
  // the water the ink lands in moves: a slow warp of the whole field
  p += 0.045 * (vec2(fbm(p*3.5 + uT*0.35), fbm(p*3.5 + 5.2 - uT*0.3)) - .5) * (1. - uFlood);
  for(int i=0;i<6;i++){
    vec4 d = uDrops[i];
    float tt = max(0., uT - d.z);
    if (d.w <= 0. || tt <= 0.) continue;
    float r = d.w * (1. - exp(-tt*3.2)) * (0.25 + 0.75*min(1., tt*6.));
    vec2 q = p - d.xy;
    float L = length(q);
    q = rot(uSwirl * 4.0 * exp(-L*2.2) * (1. - exp(-tt*1.5))) * q;   // the swirl: tighter near the drop
    float ang = atan(q.y, q.x);
    float fingers = pow(fbm(vec2(ang*2.2 + float(i)*3.1, L*4. - tt*0.6)), 2.2) * 1.1;
    float e = r * (1. + 0.38*(fbm(q*5. + float(i)*7.1) - .5) + fingers + 0.1*(fbm(q*26.)-.5));
    float c = smoothstep(e + .0025, e - .0025, L);
    ink = max(ink, c);
    rim = max(rim, smoothstep(.02, 0., abs(L - e)) * (1. - c*.5));
    bleed = max(bleed, smoothstep(e + .06, e, L));
    // fresh ink: tonal swirls that settle as it dries
    fresh = max(fresh, c * exp(-tt*1.1));
  }
  ink = max(ink, uFlood);
  // sumi: warm black, with slow turning tonal swirls (domain-warped fbm)
  vec2 w = p*2.2;
  vec2 warp = vec2(fbm(w + uT*0.05), fbm(w + 4.7 - uT*0.04));
  w = rot(uSwirl*0.6 + uT*0.03) * (w - vec2(.5,.9)) + vec2(.5,.9);
  float sm = fbm(w*1.6 + warp*2.4 + uT*0.06);
  float tend = smoothstep(.52, .78, sm);
  vec3 sumi = vec3(0.059,0.051,0.043) + vec3(0.075,0.066,0.055)*tend + 0.012*(h(p*700.+uT)-.5);
  // wet ink shows its swirl: lighter washes turning inside the fresh drop
  float wet = fbm(rot(uT*1.3)*(p-vec2(.5))*7. + warp*3.);
  sumi += vec3(0.28,0.25,0.22) * fresh * smoothstep(.42,.82,wet) * (1.-uFlood*0.7);
  // the wet edge: darker rim inside, a grey bleed into the paper outside
  vec3 pap = mix(paper, paper*0.82, bleed*(1.-ink)*0.6);
  vec3 col = mix(pap, sumi, ink);
  col = mix(col, vec3(0.03,0.026,0.022), rim*0.55*(1.-uFlood));
  // world light: a pool on the ground (the chart lighting the ring)
  float lp = smoothstep(uLightR, 0., length((p - uLightC)*vec2(1.,0.8)));
  col += uLightCol * uLight * lp * lp * (0.6 + 0.4*tend);
  // vignette
  float v = length(vUv - .5);
  col *= 1. - 0.35*smoothstep(.35, .8, v)*ink;
  o = vec4(col, 1.);
}`;

export interface Drop { x: number; y: number; t0: number; r: number }

export const InkField: React.FC<{
  W: number; H: number; t: number; drops?: Drop[]; flood?: number; swirl?: number;
  light?: number; lightAt?: [number, number]; lightR?: number; lightCol?: [number, number, number];
}> = ({ W, H, t, drops = [], flood = 1, swirl = 1, light = 0, lightAt = [0.5, 0.5], lightR = 0.5, lightCol = [0.24, 0.86, 0.52] }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const gs = useRef<{ gl: WebGL2RenderingContext; U: (n: string) => WebGLUniformLocation | null } | null>(null);
  const [h] = useState(() => delayRender('inkfield'));
  useLayoutEffect(() => {
    const gl = ref.current!.getContext('webgl2', { preserveDrawingBuffer: true })!;
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
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gs.current = { gl, U: (n) => gl.getUniformLocation(prog, n) };
    continueRender(h);
  }, [h]);
  useLayoutEffect(() => {
    if (!gs.current) return;
    const { gl, U } = gs.current;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U('uRes'), W, H);
    gl.uniform1f(U('uT'), t);
    gl.uniform1f(U('uFlood'), flood);
    gl.uniform1f(U('uSwirl'), swirl);
    gl.uniform1f(U('uLight'), light);
    const asp = H / W;
    gl.uniform2f(U('uLightC'), lightAt[0], lightAt[1] * asp);
    gl.uniform1f(U('uLightR'), lightR);
    gl.uniform3f(U('uLightCol'), ...lightCol);
    const arr = new Float32Array(24);
    drops.slice(0, 6).forEach((d, i) => arr.set([d.x, d.y * asp, d.t0, d.r], i * 4));
    gl.uniform4fv(U('uDrops'), arr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />;
};
