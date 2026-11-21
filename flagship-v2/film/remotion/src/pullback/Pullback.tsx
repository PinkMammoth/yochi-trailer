// PULLBACK TEST: Duel Master's victory into the Grand Prediction Arena. Pure Remotion 2.5D, one shot, ~9.5 s.
//
// The camera model is a true dolly along one axis. Every plane i sits at depth L_i, measured from the FINAL camera
// in units of the distance to Duel Master's feet (L = 1). With the camera F in front of its final position,
// a plane's screen scale is  s_i = L_i / (L_i - F),  about one focus of expansion. So at the end (F = 0) every
// plane is exactly where the approved painting has it: the final frame IS the painting, and no canvas edge can show
// (every s_i >= 1 throughout). Planes nearer than the start camera (L < F0) are behind the lens at first and sweep in
// past it: natural occlusion, not fades. The platform is a ground plane, split into strips with L(y) from its
// horizon, so it foreshortens like a floor instead of scaling like a card.
//
// Figure: the approved victory pose (THE LAST STAND v2's framing and camera) hands over to the new full-body
// illustration, registered by SIFT to 1.9 px median (scale 0.786, -0.53 deg): the full-body image sits under the
// victory pose from the first frame of the retreat; the victory's bottom and left edges are feathered so the legs
// simply continue; then the upper body cross-dissolves to the full-body image while the camera is still moving.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { Grade } from '../../../../../yochi-2p5d/remotion/src/lib';
import { useFonts } from '../lib/brand';
import { FmtCtx } from '../lib/frame';
import { Motes } from '../lib/Motes';
import { clamp, easeInOut, lerp } from '../lib/motion';
import fit from '../../../../pullback-test/assets/derived/victory_to_fullbody.json';
import meta from '../../../../pullback-test/assets/derived/layers.json';

export const FPS = 60;
const BEAT = 0.34095, BAR = 4 * BEAT;
// test timeline (s): t = 0 is source bar 75 of the track (src 114.43), i.e. flagship v2's 13.13 s
export const PT = { t0Flag: 13.131, retreat: BAR, world: 5 * BAR, end: 6 * BAR, dur: 7 * BAR + 1.36 }; // retreat on bar 76, the world opens on bar 80, lands on bar 81, holds 2.7 s

const MW = meta.size[0], MH = meta.size[1], BASE = 1920 / MW;
const K = (meta as { design_scale?: number }).design_scale ?? 1; // first-master design px -> this master's px
const C: [number, number] = [960, 540];
const VA = { w: 1672, h: 941 };
// THE LAST STAND v2's victory camera (Victory.tsx): push 1.0 -> 1.045, drift +60 / -10 over 11.073-17.6 s
const duelsCam = (tf: number) => {
  const k = easeInOut((tf - 11.073) / (17.6 - 11.073));
  return { x: VA.w / 2 + 60 * k, y: VA.h / 2 - 10 * k, z: (1920 / VA.w) * (1 + 0.045 * k) };
};
const VC1 = duelsCam(PT.t0Flag + PT.retreat);

// ---- affine helpers: [a, b, c, d, e, f] maps (x, y) -> (a x + c y + e, b x + d y + f) (CSS matrix order)
type Aff = [number, number, number, number, number, number];
const mul = (A: Aff, B: Aff): Aff => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
const inv = (A: Aff): Aff => { const det = A[0] * A[3] - A[1] * A[2]; return [A[3] / det, -A[1] / det, -A[2] / det, A[0] / det, (A[2] * A[5] - A[3] * A[4]) / det, (A[1] * A[4] - A[0] * A[5]) / det]; };
const ap = (A: Aff, p: [number, number]): [number, number] => [A[0] * p[0] + A[2] * p[1] + A[4], A[1] * p[0] + A[3] * p[1] + A[5]];
const css = (A: Aff) => `matrix(${A.map((v) => v.toFixed(6)).join(',')})`;
const sim = (s: number, rad: number, tx: number, ty: number): Aff => [s * Math.cos(rad), s * Math.sin(rad), -s * Math.sin(rad), s * Math.cos(rad), tx, ty];

// victory px -> full-body px (measured), full-body px -> master px (feet on the platform circle, 150 px tall)
const M = fit.M as number[][];
const V2F: Aff = [M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2]];
const FIG = meta.figure as { size: number[]; feet: number[]; top: number };
const KF = meta.fig_height_master / (FIG.feet[1] - FIG.top);
const F2M: Aff = [KF, 0, 0, KF, meta.feet_master[0] - FIG.feet[0] * KF, meta.feet_master[1] - FIG.feet[1] * KF];
const V2M = mul(F2M, V2F);
// at the retreat's first frame: victory -> screen is THE LAST STAND's camera. Hence master -> screen for her plane:
const V2S1: Aff = [VC1.z, 0, 0, VC1.z, C[0] - VC1.x * VC1.z, C[1] - VC1.y * VC1.z];
const M2S1 = mul(V2S1, inv(V2M));
const S0 = Math.hypot(M2S1[0], M2S1[1]) / BASE; // her start magnification relative to the final frame
const TH0 = Math.atan2(M2S1[1], M2S1[0]); // the tiny roll that registers the two drawings
const QC = ap(inv(M2S1), C); // the master point under the lens at the start: the focus of expansion
const F0 = 1 - 1 / S0;

