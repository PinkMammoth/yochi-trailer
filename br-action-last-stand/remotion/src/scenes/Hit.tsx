// 5.455-8.0: the slam-in on mira, THE HIT, the knockback, and the result. The hit lands on paper: a ground switch
// on drop 2's big hit (the paper-white impact frame opens into the page the ink lands on).
import React, { useMemo } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { drawSlash, type ShotSpec } from '../../../../yochi-2p5d/remotion/src/lib';
import { DELA, MONO, PAPER, SUMI, UP_PAPER } from '../lib/brand';
import { broadStroke, splatter } from '../lib/brush';
import { Canvas2D } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { clamp, easeIn, easeInOut, easeOut, hash, lerp, mulberry, riseK, shakeAt, slamK, smooth } from '../lib/motion';
import { Shot, StampSeal, focusLines, speedLines, useImage, type Pt } from '../lib/manga';
import { FPS, MATCH, T, fr } from '../data';

const L = MATCH.left, R = MATCH.right;

// ---------------------------------------------------------------- 7. the slam-in: mira, focus lines, Dutch angle
export const Strike: React.FC = () => {
  const S = T.strike;
  const f = useCurrentFrame();
  const t = S.start + f / FPS;
  const dur = Math.max(1, fr(S.hit - S.start));
  const p = clamp(f / dur);
  const spec: ShotSpec = {
    character: R.character, format: '16:9', fps: FPS, durationInFrames: dur, ground: 'sumi', grade: false,
    camera: { push: [1.0, 1.42], truck: [40, -10], toTarget: 1 }, ambient: { breath: 0.0, sway: 0 },
    atmosphere: { dust: 40, ink: 10, bokeh: 0, wind: 3 },
    impact: { frame: dur + 2, shake: 0, shakeDuration: 0.2, punch: 0, hitStop: 0, inkFrames: 0, flash: 0, shockwave: 0, gust: 12, anticipation: dur },
  };
  const tilt = lerp(-2, -6, easeIn(p));
  const zoom = lerp(1.12, 1.0, easeOut(p * 1.8));
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `rotate(${tilt}deg) scale(${1.1 * zoom})` }}>
        <Shot spec={spec} x={0} y={0} scale={1} />
      </AbsoluteFill>
      <Canvas2D draw={(ctx) => focusLines(ctx, 1920, 1080, [1000, 380], [330, 250], 150, PAPER.ink, 0.55 + 0.35 * p, 7, t)} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 45% 50% at 52% 36%, rgba(15,13,11,0) 55%, rgba(15,13,11,${0.35 + 0.4 * p}) 100%)` }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 8-10. the hit, the knockback, the result
const K = { pivotPlate: [600, 880] as Pt, at: [760, 790] as Pt, scale: 0.86 };
// plate px <- card px: the prepared figure is the painting rect (72,150)-(1464,1978) of the card
const HEAD_PLATE: Pt = [667 - 72, 484 - 150];

/** The figure's whole-body transform over time (pure). Before the hit: still. The hit: a brief squash along the
 *  blow (<=4%, whole figure, ~6 frames). Then hurled back into depth: up-left, shrinking, rotating, decelerating. */
function figXf(t: number) {
  const hit = T.strike.hit;
  const kStart = hit + T.impact.hitStop;
  const since = t - hit;
  const sq = since >= 0 ? Math.exp(-since * 28) * (since < 0.02 ? since / 0.02 : 1) : 0;
  const s = Math.max(0, t - kStart);
  const p = 1 - Math.exp(-s * 3.6);
  const kick = s > 0 ? Math.min(1, s / 0.05) : 0;
  return {
    x: K.at[0] - 430 * p - 30 * sq - 34 * s,
    y: K.at[1] - 150 * p + 40 * Math.sin(Math.min(1, s / 1.1) * Math.PI) * 0.4,
    scale: (K.scale * (1 - 0.45 * p) * kick + K.scale * (1 - kick)) * (1 - 0.035 * s),
    rot: (-17 * p - 2.5 * sq - 1.5 * s + PULSES.reduce((a, q) => a + (t > q ? 1.2 * Math.exp(-(t - q) * 9) : 0), 0)) * (Math.PI / 180),
    sx: 1 - 0.04 * sq,
    sy: 1 + 0.025 * sq,
    speed: s > 0 ? 3.6 * Math.exp(-s * 3.6) : 0,
  };
}

/** Low-res erosion field over the figure: noise plus a bias from the struck side (frame-right) leftwards. */
function useField(img: HTMLImageElement | null) {
  return useMemo(() => {
    if (!img) return null;
    const w = 174, h = 228; // 1/8 of the plate
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0, w, h);
    const a = g.getImageData(0, 0, w, h).data;
    const field = new Float32Array(w * h);
    const alpha = new Float32Array(w * h);
    const vn = (x: number, y: number, s: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const H2 = (i: number, j: number) => hash(i * 57.1 + j * 113.7 + s * 7.3);
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      return lerp(lerp(H2(xi, yi), H2(xi + 1, yi), u), lerp(H2(xi, yi + 1), H2(xi + 1, yi + 1), u), v);
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = 0.5 * vn(x / 9, y / 9, 1) + 0.3 * vn(x / 4, y / 4, 2) + 0.2 * vn(x / 1.7, y / 1.7, 3);
      field[y * w + x] = 0.5 * n + 0.5 * (x / w) * 0.9 + 0.05 * (1 - y / h);
      alpha[y * w + x] = a[(y * w + x) * 4 + 3] / 255;
    }
    // flakes: sample points inside the figure; each releases when the erosion front passes it
    const rnd = mulberry(42);
    const flakes: { x: number; y: number; at: number; vx: number; vy: number; r: number; dark: number }[] = [];
    while (flakes.length < 1400) {
      const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
      if (alpha[y * w + x] < 0.6) continue;
      flakes.push({ x: (x + rnd()) * 8, y: (y + rnd()) * 8, at: field[y * w + x], vx: -(260 + rnd() * 900), vy: -120 + rnd() * 260, r: 1.5 + Math.pow(rnd(), 2.5) * 9, dark: rnd() });
    }
    const mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    const tmp = document.createElement('canvas');
    tmp.width = img.width; tmp.height = img.height;
    return { w, h, field, alpha, flakes, mask, tmp };
  }, [img]);
}

/** erosion progress over time: from just after the knock starts to ~70% eaten by the result */
// erosion steps with the music: a first bite as the knock lands, then a burst on each of the passage's next two hits
const PULSES = T.impact.pulses;
const erosion = (t: number) => {
  const t0 = T.strike.hit + 0.18;
  return 0.16 * easeOut((t - t0) / 0.35) + 0.12 * smooth((t - t0) / 1.5) + PULSES.reduce((a, p, i) => a + (i ? 0.1 : 0.12) * easeOut((t - p) / 0.16), 0);
};
const greyAmt = (t: number) => clamp((t - T.strike.hit - 0.05) / 0.16);

export const Aftermath: React.FC = () => {
  const f = useCurrentFrame();
  const t = T.impact.start + f / FPS;
  const hit = T.strike.hit;
  const since = t - hit;
  const hf = Math.round(since * FPS);
  const img = useImage(`characters/${L.character}/fig.png`);
  const F = useField(img);
  const O = T.out;
  const outS = t - O.stamp;
  const paperFlash = hf === 0;
  const inkNeg = hf === 1 || hf === 2;
  const frozen = since < T.impact.hitStop;
  const sh = shakeAt(t, [{ t: hit, px: 20, dur: 0.65 }, ...PULSES.map((q) => ({ t: q, px: 6, dur: 0.3 })), { t: O.stamp + 0.07, px: 6, dur: 0.38 }]);
  const slashHitFrame = 1000;
  const slashF = slashHitFrame + hf;
  const SL = { from: [1.03, 0.33] as [number, number], to: [0.0, 1.07] as [number, number], width: 440, reveal: 3 };

  const draw = (ctx: CanvasRenderingContext2D) => {
    if (!img || !F) return;
    const W = 1920, H = 1080;
    // speed lines on the page, streaking with the knock
    const ks = Math.max(0, t - (hit + T.impact.hitStop));
    speedLines(ctx, W, H, ks, 60, PAPER.ink, 0.55 * Math.exp(-ks * 1.3) * (ks > 0 ? 1 : 0), 3, [0.05, 0.95]);
    // the ink explosion from the point of contact, thrown out once (frozen inside the hit-stop)
    const contact: Pt = [820, 800];
    const sp = frozen ? 0.25 : 0.25 + 0.75 * easeOut((since - T.impact.hitStop) / 0.35);
    splatter(ctx, contact[0], contact[1], 520, sp, PAPER.ink, 11, 90);
    splatter(ctx, contact[0] - 140, contact[1] - 60, 760, sp * 0.9, 'rgba(22,19,15,0.55)', 23, 60);
    // each musical hit throws a smaller burst off his body as it breaks
    PULSES.forEach((q, i) => {
      if (t < q) return;
      const b = figXf(q);
      splatter(ctx, b.x + 60, b.y - 160, 360, easeOut((t - q) / 0.3), i ? 'rgba(110,102,90,0.8)' : PAPER.ink, 51 + i * 7, 40);
    });


    // the figure: grey, eroding, with a smear while it's fast
    const e = erosion(t);
    const m = F.mask.getContext('2d')!;
    const md = m.createImageData(F.w, F.h);
    for (let i = 0; i < F.w * F.h; i++) {
      const v = clamp((F.field[i] - (1 - e)) * -14 + 0.5); // 1 = kept
      md.data[i * 4 + 3] = Math.round(255 * (e <= 0 ? 1 : v));
    }
    m.putImageData(md, 0, 0);
    const g = F.tmp.getContext('2d')!;
    g.clearRect(0, 0, F.tmp.width, F.tmp.height);
    const gr = greyAmt(t);
    g.filter = gr > 0 ? `grayscale(${gr}) contrast(${1 - 0.28 * gr}) brightness(${1 + 0.1 * gr})` : 'none';
    g.drawImage(img, 0, 0);
    g.filter = 'none';
    if (gr > 0) {
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = `rgba(110,102,90,${0.35 * gr})`;
      g.fillRect(0, 0, F.tmp.width, F.tmp.height);
    }
    g.globalCompositeOperation = 'destination-in';
    g.imageSmoothingEnabled = true;
    g.drawImage(F.mask, 0, 0, F.tmp.width, F.tmp.height);
    g.globalCompositeOperation = 'source-over';

    const put = (tt: number, alpha: number) => {
      const x = figXf(tt);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x.x, x.y);
      ctx.rotate(x.rot);
      ctx.scale(x.scale * x.sx, x.scale * x.sy);
      ctx.translate(-K.pivotPlate[0], -K.pivotPlate[1]);
      ctx.drawImage(F.tmp, 0, 0);
      ctx.restore();
    };
    const x0 = figXf(t);
    if (x0.speed > 0.6) for (let k = 5; k >= 1; k--) put(t - k * 0.012, 0.16 * (x0.speed / 3.6));
    put(t, 1);

    // flakes: released at the erosion front, flung back with the body, drifting and fading
    const rel = (at: number) => {
      // invert erosion(): the time the front reaches field value `at`
      const need = 1 - at;
      if (need > 0.5) return Infinity;
      let lo = hit, hi2 = hit + 3;
      for (let i = 0; i < 18; i++) { const mid = (lo + hi2) / 2; if (erosion(mid) < need) lo = mid; else hi2 = mid; }
      return hi2;
    };
    for (let i = 0; i < F.flakes.length; i++) {
      const k = F.flakes[i];
      const tr = rel(k.at);
      if (t < tr) continue;
      const age = t - tr;
      if (age > 1.1) continue;
      const xf = figXf(tr);
      const dx = (k.x - K.pivotPlate[0]) * xf.scale, dy = (k.y - K.pivotPlate[1]) * xf.scale;
      const c = Math.cos(xf.rot), s = Math.sin(xf.rot);
      const px0 = xf.x + dx * c - dy * s, py0 = xf.y + dx * s + dy * c;
      const drag = (1 - Math.exp(-age * 2.2)) / 2.2;
      const xx = px0 + k.vx * drag, yy = py0 + k.vy * drag + 120 * age * age;
      const a = 1 - smooth(age / 1.1);
      const r = k.r * (0.5 + 0.5 * Math.min(1, age * 6));
      ctx.fillStyle = k.dark < 0.7 ? `rgba(22,19,15,${a})` : `rgba(110,102,90,${a})`;
      const an = Math.atan2(k.vy, k.vx) + (k.dark - 0.5) * 1.2;
      ctx.beginPath();
      ctx.ellipse(xx, yy, r * 1.7, r * 0.55, an, 0, Math.PI * 2);
      ctx.ellipse(xx + Math.cos(an + 1.3) * r * 0.6, yy + Math.sin(an + 1.3) * r * 0.6, r * 0.8, r * 0.5, an + 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    // the stroke: an enormous vermilion slash across him, in front of everything; it stays as a mark in space
    // a loaded core (the house broad stroke, laid along the slash) under the dry-brush slash spray
    const a0: Pt = [SL.from[0] * W, SL.from[1] * H], a1: Pt = [SL.to[0] * W, SL.to[1] * H];
    const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]);
    const len = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
    const rev = easeOut((hf + 2) / 3);
    const fadeK = 1 - 0.3 * clamp((since - 0.3) / 1.4);
    ctx.save();
    ctx.translate(a0[0], a0[1]);
    ctx.rotate(ang);
    broadStroke(ctx, 0, 0, len, 250, rev, [214, 64, 43], 5, fadeK);
    ctx.restore();
    drawSlash(ctx, SL, slashF, slashHitFrame, W, H, 'paper');
  };

  const band = slamK(t, O.stamp, 1.12, 0.14);
  const win = riseK(t, O.stamp + 0.16, 0.35);
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: inkNeg ? 'grayscale(1) contrast(30) invert(1) sepia(0.15)' : undefined }}>
        <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${1 + 0.07 * Math.exp(-Math.max(0, since) * 7) + 0.05 * easeInOut((t - hit - 0.3) / 1.6)})`, transformOrigin: '30% 45%' }}>
          <InkField W={1920} H={1080} t={t} flood={0} swirl={0} light={0} lightAt={[0.5, 0.5]} lightR={0.5} lightCol={[0, 0, 0]} />
          <Canvas2D draw={draw} />
        </AbsoluteFill>
        {/* the result, on the second big hit: a paper band slams across the lower third, over the page */}
        {outS >= 0 && (
          <div style={{ position: 'absolute', left: 0, top: 700, width: 1920, height: 326, transform: `scaleY(${easeOut(outS / 0.08)}) scale(${band.s})`, transformOrigin: '50% 50%' }}>
            <div style={{ position: 'absolute', inset: 0, background: PAPER.surface1, boxShadow: `0 0 0 5px ${PAPER.ink}, 0 18px 40px rgba(22,19,15,0.25)` }} />
            <div style={{ position: 'absolute', left: 300, top: 108, fontFamily: DELA, fontSize: 104, lineHeight: 1, color: PAPER.out, whiteSpace: 'nowrap' }}>{L.handle} OUT</div>
            <div style={{ position: 'absolute', right: 96, top: 26, textAlign: 'right', opacity: win.a, transform: `translateY(${win.y}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 22 }}>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', color: PAPER.muted }}>TAKES THE POOL</div>
                <div style={{ width: 92, height: 92, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 4px ${PAPER.ink}`, position: 'relative' }}>
                  <Img src={staticFile(`cards/${R.card}.webp`)} style={{ position: 'absolute', width: 1536 * 0.24, height: 2048 * 0.24, left: 46 - 870 * 0.24, top: 46 - 520 * 0.24 }} />
                </div>
                <div style={{ fontFamily: DELA, fontSize: 72, lineHeight: 1, color: PAPER.ink }}>{R.handle}</div>
              </div>
              <div style={{ fontFamily: DELA, fontSize: 124, lineHeight: 1.05, color: UP_PAPER, marginTop: 8, textShadow: `0 0 ${26 * win.a}px rgba(61,220,132,0.35)` }}>+{MATCH.payout} USDC</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.2em', color: PAPER.muted, marginTop: 2 }}>{MATCH.pool} USDC POOL · {MATCH.feePct}% FEE</div>
            </div>
            <StampSeal t={t} t0={O.stamp - 0.07 + 0.04} glyph="敗" x={190} y={163} size={170} fill={PAPER.out} ink={PAPER.surface1} rest={-12} />
          </div>
        )}
      </AbsoluteFill>
      {paperFlash && <AbsoluteFill style={{ background: '#fff8ea' }} />}
    </AbsoluteFill>
  );
};
