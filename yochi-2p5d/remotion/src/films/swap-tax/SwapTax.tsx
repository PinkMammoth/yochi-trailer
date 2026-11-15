// THE SWAP TAX: a 12-second 9:16 comedy short for Yochi on Elysium. 1080x1920, 60 fps.
//
//   0.00  Duel Master arrives at the arcade doors. Guardian 1 (Took the Pool): SWAP TO USDC.
//   2.17  she complies: the swap goes through, and the fee comes off (grey: a loss)
//   3.01  Guardian 2 (Insider, his sealed envelope): APPROVE SPENDING.
//   4.27  Guardian 3 (Hundred Trials) and an enormous scroll of paperwork: STEP 3 OF 47
//   5.12  she freezes; a slow push into her eyes. The music cuts out at 6.00
//   6.39  silence; the hilt, then the blade comes up (two cuts and a whip, no choreography)
//   7.00  one vermilion dry-brush slash on the drop: paper flash, 2 ink-negative frames, hit-stop, shake;
//         the guardians go grey and are swept off in a cloud of parchment
//   7.66  the doors open onto paper: SKIP THE SWAP. / SKIP THE APPROVAL. / JUST HYPE. / the seal / the caption
//
// Technical claim (README): on Elysium you stake native HYPE, so there's no USDC swap and no ERC-20 approval.
// Wallet confirmations remain, and the end card says so.
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { CharacterShot } from '../../lib/CharacterShot';
import { drawSlash } from '../../lib/slash';
import type { ShotSpec } from '../../lib/shot';
import { CAPTIONS, UNPUBLISHED_SLATE, type CaptionId } from '../captions';
import {
  DELA, FPS, FilmGrade, FragmentSprite, H, InlineSeal, Label, MONO, PAPER, Paper, SAFE, SUMI, SlamText, Splatter, Sumi, W,
  addShake, easeIO, easeO, fragAt, lerp, makeFragments, prog, rgba, sec, shake, slamK, useFilmFonts, TextAudit,
} from '../kit';
import T from './timing.json';

export interface SwapTaxProps {
  caption: CaptionId;
  slate?: boolean;
  audio?: boolean;
  /** tools/text-audit.mts sets this */
  audit?: boolean;
}
export const ST_DURATION = sec(T.dur);

const HIT = T.strike.hit;
const RELEASE = HIT + T.strike.hitStop;

// ------------------------------------------------------------------ the painted shots (yochi-2p5d)
const comply: ShotSpec = {
  character: 'duel-master', format: '9:16', fps: FPS, durationInFrames: sec(T.g2 - T.comply.start), ground: 'sumi',
  camera: { push: [1.04, 1.1], truck: [10, -6] }, ambient: { breath: 0.006, sway: 0.25 },
  light: { angle: [200, 170], shadow: 0.3, pool: 0.08 }, atmosphere: { dust: 80, ink: 16, bokeh: 3, wind: 0.6 }, grade: false,
};
// the freeze: no breath, no sway; a slow push into her eyes
const freeze: ShotSpec = {
  character: 'duel-master', format: '9:16', fps: FPS, durationInFrames: sec(T.freeze.end - T.freeze.start), ground: 'sumi',
  framing: { center: [945, 640], width: 780, pushTarget: [948, 548] },
  camera: { push: [1.0, 2.15], truck: [0, 0], toTarget: 1 }, ambient: { breath: 0, sway: 0 },
  light: { angle: [190, 190], shadow: 0.3, pool: 0 }, atmosphere: { dust: 30, ink: 0, bokeh: 0, wind: 0.15 }, grade: false,
};
const hiltDur = sec(T.draw.whip[0] - T.draw.start);
const hilt: ShotSpec = {
  character: 'duel-master', format: '9:16', fps: FPS, durationInFrames: hiltDur, ground: 'sumi',
  framing: { center: [1130, 1380], width: 560 }, camera: { push: [1.0, 1.04], truck: [0, 0], toTarget: 0 },
  ambient: { breath: 0, sway: 0 }, light: { angle: [190, 190], shadow: 0.3, pool: 0 }, atmosphere: { dust: 20, ink: 0, bokeh: 0, wind: 0.1 }, grade: false,
};
const blade: ShotSpec = {
  character: 'duel-master', format: '9:16', fps: FPS, durationInFrames: sec(T.strike.wide - T.draw.whip[0]), ground: 'sumi',
  framing: { center: [1150, 860], width: 600 }, camera: { push: [1.12, 1.0], truck: [0, 0], toTarget: 0 },
  ambient: { breath: 0, sway: 0 }, light: { angle: [190, 190], shadow: 0.3, pool: 0 }, atmosphere: { dust: 20, ink: 0, bokeh: 0, wind: 0.1 }, grade: false,
};