// ---- the move: perceptually even in log-scale, slow out, strong middle, long graceful landing
const bez = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
  let s = x;
  for (let i = 0; i < 10; i++) {
    const fx = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s - x;
    const dx = 3 * (1 - s) * (1 - s) * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s * s * (1 - x2);
    s -= fx / (dx || 1e-6);
  }
  s = clamp(s);
  return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
};
const MOVE = bez(0.5, 0.0, 0.18, 1.0);
export const herScale = (t: number) => (t <= PT.retreat ? S0 : t >= PT.end ? 1 : Math.exp(Math.log(S0) * (1 - MOVE((t - PT.retreat) / (PT.end - PT.retreat)))));
/** master -> screen for a plane at depth L, at time t */
const planeM = (t: number, L: number): Aff => {
  const sp = herScale(t), F = 1 - 1 / sp, w = F / F0;
  const s = (L / (L - F)) * BASE, th = TH0 * w;
  const O: [number, number] = [lerp(QC[0] * BASE, C[0], w), lerp(QC[1] * BASE, C[1], w)];
  const R = sim(s, th, 0, 0);
  const q = ap(R, QC);
  return [R[0], R[1], R[2], R[3], O[0] - q[0], O[1] - q[1]];
};
const visible = (t: number, L: number) => L - (1 - 1 / herScale(t)) > 0.015;

// ---- depth of field: the subject (L = 1) sharp; far planes soft while she's large; planes very near the lens soft
const dof = (t: number, L: number) => {
  const sp = herScale(t);
  const far = L > 1 ? 7 * clamp((sp - 1.4) / 7) * clamp(Math.log(L) / Math.log(5)) : 0;
  const F = 1 - 1 / sp, rel = L < 1 ? L / (L - F) / sp : 1;
  const near = L < 1 ? 9 * clamp((rel - 1.15) / 2.5) : 0;
  return far + near;
};

const Layer: React.FC<{ src: string; t: number; L: number; clip?: [number, number]; opacity?: number }> = ({ src, t, L, clip, opacity = 1 }) => {
  if (!visible(t, L)) return null;
  const b = dof(t, L);
  return (
    <Img src={staticFile(src)} style={{ position: 'absolute', left: 0, top: 0, width: MW, height: MH, transformOrigin: '0 0', transform: css(planeM(t, L)), opacity,
      clipPath: clip ? `inset(${clip[0]}px 0 ${MH - clip[1]}px 0)` : undefined, filter: b > 0.3 ? `blur(${(b / BASE).toFixed(2)}px)` : undefined }} />
  );
};

// the platform as a true ground plane. With 1/L(y) = (y - HZ) / A, a point's screen position is
// O + BASE R (p - QC) / w with w = 1 - (F / A)(y - HZ): a projective map (homography), rendered with CSS matrix3d.
const FEET_Y = (meta.feet_master as number[])[1];
const A_G = FEET_Y - (meta as { horizon: number }).horizon;
type H3 = number[]; // row-major 3x3
const mm3 = (A: H3, B: H3): H3 => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]));
const css3 = (h: H3) => `matrix3d(${[h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, h[8]].map((v) => v.toFixed(9)).join(',')})`;
const groundH = (t: number) => {
  const sp = herScale(t), F = 1 - 1 / sp, wgt = F / F0, th = TH0 * wgt;
  const O: [number, number] = [lerp(QC[0] * BASE, C[0], wgt), lerp(QC[1] * BASE, C[1], wgt)];
  const HZ0 = (meta as { horizon: number }).horizon;
  const k = F / A_G; // w = (1 + k HZ) - k y
  const c = Math.cos(th) * BASE, sn = Math.sin(th) * BASE;
  const h31 = 0, h32 = -k, h33 = 1 + k * HZ0;
  const H: H3 = [c + O[0] * h31, -sn + O[0] * h32, -(c * QC[0] - sn * QC[1]) + O[0] * h33,
    sn + O[1] * h31, c + O[1] * h32, -(sn * QC[0] + c * QC[1]) + O[1] * h33, h31, h32, h33];
  const ymax = F > 1e-6 ? HZ0 + (1 - 0.04) / k : 1e9; // cull what has passed behind the lens (w <= 0.04)
  return { H, ymax };
};
// the close-range plate's floor, registered to the master's ground (layers.py): plate px -> master px
const PL = (meta as { plate?: { size: number[]; affine_to_master: number[] } }).plate;
const PLA: H3 | null = PL ? [PL.affine_to_master[0], 0, PL.affine_to_master[4], 0, PL.affine_to_master[3], PL.affine_to_master[5], 0, 0, 1] : null;
/** The plate carries the floor while the camera is close; it hands back to the master's floor as the master's
 *  own magnification falls toward 1.5 screen px per master px (where the master holds up). */
