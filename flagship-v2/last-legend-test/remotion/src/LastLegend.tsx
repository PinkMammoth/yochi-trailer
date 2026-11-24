// LAST LEGEND, the fallen champion: a two-pose performance test. Pure Remotion 2.5D, one shot.
//
// Two approved paintings on one canvas: Pose A (the collapse) and Pose B (the defiance), registered by SIFT to a
// similarity of scale 0.9986, rotation 0.00 deg, 0.76 px median residual (tools/register.py). Below the chest they are
// the same painting to under a pixel, so the pose change is confined to a measured change region (head, neck, upper
// chest, the red cloth on his right shoulder, the right forearm: 27% of the figure; tools/layers.py).
//
// The figure is mixed per frame on a canvas at the painting's own resolution, in premultiplied space:
//     out = A * (1 - w) + B * w,   w = swap * M + body * (1 - M)
// M is the feathered change mask; its feather sits where the paintings register (1.4 px median flow), so the edge
// itself can't ghost. `swap` changes the head region (the methods below); `body` then carries the rest of the figure
// from A to B slowly, while the camera moves, so the last frames are Pose B exactly. Nothing is warped or rigged: the
// whole figure moves only as one rigid piece (settle, breath, the inhale), per the style guide's rung 4.
//
// Methods (prop `method`), all on identical frames for the comparison sheet:
//   smear            a masked in-between: over `swapFrames`, A's head region fades out and B's fades in, both with a
//                    vertical box motion-blur peaking mid-swap, A's drawn drifting up a few px and B's arriving from a
//                    few px below (the only local movement in the test; <= 10 painting px, inside the change region)
//   dissolve-masked  the same mix with no blur or drift
//   cut-masked       a one-frame swap inside the change region
//   cut-smear        (chosen) the masked cut, plus one smear frame either side: the last frame of A and the first of B
//                    carry a short vertical motion blur (and a 3-4 px drift up), the way a key-to-key head lift is
//                    in-betweened in limited animation. No frame ever holds both faces
//   dissolve-full    the crude baseline: the whole image cross-dissolves (for comparison only)
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../yochi-2p5d/remotion/src/lib';
import { PAPER, MONO, useFonts } from '../../../film/remotion/src/lib/brand';
import { brushWipe } from '../../../film/remotion/src/lib/brush';
import { Canvas2D } from '../../../film/remotion/src/lib/frame';
import { StampSeal } from '../../../film/remotion/src/lib/manga';
import { clamp, easeInOut, easeOut, lerp, mulberry, shakeAt } from '../../../film/remotion/src/lib/motion';
import { Cut, FPS, Method } from './timing';

// ------------------------------------------------------------------ geometry
const PW = 1199, PH = 1312;           // the paintings' canvas (Pose A's; Pose B is registered onto it)
const S0 = 0.754;                     // painting px -> stage px at z = 1 (the kneeling figure ~860 px tall)
const OX = 588, OY = 105;             // painting origin in stage px: his floor line (painting y 1200) lands on stage y 1010
const ANCHOR: [number, number] = [600, 1200]; // the pivot for breath and settle: where his weight meets the ground
const C: [number, number] = [960, 540];
// arena layers (crops of the approved arena painting, as received at 2000x1125; see tools/layers.py)
const BACK = { w: 1140, h: 810, s: 2.0, x: -180, y: -560, par: 0.32 }; // the DOWN side, behind the mist
const FLOOR = { w: 374, h: 95, x: -200, y: 742, wpx: 2320 };            // the paved landing he kneels on

interface Imgs { a: HTMLImageElement; b: HTMLImageElement; m: HTMLCanvasElement; mi: HTMLCanvasElement }
let cache: Promise<Imgs> | null = null;
const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function loadAll(): Promise<Imgs> {
  cache ??= Promise.all([load(staticFile('ll/pose-a-fig.png')), load(staticFile('ll/pose-b-fig-reg.png')), load(staticFile('ll/change-mask.png'))]).then(([a, b, mk]) => {
    // the mask as alpha (M) and its inverse (1 - M)
    const mk2 = (inv: boolean) => {
      const c = document.createElement('canvas'); c.width = PW; c.height = PH;
      const x = c.getContext('2d')!; x.drawImage(mk, 0, 0);
      const d = x.getImageData(0, 0, PW, PH);
      for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i]; d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = inv ? 255 - v : v; }
      x.putImageData(d, 0, 0); return c;
    };
    return { a, b, m: mk2(false), mi: mk2(true) };
  });
  return cache;
}
function useImgs() {
  const [imgs, set] = useState<Imgs | null>(null);
  const [h] = useState(() => delayRender('last-legend layers'));
  useLayoutEffect(() => { loadAll().then((v) => { set(v); continueRender(h); }); }, [h]);
  return imgs;
}