// ------------------------------------------------------------------ the arcade front (built from house shapes)
const DOOR = { x0: 250, x1: 830, y0: 560, y1: 1500 };
const DOOR_C = { x: (DOOR.x0 + DOOR.x1) / 2, y: (DOOR.y0 + DOOR.y1) / 2 };

const Lattice: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{ position: 'absolute', inset: 0, background: SUMI.surface1,
    backgroundImage: `repeating-linear-gradient(90deg, ${rgba(SUMI.ink, 0.1)} 0 2px, transparent 2px 72px), repeating-linear-gradient(0deg, ${rgba(SUMI.ink, 0.1)} 0 2px, transparent 2px 72px)`,
    width: w, height: h, boxShadow: `inset 0 0 0 4px ${SUMI.surface2}` }} />
);

const Facade: React.FC<{ open: number; t: number }> = ({ open, t }) => {
  const half = (DOOR.x1 - DOOR.x0) / 2;
  const g = open * half; // each panel slides this far
  const leak = 0.55 + 0.1 * Math.sin(t * 2.3);
  return (
    <>
      {/* the building front */}
      <div style={{ position: 'absolute', left: 120, top: 330, width: 840, height: 1180, background: `linear-gradient(${SUMI.surface1}, ${SUMI.bg})` }} />
      {/* marquee: the versus-band paper, the plain mark and the wordmark */}
      <div style={{ position: 'absolute', left: 170, top: 370, width: 740, height: 140, background: '#efe7d8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
        <Img src={staticFile('brand/yochi-mark-paper.svg')} style={{ width: 84, height: 84 }} />
        <span style={{ fontFamily: DELA, fontSize: 88, color: PAPER.ink, lineHeight: 1 }}>YOCHI</span>
      </div>
      {/* the opening: paper light inside */}
      <div style={{ position: 'absolute', left: DOOR.x0, top: DOOR.y0, width: DOOR.x1 - DOOR.x0, height: DOOR.y1 - DOOR.y0, overflow: 'hidden' }}>
        <Paper w={DOOR.x1 - DOOR.x0} h={DOOR.y1 - DOOR.y0} seed={31} />
        <div style={{ position: 'absolute', left: -g, top: 0, width: half, height: DOOR.y1 - DOOR.y0 }}><Lattice w={half} h={DOOR.y1 - DOOR.y0} /></div>
        <div style={{ position: 'absolute', left: half + g, top: 0, width: half, height: DOOR.y1 - DOOR.y0 }}><Lattice w={half} h={DOOR.y1 - DOOR.y0} /></div>
        {/* the seam: a line of light from inside */}
        {open < 0.02 && <div style={{ position: 'absolute', left: half - 2, top: 0, width: 4, height: '100%', background: rgba(PAPER.bg, leak) }} />}
      </div>
      <div style={{ position: 'absolute', left: DOOR.x0 - 14, top: DOOR.y0 - 14, width: DOOR.x1 - DOOR.x0 + 28, height: DOOR.y1 - DOOR.y0 + 14, boxShadow: `inset 0 0 0 14px ${SUMI.surface2}` }} />
      {/* floor, and the light that spills from the seam / the opening */}
      <div style={{ position: 'absolute', left: 0, top: DOOR.y1, width: W, height: H - DOOR.y1, background: `linear-gradient(${SUMI.surface1}, ${SUMI.bg} 60%)` }} />
      <div style={{ position: 'absolute', left: DOOR_C.x - 60 - g * 1.6, top: DOOR.y1, width: 120 + g * 3.2, height: 420,
        background: `linear-gradient(${rgba(PAPER.bg, 0.16 + 0.3 * open)}, rgba(242,236,224,0))`, clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)' }} />
    </>
  );
};

// ------------------------------------------------------------------ the guardians (kit cards as objects: rung 0)
type G = { card: string; t0: number; at: [number, number, number]; later?: { t: number; at: [number, number, number] }; fly: [number, number, number]; w: number };
const GUARDS: G[] = [
  { card: 'took-the-pool', t0: T.g1, at: [540, 900, -3], later: { t: T.g2, at: [355, 880, -8] }, fly: [-2600, -900, -540], w: 470 },
  { card: 'insider-v2', t0: T.g2, at: [725, 890, 6], fly: [2300, -1300, 620], w: 470 },
  { card: 'hundred-trials', t0: T.g3, at: [540, 960, -1], fly: [-900, 2400, -300], w: 500 },
];

const Guardian: React.FC<{ g: G; t: number }> = ({ g, t }) => {
  const k = slamK(t, g.t0);
  if (!k.on) return null;
  let [x, y, r] = g.at;
  if (g.later && t > g.later.t) {
    const m = easeO(prog(t, g.later.t, 0.2));
    x = lerp(x, g.later.at[0], m); y = lerp(y, g.later.at[1], m); r = lerp(r, g.later.at[2], m);
  }
  let blur = 0, grey = 0;
  if (t >= HIT) grey = 1;
  if (t >= RELEASE) {
    const s = t - RELEASE;
    x += g.fly[0] * s; y += g.fly[1] * s + 900 * s * s; r += g.fly[2] * s;
    blur = Math.min(10, 40 * s);
    if (s > 0.8) return null;
  }
  const h = (g.w * 2048) / 1536;
  return (
    <div style={{ position: 'absolute', left: x - g.w / 2, top: y - h / 2, width: g.w, height: h, transform: `rotate(${r}deg) scale(${k.scale})`,
      filter: `${grey ? 'grayscale(1) contrast(0.72) brightness(1.1)' : ''} ${blur ? `blur(${blur}px)` : ''} drop-shadow(0 18px 24px rgba(0,0,0,0.55))` }}>
      <Img src={staticFile(`cards/${g.card}.webp`)} style={{ width: g.w, height: h }} />
      {grey ? <div style={{ position: 'absolute', inset: 0, background: rgba(SUMI.out, 0.35) }} /> : null}
    </div>
  );
};

// ------------------------------------------------------------------ the scroll
const SCROLL_LINES = [
  'ROUTE  HYPE → USDC', 'SLIPPAGE TOLERANCE  0.5%', 'QUOTE EXPIRED. REQUOTE', 'APPROVE USDC SPENDING', 'ALLOWANCE  UNLIMITED?',
  'GAS ESTIMATE', 'CONFIRM ROUTE', 'MINIMUM RECEIVED', 'PRICE IMPACT', 'REVIEW ALLOWANCE', 'STAMP HERE ____', 'AND HERE ____',
  'FORM 7B  (BRIDGE)', 'SECOND QUOTE', 'APPROVE AGAIN', 'ROUTE  USDC → ENTRY', 'INITIAL HERE ____', 'ADDENDUM 12',
];
const Scroll: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.scroll[0] || t >= RELEASE) return null;
  const top = 1230, w = 420, x = 375 - w / 2;
  const L = 1100 * easeO(prog(t, T.scroll[0], T.scroll[1] - T.scroll[0]));
  return (
    <>
      <div data-audit="prop" style={{ position: 'absolute', left: x, top, width: w, height: L, overflow: 'hidden', background: '#efe7d8', boxShadow: '0 20px 40px rgba(0,0,0,0.45)' }}>
        <div style={{ padding: '26px 30px 0', fontFamily: DELA, fontSize: 30, color: PAPER.ink, lineHeight: 1.1 }}>ENTRY PAPERWORK</div>
        <div style={{ padding: '8px 30px', fontFamily: MONO, fontWeight: 700, fontSize: 17, color: PAPER.muted, letterSpacing: '0.12em' }}>STEP 3 OF 47</div>
        {SCROLL_LINES.map((l, i) => (
          <div key={i} style={{ padding: '0 30px', height: 46, display: 'flex', alignItems: 'center', borderTop: `1px solid ${rgba(PAPER.ink, 0.12)}`, fontFamily: MONO, fontWeight: 500, fontSize: 18, color: PAPER.ink, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            <span style={{ color: PAPER.muted, width: 46 }}>{String(i + 1).padStart(2, '0')}</span>{l}
          </div>
        ))}
      </div>
      {/* the roll at the leading edge */}
      <div style={{ position: 'absolute', left: x - 18, top: top + L - 26, width: w + 36, height: 52, borderRadius: 26, background: 'linear-gradient(#cfc6b4, #efe7d8 40%, #b8ae9b)', boxShadow: '0 14px 22px rgba(0,0,0,0.5)' }} />
    </>
  );
};

// ------------------------------------------------------------------ Duel Master as a cut-out in front of the doors (rung 2-4)
const DMCut: React.FC<{ t: number }> = ({ t }) => {
  const s = 0.47, w = 1392 * s, h = 1828 * s;
  const enter = easeO(prog(t, T.enter[0], T.enter[1] - T.enter[0]));
  const frozen = t > T.g3 + 0.4 && t < HIT;
  const breath = frozen ? 0 : 0.006 * (0.5 - 0.5 * Math.cos(t * 1.9));
  const recoil = t >= HIT ? -26 * Math.exp(-(t - HIT) * 6) : 0;
  const x = 455 + (1 - enter) * 110 + recoil;
  const y = H - h + 60;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transformOrigin: '50% 100%', transform: `scale(${(1 + breath * 0.3) * (0.96 + 0.04 * enter)}, ${(1 + breath) * (0.96 + 0.04 * enter)})` }}>
      <Img src={staticFile('characters/duel-master/fig.png')} style={{ width: w, height: h, filter: 'drop-shadow(-18px 0 40px rgba(0,0,0,0.55))' }} />
    </div>
  );
};

