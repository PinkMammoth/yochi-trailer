// the strike, on paper (timing.json strike.wide -> victory.start). Wide: she's driving in from frame-right and the ink leaves her blade, arcing
// left. Drop 2's big hit: one paper-white frame, two ink-negative frames, then the page: the stroke runs from her
// blade through his chest (the hit pose), black ink explodes off him, hit-stop. Then he's hurled back into depth,
// greying and breaking into ink, a fresh burst on each of the drop's hits, while she holds her follow-through.
import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PAPER } from '../lib/brand';
const DEFEAT = T.impact.pulses[2];
import { splatter } from '../lib/brush';
import { curveAt, curveSlash, type P2 } from '../lib/curveSlash';
import { Canvas2D, useFmt } from '../lib/frame';
import { InkField } from '../lib/InkField';
import { StampSeal, speedLines, useImage } from '../lib/manga';
import { clamp, easeInOut, easeOut, hash, lerp, mulberry, shakeAt, smooth } from '../lib/motion';
import { ART, FPS, T } from '../data';

const HIT = T.strike.hit;
const HS = T.impact.hitStop;
const PULSES = T.impact.pulses;

function layout(land: boolean) {
  return land
    ? { her: { z: 0.52, face: [1560, 330] as P2 }, him: { z: 0.9, chest: [560, 640] as P2 }, C: [800, 760] as P2, P1: [-80, 560] as P2, travel: [-230, -80] as P2, slashW: 230 }
    : { her: { z: 0.46, face: [800, 470] as P2 }, him: { z: 0.85, chest: [420, 1300] as P2 }, C: [620, 1320] as P2, P1: [-60, 1500] as P2, travel: [-140, -190] as P2, slashW: 220 };
}

/** her whole-figure transform: driving in from frame-right before the hit, a short follow-through, then a held breath */
function herXf(t: number, land: boolean) {
  const L = layout(land).her;
  const pre = t < HIT ? 1 - easeOut(clamp((t - T.strike.wide) / (HIT - T.strike.wide))) : 0;
  const follow = t >= HIT ? 26 * easeOut((t - HIT) / 0.25) + 10 * Math.max(0, t - HIT - 0.25) : 0;
  const breath = 1 + 0.006 * Math.sin(Math.max(0, t - HIT) * 2.2);
  return { x: L.face[0] + (land ? 190 : 120) * pre - follow, y: L.face[1] + (land ? 20 : 40) * pre, z: L.z * breath };
}
/** his whole-figure transform: a brief squash along the blow (<=4%, ~6 frames), then hurled back into depth */
function himXf(t: number, land: boolean) {
  const L = layout(land);
  const since = t - HIT;
  const sq = since >= 0 ? Math.exp(-since * 26) : 0;
  const s = Math.max(0, t - (HIT + HS));
  const p = 1 - Math.exp(-s * 2.3);
  const tip = 1 - Math.exp(-s * 5.0); // the topple leads the travel: the big man thrown off his feet
  const kick = PULSES.reduce((a, q) => a + (t > q ? 1.2 * Math.exp(-(t - q) * 9) : 0), 0);
  return {
    x: L.him.chest[0] + L.travel[0] * p - 26 * sq - 30 * s,
    y: L.him.chest[1] + L.travel[1] * p,
    z: L.him.z * (1 - 0.3 * p) * (1 - 0.03 * s),
    rot: ((-9 * tip - 8 * p - 2.5 * sq - 1.2 * s + kick) * Math.PI) / 180,
    sx: 1 - 0.04 * sq, sy: 1 + 0.025 * sq,
    speed: s > 0 ? 2.3 * Math.exp(-s * 2.3) : 0,
  };
}
const erosion = (t: number) => {
  const t0 = PULSES[0];
  return 0.1 * smooth((t - t0) / 0.9) + PULSES.reduce((a, q, i) => a + [0.16, 0.12, 0.12][i] * easeOut((t - q) / 0.16), 0);
};
const greyAmt = (t: number) => clamp((t - PULSES[0] + 0.05) / 0.3);

