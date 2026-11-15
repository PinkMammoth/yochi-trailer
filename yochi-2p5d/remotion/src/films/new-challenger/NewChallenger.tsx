// NEW CHALLENGER: an 8-second 9:16 character reveal for Yochi's Elysium expansion. 1080x1920, 60 fps.
//
//   0.00  the select screen: Ronin, the incumbent, locked in for HYPEREVM (決 stamps the pick)
//   2.00  the flicker and the alarm, the screen goes dark: NEW / CHALLENGER / APPROACHING slam on the beats
//   4.00  Untouchable emerges from the dark for ELYSIUM: a light beam, the dark receding like ink, wind, one gust
//   6.00  the drop: the two of them side by side, split by the one vermilion slash, the copy, the seal, the caption
//
// Only the painted cast (kit cards via yochi-2p5d plates), whole-figure motion, camera, ink and type. All timing
// lives in timing.json. Caption variants: ../captions.ts (default: coming-soon).
import React, { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { CharacterShot } from '../../lib/CharacterShot';
import { drawSlash } from '../../lib/slash';
import { IMPACT_HOUSE, clamp, hash, mulberry, type ShotSpec } from '../../lib/shot';
import { CAPTIONS, UNPUBLISHED_SLATE, type CaptionId } from '../captions';
import {
  DELA, FPS, FilmGrade, H, InlineSeal, KanjiSeal, Label, MONO, PAPER, SAFE, SUMI, SealStamp, SlamText, Sumi, W, addShake,
  easeIO, easeO, lerp, prog, rgba, sec, shake, slamK, useFilmFonts,
} from '../kit';
import T from './timing.json';

export interface NewChallengerProps {
  caption: CaptionId;
  /** the UNPUBLISHED slate on the mainnet variant; on by default, never off for anything posted */
  slate?: boolean;
  /** 'brief' = the commissioned copy; 'house' = a copy-rule-compliant alternative (see the film's README) */
  tagline?: 'brief' | 'house';
  audio?: boolean;
}

export const NC_DURATION = sec(T.dur);

const TAGLINES = {
  brief: ['TWO CHAINS.', 'ONE ARENA.'],
  house: ['TWO CHAINS', 'ONE GAME'],
} as const;

// ------------------------------------------------------------------ shot specs (yochi-2p5d ShotSpec, 60 fps)
const roninSelect: ShotSpec = {
  character: 'ronin', format: '4:5', fps: FPS, durationInFrames: sec(T.reveal.start), ground: 'sumi',
  camera: { push: [1.0, 1.07], truck: [10, -4] },
  ambient: { breath: 0.005, sway: 0.2, period: 3.2 },
  light: { angle: [-30, 10], shadow: 0.25, pool: 0.08 },
  atmosphere: { dust: 70, ink: 18, bokeh: 3, wind: 0.7 },
  grade: false,
};
const untouchableReveal: ShotSpec = {
  character: 'untouchable', format: '9:16', fps: FPS, durationInFrames: sec(T.two.start - T.reveal.start), ground: 'sumi',
  camera: { push: [1.0, 1.1], truck: [-16, 8], toTarget: 0.4 },
  ambient: { breath: 0.006, sway: 0.35, period: 3.0 },
  // the key light swings across her as she emerges: her soft shadow moves over the misty ground
  light: { angle: [-70, 40], shadow: 0.45, pool: 0.14 },
  atmosphere: { dust: 170, ink: 36, bokeh: 5, wind: 2.4 },
  impact: { frame: sec(T.reveal.hit - T.reveal.start), ...IMPACT_HOUSE, shake: 8, punch: 0.04, flash: 0, gust: 9, shockwave: 0.45, anticipation: 40 },
  grade: false,
};
// the two-shot: each painting in its own column, pushed a little closer
const twoDur = sec(T.dur - T.two.start);
const roninTwo: ShotSpec = {
  character: 'ronin', format: '9:16', fps: FPS, durationInFrames: twoDur, ground: 'sumi',
  framing: { center: [689, 1077], width: 1100 },
  camera: { push: [1.0, 1.05], truck: [6, 0], toTarget: 0 },
  ambient: { breath: 0.005, sway: 0.2 }, light: { angle: [-20, 0], shadow: 0.25 }, atmosphere: { dust: 50, ink: 10, bokeh: 2, wind: 1 }, grade: false,
};
const untouchableTwo: ShotSpec = {
  character: 'untouchable', format: '9:16', fps: FPS, durationInFrames: twoDur, ground: 'sumi',
  framing: { center: [886, 1077], width: 1100 },
  camera: { push: [1.0, 1.05], truck: [-6, 0], toTarget: 0 },
  ambient: { breath: 0.006, sway: 0.3 }, light: { angle: [40, 30], shadow: 0.35 }, atmosphere: { dust: 60, ink: 10, bokeh: 2, wind: 2 }, grade: false,
};

// ------------------------------------------------------------------ 0.00 select
const SelectScreen: React.FC<{ t: number }> = ({ t }) => {
  const S = T.select;
  const win = { x: SAFE.x, y: 210, w: W - 2 * SAFE.x, h: (W - 2 * SAFE.x) * 1.25 };
  const scale = win.w / 1080;
  const cursorOn = t < S.lock ? Math.floor(t * 6) % 2 === 0 : true;
  const lockK = slamK(t, S.lock);
  // slot 2 answers: a faint pulse, "someone is coming"
  const pulse = t > S.slot2 ? 0.5 + 0.5 * Math.sin((t - S.slot2) * 14) : 0;
  return (
    <>
      <Label x={SAFE.x} y={150} size={28} color={SUMI.muted}>PLAYER SELECT</Label>
      <Label x={W - SAFE.x} y={150} size={28} color={SUMI.muted} align="right">CREDIT 01</Label>
      {/* the portrait window: the living painting (yochi-2p5d CharacterShot, 4:5) */}
      <div style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h, overflow: 'hidden', outline: `2px solid ${rgba(SUMI.ink, 0.18)}` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1350, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
          <Sequence durationInFrames={roninSelect.durationInFrames} layout="none">
            <CharacterShot spec={roninSelect} />
          </Sequence>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 260, background: `linear-gradient(rgba(15,13,11,0), ${rgba(SUMI.bg, 0.75)})` }} />
      </div>
      {/* 1P chip */}
      <div style={{ position: 'absolute', left: win.x + 24, top: win.y + 24, padding: '10px 16px 8px', background: SUMI.red, color: SUMI.onRed, fontFamily: DELA, fontSize: 40, lineHeight: 1 }}>1P</div>
      {/* name block */}
      <Label x={SAFE.x} y={1515} size={30} color={SUMI.muted}>RONIN</Label>
      <div style={{ position: 'absolute', left: SAFE.x - 4, top: 1545, fontFamily: DELA, fontSize: 124, lineHeight: 1, color: SUMI.ink, whiteSpace: 'nowrap' }}>HYPEREVM</div>
      {/* the pick locks: 決 */}
      <KanjiSeal t={t} t0={S.lock} glyph="決" x={W - SAFE.x - 64} y={1772} size={112} ground="sumi" />
      {/* roster: two slots */}
      {[0, 1].map((i) => {
        const x = SAFE.x + i * 168, y = 1716, s = 140;
        const sel = i === 0;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, overflow: 'hidden', background: SUMI.surface2,
            outline: sel && cursorOn ? `5px solid ${SUMI.red}` : `2px solid ${rgba(SUMI.ink, 0.16 + 0.4 * (i === 1 ? pulse : 0))}`,
            transform: sel && lockK.on ? `scale(${1 + (lockK.scale - 1) * 0.25})` : undefined }}>
            {sel ? (
              <Img src={staticFile('cards/ronin.webp')} style={{ position: 'absolute', width: 1536 * 0.19, left: -(689 * 0.19 - s / 2), top: -(500 * 0.19 - s / 2) }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DELA, fontSize: 72, color: rgba(SUMI.ink, 0.25 + 0.5 * pulse) }}>?</div>
            )}
          </div>
        );
      })}
      <Label x={SAFE.x + 2 * 168 + 10} y={1772} size={24} color={SUMI.muted}>{t < S.lock ? 'CHOOSE' : '1P READY'}</Label>
      <Label x={SAFE.x + 2 * 168 + 10} y={1812} size={24} color={rgba(SUMI.ink, 0.35 + 0.4 * pulse)}>{t > S.slot2 ? '2P ?' : '2P ---'}</Label>
    </>
  );
};