export const plateMix = (t: number) => (PLA ? 1 - clamp((BASE * 2.4 - BASE * herScale(t)) / (BASE * 1.2)) : 0);
// Ground and plate are rasterised inside an overflow:hidden box: that flattens their 3D (matrix3d) transforms, so
// ordinary paint order applies again. (Without it Chrome composited the ground ABOVE her: the v1 lower-body loss.)
const Ground: React.FC<{ t: number }> = ({ t }) => {
  const g = groundH(t);
  const cut = Math.max(0, MH - Math.min(MH, g.ymax));
  const pm = plateMix(t);
  // the master's floor near her feet is still magnified >2x early on; a light softening proportional to it
  const soft = 0.5 * clamp((herScale(t) - 2) / 4) * K;
  const pSoft = 0.6 * clamp((BASE * herScale(t) / 1.42 - 1.6) / 3);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile('pullback/platform.png')} style={{ position: 'absolute', left: 0, top: 0, width: MW, height: MH, transformOrigin: '0 0', transform: css3(g.H), clipPath: `inset(0 0 ${cut}px 0)`, filter: soft > 0.05 ? `blur(${soft.toFixed(2)}px)` : undefined }} />
      {PL && PLA && pm > 0.001 && (
        <Img src={staticFile('pullback/plate-ground.png')} style={{ position: 'absolute', left: 0, top: 0, width: PL.size[0], height: PL.size[1], transformOrigin: '0 0', transform: css3(mm3(g.H, PLA)), opacity: pm,
          clipPath: `inset(0 0 ${Math.max(0, PL.size[1] - Math.min(PL.size[1], (g.ymax - PL.affine_to_master[5]) / PL.affine_to_master[3]))}px 0)`, filter: pSoft > 0.05 ? `blur(${pSoft.toFixed(2)}px)` : undefined }} />
      )}
    </div>
  );
};
// (legacy strips, kept for the A/B diagnostic: ground split into horizontal cards)
const HZ = meta.horizon;
const STRIPS = (() => {
  const out: { y0: number; y1: number; L: number }[] = [];
  let y = 640 * K;
  while (y < MH) { const h = (y < 780 * K ? 10 : 14) * K; out.push({ y0: y - 1, y1: y + h + 1, L: (FEET_Y - HZ) / (y + h / 2 - HZ) }); y += h; }
  return out;
})();

/** A light grade that sits her into the painting at the wide end (sp -> 1): a touch less saturation, a touch of the
 *  parchment's warmth. Off while she's close, so the approved close-up look is untouched. */
const wideGrade = (sp: number) => {
  const w = clamp((2.2 - sp) / 1.2);
  return w > 0.01 ? `saturate(${(1 - 0.14 * w).toFixed(3)}) sepia(${(0.07 * w).toFixed(3)}) contrast(${(1 - 0.04 * w).toFixed(3)})` : undefined;
};