function useField(img: HTMLImageElement | null) {
  return useMemo(() => {
    if (!img) return null;
    const w = Math.round(img.width / 8), h = Math.round(img.height / 8);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d')!; g.drawImage(img, 0, 0, w, h);
    const a = g.getImageData(0, 0, w, h).data;
    const field = new Float32Array(w * h);
    const vn = (x: number, y: number, s: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const H2 = (i: number, j: number) => hash(i * 57.1 + j * 113.7 + s * 7.3);
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      return lerp(lerp(H2(xi, yi), H2(xi + 1, yi), u), lerp(H2(xi, yi + 1), H2(xi + 1, yi + 1), u), v);
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = 0.5 * vn(x / 9, y / 9, 1) + 0.3 * vn(x / 4, y / 4, 2) + 0.2 * vn(x / 1.7, y / 1.7, 3);
      field[y * w + x] = 0.5 * n + 0.45 * (x / w) + 0.05 * (1 - y / h);
    }
    const rnd = mulberry(42);
    const flakes: { x: number; y: number; at: number; vx: number; vy: number; r: number; dark: number }[] = [];
    let guard = 0;
    while (flakes.length < 1500 && guard++ < 200000) {
      const x = Math.floor(rnd() * w), y = Math.floor(rnd() * h);
      if (a[(y * w + x) * 4 + 3] < 150) continue;
      flakes.push({ x: (x + rnd()) * 8, y: (y + rnd()) * 8, at: field[y * w + x], vx: -(240 + rnd() * 900), vy: -160 + rnd() * 280, r: 1.5 + Math.pow(rnd(), 2.5) * 9, dark: rnd() });
    }
    const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
    const tmp = document.createElement('canvas'); tmp.width = img.width; tmp.height = img.height;
    return { w, h, field, flakes, mask, tmp };
  }, [img]);
}