// ------------------------------------------------------------------ 2.00 alarm
/** the flicker: a deterministic pattern of dropped and dimmed frames, then the dark settles */
function flickerDark(t: number) {
  const A = T.alarm;
  if (t < A.flicker) return 0;
  const f = Math.floor((t - A.flicker) * FPS);
  const settle = easeIO(prog(t, A.dark, 0.3)) * 0.86;
  if (t < A.dark + 0.1) {
    const h = hash(f * 3.7 + 1);
    const on = h > 0.55 ? 0.95 : h > 0.3 ? 0.45 : 0.05;
    return Math.max(settle, on);
  }
  return settle;
}

const Ticker: React.FC<{ t: number; y: number; dir: 1 | -1; a: number }> = ({ t, y, dir, a }) => {
  const text = Array.from({ length: 12 }, () => 'WARNING').join('   ·   ');
  const x = ((t * 140 * dir) % 600) - 600;
  return <Label x={x} y={y} size={26} color={rgba(SUMI.ink, a)} tracking={0.3}>{text}</Label>;
};

const Alarm: React.FC<{ t: number }> = ({ t }) => {
  const A = T.alarm;
  if (t < A.flicker || t >= A.black) return null;
  // the text block blinks off twice, arcade-style
  const blink = A.blink.some((b) => t >= b && t < b + 0.07);
  const a = 0.35 * easeO(prog(t, A.dark, 0.3));
  const bandK = slamK(t, A.slams[1]);
  return (
    <>
      <Ticker t={t} y={560} dir={1} a={a} />
      <Ticker t={t} y={1330} dir={-1} a={a} />
      {!blink && (
        <>
          <SlamText t={t} t0={A.slams[0]} x={W / 2} y={720} size={150} color={SUMI.ink}>NEW</SlamText>
          {bandK.on && (
            <div style={{ position: 'absolute', left: 0, top: 820, width: W, height: 200, background: SUMI.ink, transform: `scaleY(${1 + (bandK.scale - 1) * 0.6})` }} />
          )}
          <SlamText t={t} t0={A.slams[1]} x={W / 2} y={925} size={118} color={PAPER.ink}>CHALLENGER</SlamText>
          <SlamText t={t} t0={A.slams[2]} x={W / 2} y={1130} size={98} color={SUMI.ink}>APPROACHING</SlamText>
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ 4.00 reveal: the dark recedes like ink
const Darkness: React.FC<{ t: number }> = ({ t }) => {
  const R = T.reveal;
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const after = t - R.hit;
    // after the hit the last of the dark is blown off outward over 0.3 s
    const blow = easeO(clamp(after / 0.3));
    if (blow >= 1) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(SUMI.bg, 0.985 * (1 - blow));
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'destination-out';
    // 1) a light beam sweeping right to left across her face and shoulder (the moving light)
    const bk = clamp((t - R.beam[0]) / (R.beam[1] - R.beam[0]));
    const bx = lerp(1250, 250, easeIO(bk));
    const beamA = Math.sin(Math.PI * clamp(bk * 1.05)) * 0.55 + 0.25 * clamp((t - R.lift[0]) / 0.4);
    ctx.save();
    ctx.translate(bx, 520);
    ctx.rotate(-0.5);
    const g = ctx.createLinearGradient(-260, 0, 260, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, `rgba(0,0,0,${beamA})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-260, -1600, 520, 3200);
    ctx.restore();
    // 2) the dark recedes from her face outward with a ragged, wet ink edge
    const lk = easeIO(clamp((t - R.lift[0]) / (R.lift[1] - R.lift[0])));
    const rad = lerp(0, 1150, lk) + blow * 1800;
    if (rad > 1) {
      const cx = 690, cy = 470;
      const rnd = mulberry(21);
      const ph = Array.from({ length: 7 }, () => rnd() * 6.28);
      for (let ring = 0; ring < 5; ring++) {
        const rr = rad * (1 - ring * 0.07);
        ctx.fillStyle = `rgba(0,0,0,${0.32 + ring * 0.17})`;
        ctx.beginPath();
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * Math.PI * 2;
          let n = 0;
          for (let k = 0; k < 7; k++) n += Math.sin(a * (k + 2) + ph[k] + t * (0.6 + k * 0.2)) / (k + 2);
          const r = rr * (1 + 0.16 * n) * (1 + 0.25 * Math.max(0, Math.sin(a - 1.2))); // spreads further down her body
          const x = cx + Math.cos(a) * r * 0.9, y = cy + Math.sin(a) * r * 1.25;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />;
};

const Reveal: React.FC<{ t: number }> = ({ t }) => {
  const R = T.reveal;
  const nameK = slamK(t, R.name);
  const lt = t - R.start;
  return (
    <>
      <Sequence from={0} durationInFrames={untouchableReveal.durationInFrames} layout="none">
        <CharacterShot spec={untouchableReveal} />
      </Sequence>
      <Darkness t={t} />
      {/* bottom shade so the name reads over her dark robes */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 640, background: `linear-gradient(rgba(15,13,11,0), ${rgba(SUMI.bg, 0.9)} 70%)`, opacity: easeO(prog(t, R.hit - 0.3, 0.4)) }} />
      <Label x={SAFE.x} y={150} size={28} color={rgba(SUMI.ink, 0.6 * easeO(prog(lt, 0.2, 0.4)))}>2P · CHALLENGER</Label>
      {nameK.on && (
        <>
          <Img src={staticFile('brand/elysium-logomark-colorized.svg')} style={{ position: 'absolute', left: W / 2 - 66, top: 1440, width: 132, height: 132, transform: `scale(${nameK.scale})` }} />
          <SlamText t={t} t0={R.name} x={W / 2} y={1675} size={136} color={SUMI.ink}>ELYSIUM</SlamText>
          <Label x={W / 2} y={1790} size={28} color={SUMI.muted} align="center">UNTOUCHABLE</Label>
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ 6.00 the two-shot and the end card
const TOP = 250, BOT = 1170; // the portraits' band
const Column: React.FC<{ spec: ShotSpec; clip: string; dx: number; dy: number; from: number; t: number; side: -1 | 1 }> = ({ spec, clip, dx, dy, t, side }) => {
  const k = easeO(prog(t, T.two.start, 0.22));
  const slide = (1 - k) * 160 * side;
  return (
    <div style={{ position: 'absolute', inset: 0, clipPath: clip }}>
      <div style={{ position: 'absolute', left: dx + slide, top: dy, width: W, height: H }}>
        <Sequence from={0} durationInFrames={spec.durationInFrames} layout="none">
          <CharacterShot spec={spec} />
        </Sequence>
      </div>
    </div>
  );
};

const SlashCanvas: React.FC<{ f: number }> = ({ f }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    drawSlash(ctx, { from: [0.6, (TOP - 30) / H], to: [0.41, (BOT + 40) / H], width: 96, reveal: 5, tone: 'red' }, f, 2, W, H, 'sumi');
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0 }} />;
};

const TwoShot: React.FC<{ t: number; f: number; caption: CaptionId; tagline: 'brief' | 'house' }> = ({ t, f, caption, tagline }) => {
  const C = CAPTIONS[caption];
  const X = T.two;
  // the divide: x at the top of the band and at the bottom
  const xt = 0.6 * W, xb = 0.41 * W;
  const leftClip = `polygon(0 ${TOP}px, ${xt}px ${TOP}px, ${xb}px ${BOT}px, 0 ${BOT}px)`;
  const rightClip = `polygon(${xt}px ${TOP}px, ${W}px ${TOP}px, ${W}px ${BOT}px, ${xb}px ${BOT}px)`;
  const [l1, l2] = TAGLINES[tagline];
  return (
    <>
      <Column spec={roninTwo} clip={leftClip} dx={-280} dy={150} from={0} t={t} side={-1} />
      <Column spec={untouchableTwo} clip={rightClip} dx={215} dy={140} from={0} t={t} side={1} />
      {/* fade the portraits into the sumi panel */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: BOT - 260, height: 262, background: `linear-gradient(rgba(15,13,11,0), ${SUMI.bg})` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: TOP, height: 90, background: `linear-gradient(${SUMI.bg}, rgba(15,13,11,0))` }} />
      <SlashCanvas f={f} />
      {/* names over each side, outside the faces */}
      <div style={{ position: 'absolute', left: SAFE.x, top: 130, fontFamily: DELA, fontSize: 60, lineHeight: 1, color: SUMI.ink }}>HYPEREVM</div>
      <Label x={SAFE.x} y={222} size={24} color={SUMI.muted}>RONIN</Label>
      <div style={{ position: 'absolute', right: SAFE.x, top: 130, fontFamily: DELA, fontSize: 60, lineHeight: 1, color: SUMI.ink, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Img src={staticFile('brand/elysium-logomark-colorized.svg')} style={{ width: 58, height: 58 }} />ELYSIUM
      </div>
      <Label x={W - SAFE.x} y={222} size={24} color={SUMI.muted} align="right">UNTOUCHABLE</Label>
      <KanjiSeal t={t} t0={X.start + 0.05} glyph="対" x={0.43 * W} y={BOT - 150} size={104} ground="sumi" />
      {/* the copy */}
      <SlamText t={t} t0={X.tag[0]} x={W / 2} y={1255} size={108} color={SUMI.ink}>{l1}</SlamText>
      <SlamText t={t} t0={X.tag[1]} x={W / 2} y={1385} size={108} color={SUMI.ink}>{l2}</SlamText>
      {/* lockup: the seal stamps, YOCHI x ELYSIUM, then the caption */}
      {t >= X.seal - 0.15 && (
        <div style={{ position: 'absolute', left: 0, width: W, top: 1545, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, fontFamily: DELA, fontSize: 56, color: SUMI.ink, lineHeight: 1 }}>
          <InlineSeal t={t} t0={X.seal} size={112} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: easeO(prog(t, X.seal + 0.05, 0.15)) }}>
            YOCHI <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 36, color: SUMI.muted }}>×</span>
            <Img src={staticFile('brand/elysium-logomark-colorized.svg')} style={{ width: 56, height: 56 }} /> ELYSIUM
          </span>
        </div>
      )}
      <SlamText t={t} t0={X.caption} x={W / 2} y={1675} size={70} color={SUMI.red}>{C.line}</SlamText>
      {t >= X.caption && (
        <>
          <Label x={W / 2} y={1762} size={36} color={SUMI.ink} align="center" weight={700} tracking={0.04}>{C.url}</Label>
          {C.small && <Label x={W / 2} y={1812} size={20} color={SUMI.muted} align="center">{C.small}</Label>}
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the film
export const NewChallenger: React.FC<NewChallengerProps> = ({ caption = 'coming-soon', slate, tagline = 'brief', audio = true }) => {
  useFilmFonts();
  const f = useCurrentFrame();
  const t = f / FPS;
  const A = T.alarm;
  const showSlate = (slate ?? true) && !CAPTIONS[caption].published;
  // ground shake: house 6 px on each slam and on the two-shot's arrival
  const [sx, sy, sr] = addShake(
    ...A.slams.map((s, i) => shake(t, s, 6, 0.38, 10 + i)),
    shake(t, T.two.start, 6, 0.38, 20),
    shake(t, T.two.seal, 5, 0.38, 30),
  );
  const dark = flickerDark(t);
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      {audio && <Audio src={staticFile('audio/new-challenger.wav')} />}
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)` }}>
        <Sumi />
        {t < A.black && (
          <>
            <SelectScreen t={t} />
            {/* the darkening, with scanlines during the flicker */}
            <AbsoluteFill style={{ background: SUMI.bg, opacity: dark }} />
            {t >= A.flicker && t < A.dark + 0.12 && (
              <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, rgba(0,0,0,0) 2px 6px)`, opacity: 0.6 }} />
            )}
            <Alarm t={t} />
          </>
        )}
        <Sequence from={sec(T.reveal.start)} durationInFrames={sec(T.two.start - T.reveal.start)} layout="none">
          <Reveal t={t} />
        </Sequence>
        <Sequence from={sec(T.two.start)} durationInFrames={twoDur} layout="none">
          <TwoShot t={t} f={f - sec(T.two.start)} caption={caption} tagline={tagline} />
        </Sequence>
      </AbsoluteFill>
      <FilmGrade vignette={0.3} grain={0.05} />
      {showSlate && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center' }}>
          <span style={{ background: '#ff5436', color: '#140f0c', fontFamily: MONO, fontWeight: 800, fontSize: 22, letterSpacing: '0.12em', padding: '8px 14px' }}>{UNPUBLISHED_SLATE}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