// ------------------------------------------------------------------ the figure mix
const scratch: Record<string, HTMLCanvasElement> = {};
const buf = (k: string) => { if (!scratch[k]) { const c = document.createElement('canvas'); c.width = PW; c.height = PH; scratch[k] = c; } const c = scratch[k]; c.getContext('2d')!.clearRect(0, 0, PW, PH); return c; };

/** Draws `img` into ctx restricted to `mask` (alpha), at weight `wgt`, optionally smeared vertically (box blur of
 *  `len` px in `n` taps) and offset by `dy`. Premultiplied, so several calls add up with 'lighter'. */
function masked(ctx: CanvasRenderingContext2D, img: CanvasImageSource, mask: HTMLCanvasElement, wgt: number, len = 0, dy = 0, key = 'm') {
  if (wgt <= 0.001) return;
  const c = buf(key), x = c.getContext('2d')!;
  const n = len > 0.5 ? 9 : 1;
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    x.globalAlpha = 1 / n;
    x.drawImage(img, 0, dy + (n > 1 ? (i / (n - 1) - 0.5) * len : 0));
  }
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = wgt;
  ctx.drawImage(c, 0, 0);
  ctx.globalAlpha = 1;
}

/** The first frame of Pose B for the cut methods: an integer frame, so the smear frames always straddle it. */
export const cutFrame = (cut: Cut) => Math.ceil(cut.swap * FPS + cut.swapFrames / 2 - 1e-6);
export function swapK(t: number, cut: Cut, method: Method) {
  const f = (t - cut.swap) * FPS; // frames since the swap starts
  if (method === 'cut-masked' || method === 'cut-smear') return Math.round(t * FPS) >= cutFrame(cut) ? 1 : 0;
  return clamp(f / cut.swapFrames);
}

const Figure: React.FC<{ imgs: Imgs; t: number; cut: Cut; method: Method; showMask?: boolean }> = ({ imgs, t, cut, method, showMask }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const u = swapK(t, cut, method);
  const body = easeInOut((t - cut.body0) / (cut.body1 - cut.body0));
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, PW, PH);
    const full = method === 'dissolve-full';
    const M = full ? null : imgs.m, MI = imgs.mi;
    if (full) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1 - u; ctx.drawImage(imgs.a, 0, 0);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = u; ctx.drawImage(imgs.b, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      return;
    }
    // outside the change region: A -> B slowly (body); inside: the swap
    masked(ctx, imgs.a, MI, 1 - body, 0, 0, 'o1');
    masked(ctx, imgs.b, MI, body, 0, 0, 'o2');
    const sm = method === 'smear';
    let blur = sm ? 12 * Math.sin(Math.PI * clamp(u)) : 0, dyA = sm ? -5 * u : 0, dyB = sm ? 5 * (1 - u) : 0;
    if (method === 'cut-smear') {
      const fc = Math.round(t * FPS) - cutFrame(cut); // frames from the cut (0 = first frame of B)
      blur = fc === -1 ? 9 : fc === 0 ? 11 : fc === 1 ? 4 : 0;
      dyA = fc === -1 ? -3 : 0; dyB = fc === 0 ? 4 : fc === 1 ? 1.5 : 0;
    }
    masked(ctx, imgs.a, M!, 1 - u, blur, dyA, 'i1');
    masked(ctx, imgs.b, M!, u, blur, dyB, 'i2');
    ctx.globalCompositeOperation = 'source-over';
    if (showMask) { ctx.globalAlpha = 0.45; ctx.drawImage(M!, 0, 0); ctx.globalAlpha = 1; }
  });
  return <canvas ref={ref} width={PW} height={PH} style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH }} />;
};