const StrikeSlash: React.FC<{ f: number; fade: number }> = ({ f, fade }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    drawSlash(ctx, { from: [1.06, 0.27], to: [-0.06, 0.6], width: 210, reveal: 5, tone: 'red' }, f, sec(HIT), W, H, 'sumi');
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 1 - fade }} />;
};

const Parchment: React.FC<{ t: number; fade: number }> = ({ t, fade }) => {
  const frags = useMemo(() => {
    const a = makeFragments(60, 71, 380, 1500, 380, 600, 1.1); // the scroll
    const b = makeFragments(50, 72, 540, 900, 600, 500, 1.3); // the guardians' paperwork
    return [...a, ...b].map((fr) => ({ ...fr, vx: fr.vx - 700 }));
  }, []);
  if (t < RELEASE) return null;
  const s = t - RELEASE;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - fade }}>
      {frags.map((fr, i) => {
        const p = fragAt(fr, Math.max(0, s - fr.delay));
        if (p.y > H + 200) return null;
        return (
          <div key={i} style={{ position: 'absolute', left: p.x - fr.w / 2, top: p.y - fr.h / 2, transform: `rotate(${p.rot}deg) scaleX(${0.25 + 0.75 * Math.abs(p.sx)})` }}>
            <FragmentSprite fr={fr} grey={i % 3 === 0} />
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ top captions over the door scene
const DoorCaptions: React.FC<{ t: number }> = ({ t }) => {
  const step = t >= T.g3 ? 'STEP 3 OF 47' : t >= T.g2 ? 'STEP 2 OF 3' : t >= T.g1 ? 'STEP 1 OF 2' : null;
  const head = t >= T.g3 ? null : t >= T.g2 ? { s: 'APPROVE SPENDING.', t0: T.g2 } : t >= T.g1 ? { s: 'SWAP TO USDC.', t0: T.g1 } : null;
  if (t >= HIT) return null;
  const stepK = slamK(t, t >= T.g3 ? T.g3 : t >= T.g2 ? T.g2 : T.g1);
  return (
    <>
      {step && <Label x={W / 2} y={150} size={32} color={t >= T.g3 ? SUMI.red : SUMI.muted} align="center" style={{ transform: `translateY(-50%) scale(${t >= T.g3 ? stepK.scale : 1})` }}>{step}</Label>}
      {head && <SlamText t={t} t0={head.t0} x={W / 2} y={250} size={70} tracking={-0.01} color={SUMI.ink}>{head.s}</SlamText>}
    </>
  );
};

// ------------------------------------------------------------------ the swap going through (rebuilt UI chip)
const SwapChip: React.FC<{ t: number }> = ({ t }) => {
  const C = T.comply;
  const p = easeIO(prog(t, C.bar[0], C.bar[1] - C.bar[0]));
  const done = t >= C.done;
  const k = slamK(t, C.start + 0.08);
  if (!k.on) return null;
  return (
    <div style={{ position: 'absolute', left: SAFE.x, right: SAFE.x, top: 1440, height: 300, background: rgba(SUMI.surface1, 0.94), boxShadow: `inset 0 0 0 2px ${rgba(SUMI.ink, 0.12)}`, transform: `scale(${1 + (k.scale - 1) * 0.3})` }}>
      <Label x={36} y={52} size={26} color={SUMI.muted}>{done ? 'SWAPPED' : 'SWAPPING'}</Label>
      <div style={{ position: 'absolute', left: 36, top: 92, fontFamily: MONO, fontWeight: 800, fontSize: 68, color: SUMI.ink, lineHeight: 1, whiteSpace: 'nowrap' }}>
        10 HYPE <span style={{ color: SUMI.muted }}>→</span> 417.05 USDC
      </div>
      <div style={{ position: 'absolute', left: 36, right: 36, top: 186, height: 12, background: SUMI.surface2 }}>
        <div style={{ width: `${p * 100}%`, height: '100%', background: done ? SUMI.out : SUMI.ink }} />
      </div>
      {t >= C.fee && (
        <div style={{ position: 'absolute', left: 36, top: 222, fontFamily: MONO, fontWeight: 700, fontSize: 34, color: SUMI.out, letterSpacing: '0.04em', transform: `translateY(${-14 * (1 - easeO(prog(t, C.fee, 0.2)))}px)`, opacity: easeO(prog(t, C.fee, 0.2)) }}>
          − 1.25 USDC  FEES + SLIPPAGE
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ the end card (paper)
const EndCard: React.FC<{ t: number; caption: CaptionId }> = ({ t, caption }) => {
  const C = CAPTIONS[caption];
  const [l1, l2, l3] = T.lines;
  return (
    <>
      <Paper />
      <SlamText t={t} t0={l1} x={W / 2} y={330} size={70} color={PAPER.ink} tracking={-0.02}>SKIP THE SWAP.</SlamText>
      <SlamText t={t} t0={l2} x={W / 2} y={440} size={70} color={PAPER.ink} tracking={-0.02}>SKIP THE APPROVAL.</SlamText>
      <SlamText t={t} t0={l3} x={W / 2} y={610} size={124} color={PAPER.red}>JUST HYPE.</SlamText>
      {t >= T.seal - 0.15 && (
        <div style={{ position: 'absolute', left: 0, width: W, top: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <InlineSeal t={t} t0={T.seal} size={230} ground="paper" />
        </div>
      )}
      <Splatter t={t} t0={T.seal} x={W / 2} y={1015} spread={190} color={PAPER.red} n={12} seed={4} />
      {t >= T.seal && (
        <div style={{ position: 'absolute', left: 0, width: W, top: 1240, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, fontFamily: DELA, fontSize: 70, color: PAPER.ink, lineHeight: 1, opacity: easeO(prog(t, T.seal + 0.05, 0.15)) }}>
          YOCHI <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 42, color: PAPER.muted }}>×</span>
          <Img src={staticFile('brand/elysium-logomark-colorized.svg')} style={{ width: 68, height: 68 }} /> ELYSIUM
        </div>
      )}
      <SlamText t={t} t0={T.caption} x={W / 2} y={1385} size={74 * (C.scale ?? 1)} color={PAPER.ink}>{C.line}</SlamText>
      {t >= T.caption && (
        <>
          <Label x={W / 2} y={1490} size={64} color={PAPER.redText} align="center" weight={700} tracking={0}>{C.url}</Label>
          <div style={{ position: 'absolute', left: 0, width: W, top: 1620, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 23, lineHeight: 1.55, letterSpacing: '0.08em', color: PAPER.muted }}>
            NATIVE HYPE ON ELYSIUM: NO USDC SWAP, NO ERC-20 APPROVAL.<br />
            YOU STILL CONFIRM EACH TRANSACTION IN YOUR WALLET.
            {C.small && <><br /><span style={{ color: PAPER.ink }}>{C.small}</span></>}
          </div>
        </>
      )}
    </>
  );
};

// ------------------------------------------------------------------ the film
export const SwapTax: React.FC<SwapTaxProps> = ({ caption = 'testnet', slate, audio = true, audit }) => {
  useFilmFonts();
  const f = useCurrentFrame();
  const t = f / FPS;
  const showSlate = (slate ?? true) && !CAPTIONS[caption].published;

  const inComply = t >= T.comply.start && t < T.g2;
  const inFreeze = t >= T.freeze.start && t < T.draw.start;
  const inDraw = t >= T.draw.start && t < T.strike.wide;
  const inEnd = t >= T.lines[0];
  const inDoor = !inComply && !inFreeze && !inDraw && !inEnd;

  // door-scene camera: a slow drift in, then the push through the opening doors
  const open = easeIO(prog(t, T.doors[0], 0.36));
  const through = Math.pow(prog(t, T.doors[0] + 0.08, T.doors[1] - T.doors[0] - 0.08), 2.2);
  const zoom = lerp(1.0, 1.06, prog(t, 0, T.strike.hit)) * lerp(1, 5.2, through);
  // shakes: house 6 px on each guardian; the strike is the film's one decisive hit (USDC v3 exception: 18 px, 0.65 s)
  const [sx, sy, sr] = addShake(
    shake(t, T.g1, 6, 0.38, 3), shake(t, T.g2, 6, 0.38, 5), shake(t, T.g3, 8, 0.38, 7),
    shake(t, HIT, 18, 0.65, 9), shake(t, T.seal, 5, 0.38, 11),
  );
  const fh = f - sec(HIT);
  const flash = fh === 0;
  const inkNeg = fh === 1 || fh === 2;
  return (
    <AbsoluteFill style={{ background: SUMI.bg, overflow: 'hidden' }}>
      {audio && <Audio src={staticFile('audio/swap-tax.wav')} />}
      {inDoor && (
        <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)`, filter: inkNeg ? 'grayscale(1) contrast(40) invert(1) sepia(0.12)' : undefined }}>
          <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${DOOR_C.x}px ${DOOR_C.y + 40}px` }}>
            <Sumi />
            <Facade open={open} t={t} />
            {GUARDS.map((g) => <Guardian key={g.card} g={g} t={t} />)}
            <Scroll t={t} />
            {/* the foreground leaves frame as the camera goes through the doors */}
            <AbsoluteFill style={{ transform: `translate(${through * 420}px, ${through * 900}px)`, transformOrigin: '70% 100%' }}>
              <DMCut t={t} />
            </AbsoluteFill>
          </AbsoluteFill>
          <StrikeSlash f={f} fade={through} />
          <Parchment t={t} fade={through} />
          <DoorCaptions t={t} />
          {flash && <AbsoluteFill style={{ background: '#fff8ea', opacity: 0.9 }} />}
        </AbsoluteFill>
      )}
      <Sequence from={sec(T.comply.start)} durationInFrames={comply.durationInFrames} premountFor={20}>
        <CharacterShot spec={comply} />
        <SwapChip t={t} />
      </Sequence>
      <Sequence from={sec(T.freeze.start)} durationInFrames={freeze.durationInFrames} premountFor={20}>
        <CharacterShot spec={freeze} />
        {/* the world closes in on her: the vignette tightens as the push lands */}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 50% 42%, rgba(0,0,0,0) 40%, rgba(8,6,4,${0.25 + 0.6 * prog(t, T.freeze.start, 1.2)}) 100%)` }} />
      </Sequence>
      <Sequence from={sec(T.draw.start)} durationInFrames={hiltDur} premountFor={20}>
        <AbsoluteFill style={{ transform: `translateY(${900 * Math.pow(prog(t, T.draw.whip[0] - 0.07, 0.07), 2)}px)`, filter: `blur(${18 * prog(t, T.draw.whip[0] - 0.07, 0.07)}px)` }}>
          <CharacterShot spec={hilt} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={sec(T.draw.whip[0])} durationInFrames={blade.durationInFrames} premountFor={20}>
        <AbsoluteFill style={{ transform: `translateY(${-700 * (1 - easeO(prog(t, T.draw.whip[0], 0.1)))}px)`, filter: `blur(${16 * (1 - easeO(prog(t, T.draw.whip[0], 0.1)))}px)` }}>
          <CharacterShot spec={blade} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 45%, rgba(0,0,0,0) 45%, rgba(8,6,4,0.7) 100%)` }} />
      </Sequence>
      {inEnd && (
        <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
          <EndCard t={t} caption={caption} />
        </AbsoluteFill>
      )}
      <TextAudit on={audit} film="swap-tax" />
      <FilmGrade vignette={inEnd ? 0.16 : 0.32} grain={0.05} />
      {showSlate && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center' }}>
          <span style={{ background: '#ff5436', color: '#140f0c', fontFamily: MONO, fontWeight: 800, fontSize: 22, letterSpacing: '0.12em', padding: '8px 14px' }}>{UNPUBLISHED_SLATE}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