export const Strike: React.FC = () => {
  const t = T.strike.wide + useCurrentFrame() / FPS;
  const { land, W, H } = useFmt();
  const L = layout(land);
  const herImg = useImage(ART.attack.matte);
  const himImg = useImage(ART.hit.src);
  const F = useField(himImg);
  const since = t - HIT;
  const hf = Math.round(since * FPS);
  const paperFlash = hf === 0;
  const inkNeg = hf === 1 || hf === 2;
  const frozen = since >= 0 && since < HS;
  const tm = frozen ? HIT : t >= HIT + HS ? t - HS : t; // motion time: holds through the hit-stop
  const sh = shakeAt(t, [{ t: HIT, px: 22, dur: 0.65 }, ...PULSES.map((q) => ({ t: q, px: 6, dur: 0.3 }))]);
  const unit = Math.min(W, H) / 1080;

  const draw = (ctx: CanvasRenderingContext2D) => {
    if (!herImg || !himImg || !F) return;
    const hx = herXf(since >= 0 && since < HS ? HIT : t, land);
    const blade: P2 = [hx.x + (ART.attack.blade[0] - ART.attack.face[0]) * hx.z, hx.y + (ART.attack.blade[1] - ART.attack.face[1]) * hx.z];
    // speed lines: before the hit they stream with her lunge; after, with his flight
    const pre = t < HIT ? clamp((t - T.strike.wide) / (HIT - T.strike.wide)) : 0;
    const ks = Math.max(0, t - (HIT + HS));
    speedLines(ctx, W, H, t < HIT ? t * 1.6 : ks, land ? 54 : 70, PAPER.ink, t < HIT ? 0.35 * pre : 0.32 * Math.exp(-ks * 1.2) * (ks > 0 ? 1 : 0), 3, [0.05, 0.95]);

    // HIM (from the hit on): grey, eroding, a smear while he's fast
    if (since >= 0) {
      const contact = curveAt(blade, L.C, L.P1, 0.5);
      const sp = frozen ? 0.25 : 0.25 + 0.75 * easeOut((since - HS) / 0.35);
      splatter(ctx, contact[0], contact[1], 400 * unit, sp, PAPER.ink, 11, 60);
      splatter(ctx, contact[0] - 120 * unit, contact[1] - 60 * unit, 560 * unit, sp * 0.9, 'rgba(22,19,15,0.35)', 23, 36);
      PULSES.forEach((q, i) => {
        if (t < q) return;
        const b = himXf(q, land);
        splatter(ctx, b.x + 40 * unit, b.y - 120 * unit, 340 * unit, easeOut((t - q) / 0.3), i === 1 ? 'rgba(110,102,90,0.8)' : PAPER.ink, 51 + i * 7, 36);
      });
      const e = erosion(tm);
      const m = F.mask.getContext('2d')!;
      const md = m.createImageData(F.w, F.h);
      for (let i = 0; i < F.w * F.h; i++) md.data[i * 4 + 3] = Math.round(255 * (e <= 0 ? 1 : clamp((F.field[i] - (1 - e)) * -14 + 0.5)));
      m.putImageData(md, 0, 0);
      const g = F.tmp.getContext('2d')!;
      g.clearRect(0, 0, F.tmp.width, F.tmp.height);
      const gr = greyAmt(t);
      g.filter = gr > 0 ? `grayscale(${gr}) contrast(${1 - 0.28 * gr}) brightness(${1 + 0.1 * gr})` : 'none';
      g.drawImage(himImg, 0, 0);
      g.filter = 'none';
      if (gr > 0) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(110,102,90,${0.35 * gr})`; g.fillRect(0, 0, F.tmp.width, F.tmp.height); }
      g.globalCompositeOperation = 'destination-in'; g.imageSmoothingEnabled = true; g.drawImage(F.mask, 0, 0, F.tmp.width, F.tmp.height);
      g.globalCompositeOperation = 'source-over';
      const put = (tt: number, alpha: number) => {
        const x = himXf(tt, land);
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x.x, x.y); ctx.rotate(x.rot); ctx.scale(x.z * x.sx, x.z * x.sy);
        ctx.translate(-ART.hit.chest[0], -ART.hit.chest[1]); ctx.drawImage(F.tmp, 0, 0); ctx.restore();
      };
      const x0 = himXf(tm, land);
      if (x0.speed > 0.6) for (let k = 5; k >= 1; k--) put(tm - k * 0.012, 0.16 * (x0.speed / 3.4));
      put(tm, 1);
      // flakes: released at the erosion front, flung back with the body
      const rel = (at: number) => {
        const need = 1 - at; if (need > 0.5) return Infinity;
        let lo = HIT, hi = HIT + 3;
        for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (erosion(mid) < need) lo = mid; else hi = mid; }
        return hi;
      };
      for (const k of F.flakes) {
        const tr = rel(k.at); if (tm < tr) continue;
        const age = tm - tr; if (age > 1.1) continue;
        const xf = himXf(tr, land);
        const dx = (k.x - ART.hit.chest[0]) * xf.z, dy = (k.y - ART.hit.chest[1]) * xf.z;
        const c = Math.cos(xf.rot), s = Math.sin(xf.rot);
        const drag = (1 - Math.exp(-age * 2.2)) / 2.2;
        const xx = xf.x + dx * c - dy * s + k.vx * drag * unit, yy = xf.y + dx * s + dy * c + k.vy * drag * unit + 120 * age * age;
        const a = 1 - smooth(age / 1.1), r = k.r * unit * (0.5 + 0.5 * Math.min(1, age * 6));
        const an = Math.atan2(k.vy, k.vx) + (k.dark - 0.5) * 1.2;
        ctx.fillStyle = k.dark < 0.7 ? `rgba(22,19,15,${a})` : `rgba(110,102,90,${a})`;
        ctx.beginPath(); ctx.ellipse(xx, yy, r * 1.7, r * 0.55, an, 0, Math.PI * 2);
        ctx.ellipse(xx + Math.cos(an + 1.3) * r * 0.6, yy + Math.sin(an + 1.3) * r * 0.6, r * 0.8, r * 0.5, an + 0.9, 0, Math.PI * 2); ctx.fill();
      }
    }
    // the stroke: launched from her blade over the last frames before the hit; it stays as a mark, soaking in
    curveSlash(ctx, blade, L.C, L.P1, Math.round((t - HIT) * FPS) + 1000, 1000, { width: L.slashW, reveal: 6, ground: 'paper', unit, soak: 1 - 0.62 * clamp((since - HS) / 0.45) });
    // HER, in front: the attack pose, full colour, a little motion smear while she drives in
    const drawHer = (hh: ReturnType<typeof herXf>, alpha: number) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(hh.x, hh.y); ctx.scale(hh.z, hh.z);
      ctx.translate(-ART.attack.face[0], -ART.attack.face[1]); ctx.drawImage(herImg, 0, 0); ctx.restore();
    };
    if (t < HIT) for (let k = 4; k >= 1; k--) drawHer(herXf(t - k * 0.01, land), 0.12);
    drawHer(hx, 1);
  };

  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: inkNeg ? 'grayscale(1) contrast(30) invert(1) sepia(0.15)' : undefined }}>
        <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${1 + (since >= 0 ? 0.06 * Math.exp(-since * 7) : 0) + 0.11 * easeInOut((t - HIT - HS) / 0.75)})`, transformOrigin: land ? '28% 55%' : '30% 66%' }}>
          <InkField W={W} H={H} t={t} flood={0} swirl={0} light={0} lightAt={[0.5, 0.5]} lightR={0.5} lightCol={[0, 0, 0]} />
          <Canvas2D draw={draw} />
        </AbsoluteFill>
      </AbsoluteFill>
      <StampSeal t={t} t0={DEFEAT - 0.07} glyph="敗" x={land ? 330 : 250} y={land ? 230 : 940} size={land ? 150 : 140} fill={PAPER.out} ink={PAPER.bg} rest={-12} shake={[sh.x, sh.y]} />
      {paperFlash && <AbsoluteFill style={{ background: '#fff8ea' }} />}
    </AbsoluteFill>
  );
};