// ------------------------------------------------------------------ camera
function camAt(cut: Cut, t: number): [number, number, number] {
  const ks = cut.cams;
  if (t <= ks[0].t) return ks[0].c;
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t <= b.t) {
      const e = easeInOut((t - a.t) / (b.t - a.t));
      return [lerp(a.c[0], b.c[0], e), lerp(a.c[1], b.c[1], e), a.c[2] * Math.pow(b.c[2] / a.c[2], e)];
    }
  }
  return ks[ks.length - 1].c;
}
const stageTf = (cx: number, cy: number, z: number) => `translate(${C[0]}px, ${C[1]}px) scale(${z}) translate(${-cx}px, ${-cy}px)`;

// ------------------------------------------------------------------ ink in the air (the wave's wake), receding
const InkAir: React.FC<{ t: number; cut: Cut; cam: [number, number, number] }> = ({ t, cut, cam }) => (
  <Canvas2D draw={(ctx) => {
    const r = mulberry(77);
    const life = 1 - easeOut((t - cut.hit) / (cut.still - cut.hit + 0.6)); // the air clears into the stillness
    for (let i = 0; i < 90; i++) {
      const depth = 0.4 + r() * 1.6;          // >1 = nearer than him (bigger, faster, softer)
      const y0 = r() * 1080, sp = (380 + r() * 520) * depth, size = (1.2 + Math.pow(r(), 3) * 5) * depth;
      const born = cut.wave0 + r() * (cut.wave1 - cut.wave0 + 0.25);
      const age = t - born; if (age < 0) continue;
      const fade = clamp(life * 1.4 - r() * 0.4) * clamp(1 - age / (1.4 + r() * 1.4));
      if (fade <= 0.01) continue;
      const x = -40 + age * sp * Math.exp(-age * 0.55) * 1.9 + r() * 300 - (cam[0] - 972) * 0.3 * depth;
      const y = y0 + Math.sin(age * 1.7 + i) * 14 + age * 18 - (cam[1] - 548) * 0.3 * depth;
      ctx.globalAlpha = fade * (depth > 1.3 ? 0.35 : 0.7);
      ctx.fillStyle = '#16130f';
      ctx.beginPath(); ctx.ellipse(x, y, size * 1.8, size, 0.15, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }} />
);

// ------------------------------------------------------------------ the shot
export interface Props { cut: Cut; method: Method; showMask?: boolean; diag?: boolean; type?: boolean }

export const LastLegendShot: React.FC<Props> = ({ cut, method, showMask = false, diag = false, type = false }) => {
  useFonts();
  const imgs = useImgs();
  const t = useCurrentFrame() / FPS;
  const cam = camAt(cut, t);
  const [cx, cy, z] = cam;
  // impact: the house shake on the ground (<= 6 px, 0.38 s) as the wave's edge passes him
  const sh = shakeAt(t, [{ t: cut.hit, px: 6, dur: 0.38 }]);
  // the figure, rigid: the settle (the weight landing after the wave), breath fading to stillness, the inhale
  const settle = t < cut.hit ? 1 : 1 - easeOut((t - cut.hit) / (cut.settle - cut.hit));
  const dropY = -9 * settle, dropS = 1 + 0.006 * settle;
  const breathAmp = 0.0045 * (1 - easeInOut((t - (cut.still - 0.7)) / 0.7)) + 0.0025 * easeInOut((t - cut.lift1) / 0.8);
  const breath = breathAmp * Math.sin(((t - cut.hit) / 3.4) * Math.PI * 2);
  const inhale = 0.007 * easeInOut((t - cut.rise0) / (cut.swap + 0.2 - cut.rise0)) - 0.002 * easeInOut((t - cut.swap - 0.1) / 0.5);
  const sFig = dropS * (1 + breath + inhale);
  const figTf = `translate(${OX}px, ${OY + dropY}px) scale(${S0}) translate(${ANCHOR[0]}px, ${ANCHOR[1]}px) scale(${sFig}) translate(${-ANCHOR[0]}px, ${-ANCHOR[1]}px)`;
  // the loss grade: the figure greys as Beat B settles; the world (DOWN side) a little less
  const g = cut.greyMax * easeInOut((t - cut.settle) / (cut.push1 - cut.settle));
  const figFilter = `grayscale(${g}) contrast(${1 - 0.05 * g}) brightness(${1 - 0.04 * g})`;
  const worldFilter = `grayscale(${0.15 + 0.35 * g}) brightness(${0.96 - 0.06 * g})`;
  // the wave (sumi): brushWipe's clear phase, its ragged edge sweeping left to right across the frame
  const wp = lerp(0.55, 1, clamp((t - cut.wave0) / (cut.wave1 - cut.wave0)));
  const exitP = t < cut.exit0 ? 0 : clamp((t - cut.exit0) / (cut.dur - cut.exit0)) * 0.6;
  const bTf = `translate(${C[0]}px, ${C[1]}px) scale(${1 + (z - 1) * BACK.par}) translate(${-(C[0] + (cx - C[0]) * BACK.par)}px, ${-(C[1] + (cy - C[1]) * BACK.par)}px)`;
  const vign = 0.34 + 0.12 * easeInOut((t - cut.push0) / (cut.push1 - cut.push0)) - 0.08 * easeInOut((t - cut.swap) / 0.8);

  return (
    <AbsoluteFill style={{ background: '#d9cfbd', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)` }}>
        {/* far: the DOWN side of the approved arena, out of focus behind the mist */}
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: bTf, filter: worldFilter }}>
          <Img src={staticFile('ll/arena-back.png')} style={{ position: 'absolute', left: BACK.x, top: BACK.y, width: BACK.w * BACK.s, height: BACK.h * BACK.s, filter: 'blur(5px)' }} />
        </AbsoluteFill>
        {/* near: the stage (floor, mist, contact, figure), on one camera */}
        <AbsoluteFill style={{ transformOrigin: '0 0', transform: stageTf(cx, cy, z) }}>
          <div style={{ filter: worldFilter }}>
            <Img src={staticFile('ll/arena-floor.png')} style={{ position: 'absolute', left: FLOOR.x, top: FLOOR.y, width: FLOOR.wpx, height: (FLOOR.wpx * FLOOR.h) / FLOOR.w, filter: 'blur(1.4px)' }} />
            {/* the mist where the landing meets the drop beyond it */}
            <div style={{ position: 'absolute', left: -600, top: 560, width: 3200, height: 260, background: 'linear-gradient(180deg, rgba(220,212,198,0) 0%, rgba(220,212,198,0.92) 55%, rgba(214,206,192,0.0) 100%)' }} />
          </div>
          {/* contact: a soft shadow pooled under him, and the painting's own floor ink (smudges, contact shadows) */}
          <div style={{ position: 'absolute', left: OX + 40, top: OY + 1150 * S0, width: 1120 * S0, height: 120 * S0, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(22,19,15,0.55), rgba(22,19,15,0))', mixBlendMode: 'multiply' }} />
          <Img src={staticFile('ll/floor-ink-a.png')} style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: `translate(${OX}px, ${OY}px) scale(${S0})`, opacity: 0.85 }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, transformOrigin: '0 0', transform: figTf, filter: figFilter }}>
            {imgs && <Figure imgs={imgs} t={t} cut={cut} method={method} showMask={showMask} />}
          </div>
        </AbsoluteFill>
        <InkAir t={t} cut={cut} cam={cam} />
      </AbsoluteFill>
      <Grade W={1920} H={1080} vignette={vign} grain={0.4} />
      {type && cut.seal !== undefined && (
        <>
          <StampSeal t={t} t0={cut.seal} glyph="敗" x={215} y={148} size={140} fill={PAPER.out} ink={PAPER.bg} />
          <div style={{ position: 'absolute', left: 140, top: 232, fontFamily: MONO, fontWeight: 800, fontSize: 68, color: PAPER.out, opacity: clamp((t - cut.seal - 0.1) / 0.15),
            textShadow: '0 0 18px rgba(242,236,224,0.7)' }}>−75 USDC</div>
          <div style={{ position: 'absolute', left: 142, top: 322, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: PAPER.out, opacity: clamp((t - cut.seal - 0.18) / 0.15) }}>OLDGUARD</div>
        </>
      )}
      {(wp < 1 || exitP > 0) && <Canvas2D draw={(ctx) => { if (wp < 1) brushWipe(ctx, 1920, 1080, wp, [22, 19, 15], 9, 6); if (exitP > 0) brushWipe(ctx, 1920, 1080, exitP, [22, 19, 15], 4, 6); }} />}
      {diag && (
        <div style={{ position: 'absolute', left: 20, bottom: 16, fontFamily: MONO, fontSize: 22, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 10px' }}>
          {method} · t {t.toFixed(3)} · f {Math.round(t * FPS)} · swap {swapK(t, cut, method).toFixed(2)} · z {z.toFixed(2)} · grey {g.toFixed(2)}
        </div>
      )}
    </AbsoluteFill>
  );
};