export const PullbackScene: React.FC<{ t: number; slab?: boolean; diag?: boolean; strips?: boolean; hide?: string[]; grade?: boolean }> = ({ t, slab = false, diag = false, strips = false, hide = [], grade = true }) => {
  const sp = herScale(t);
  const stageA = t < PT.retreat;
  // the hand-overs, keyed to her magnification (so they move with the camera, not the clock)
  const u = (a: number, b: number) => clamp((Math.log(S0) - Math.log(sp) - a) / (b - a));
  const swapPaper = stageA ? 0 : clamp((t - PT.retreat) / 0.35); // approved painting (with its paper) -> matte composite
  const env = easeInOut(u(Math.log(1 / 0.97), Math.log(1 / 0.55))); // the world comes up behind her
  const toFull = easeInOut(u(Math.log(1 / 0.86), Math.log(1 / 0.6))); // upper body: victory -> full-body drawing
  const her = planeM(t, 1);
  const vScreen: Aff = stageA ? (() => { const c = duelsCam(PT.t0Flag + t); return [c.z, 0, 0, c.z, C[0] - c.x * c.z, C[1] - c.y * c.z] as Aff; })() : mul(her, V2M);
  const fScreen: Aff = mul(her, F2M);
  const shadowAt = ap(her, meta.feet_master as [number, number]);
  const sc = Math.hypot(her[0], her[1]);
  return (
    <AbsoluteFill style={{ background: diag ? '#ff00c8' : 'rgb(238,218,198)', overflow: 'hidden' }}>
      {/* the world, back to front */}
      <div style={{ position: 'absolute', inset: 0, opacity: env }}>
        <Layer src="pullback/sky.png" t={t} L={meta.depths.sky} />
        <Layer src="pullback/mountains.png" t={t} L={meta.depths.mountains} />
        <Layer src="pullback/valley.png" t={t} L={meta.depths.valley} />
        <Layer src="pullback/cliffR.png" t={t} L={meta.depths.cliffR} />
        <Layer src="pullback/cliffL.png" t={t} L={meta.depths.cliffL} />
        {strips ? STRIPS.map((s, i) => <Layer key={i} src="pullback/platform.png" t={t} L={s.L} clip={[s.y0, s.y1]} />) : !hide.includes('ground') && <Ground t={t} />}
        {/* contact shadow: a soft occlusion under her boots, on the platform plane */}
        <div style={{ position: 'absolute', left: shadowAt[0] - 46 * K * sc, top: shadowAt[1] - 6 * K * sc, width: 92 * K * sc, height: 13 * K * sc, borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(22,19,15,0.55), rgba(22,19,15,0.25) 45%, rgba(22,19,15,0) 72%)' }} />
      </div>
      {/* the approved painting's own paper (figure removed, edges feathered), carried with her plane and dissolving into the world */}
      {!stageA && env < 1 && <Img src={staticFile('pullback/victory-paper.png')} style={{ position: 'absolute', left: 0, top: 0, width: VA.w, height: VA.h, transformOrigin: '0 0', transform: css(vScreen), opacity: 1 - env }} />}
      {/* her plane */}
      {stageA ? <Img src={staticFile('poses/duel-master-victory.webp')} style={{ position: 'absolute', left: 0, top: 0, width: VA.w, height: VA.h, transformOrigin: '0 0', transform: css(vScreen) }} /> : null}
      {!stageA && (
        <>
          {slab && <Img src={staticFile('pullback/figure-slab.png')} style={{ position: 'absolute', left: 0, top: 0, width: FIG.size[0], height: FIG.size[1], transformOrigin: '0 0', transform: css(fScreen), opacity: env }} />}
          <Img src={staticFile('pullback/figure.png')} style={{ position: 'absolute', left: 0, top: 0, width: FIG.size[0], height: FIG.size[1], transformOrigin: '0 0', transform: css(fScreen), opacity: swapPaper, filter: wideGrade(sp) }} />
          <Img src={staticFile('pullback/victory-feathered.png')} style={{ position: 'absolute', left: 0, top: 0, width: VA.w, height: VA.h, transformOrigin: '0 0', transform: css(vScreen), opacity: swapPaper * (1 - toFull) }} />
        </>
      )}
      {/* the near planes: lantern and rocks (left), rope posts and stairs (right). They start behind the lens and sweep in past it */}
      <div style={{ position: 'absolute', inset: 0, opacity: env }}>
        {!hide.includes('fg') && <Layer src="pullback/fgL.png" t={t} L={meta.depths.fgL} />}
        {!hide.includes('fg') && <Layer src="pullback/fgR.png" t={t} L={meta.depths.fgR} />}
      </div>
      {/* the approved painting's own paper fades out from around her (only while the retreat begins) */}
      {!stageA && swapPaper < 1 && <Img src={staticFile('poses/duel-master-victory.webp')} style={{ position: 'absolute', left: 0, top: 0, width: VA.w, height: VA.h, transformOrigin: '0 0', transform: css(vScreen), opacity: 1 - swapPaper }} />}
      {/* the approved film's motes, thinning as the space opens */}
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - env * 0.7 }}><Motes t={PT.t0Flag + t} n={34} strength={0.55} tint="22,19,15" /></div>
      {grade && <Grade W={1920} H={1080} vignette={0.25} grain={0.05} />}
      {diag && (
        <div style={{ position: 'absolute', left: 20, bottom: 16, fontFamily: 'monospace', fontSize: 20, color: '#7ff3fb', background: 'rgba(0,0,0,0.6)', padding: '4px 10px' }}>
          t {t.toFixed(2)} · her scale {sp.toFixed(2)}x (S0 {S0.toFixed(2)}) · F {(1 - 1 / sp).toFixed(3)} · env {env.toFixed(2)} · victory→full {toFull.toFixed(2)}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const PullbackTest: React.FC<{ slab?: boolean; diag?: boolean; strips?: boolean; hide?: string[] }> = ({ slab, diag, strips, hide }) => {
  useFonts();
  const t = useCurrentFrame() / FPS;
  return <FmtCtx.Provider value="16:9"><PullbackScene t={t} slab={slab} diag={diag} strips={strips} hide={hide} /></FmtCtx.Provider>;
};
export const PULLBACK_INFO = { S0, F0, TH0, QC };
