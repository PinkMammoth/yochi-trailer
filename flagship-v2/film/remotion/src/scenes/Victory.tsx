// The resolution: the ink clears (a brush wipe) to reveal Duel Master in her approved victory pose, her blade
// lowered, completely in control. Her expression gets almost two seconds alone. Then 勝 and her payout (+19 USDC,
// what the winner takes from a 10 + 10 USDC Sudden Death pot after the 5% rake) on a mid hit, and the house seal
// with the lockup on the music's last hit, held through the ring-out. No morph from the attack pose: the wipe is
// the cut. 2.5D kept restrained: a slow push, motes drifting at depth in front of her, nothing on the painting.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { DELA, MONO, PAPER, UP_PAPER } from '../lib/brand';
import { Flat } from '../lib/camera';
import { useFmt } from '../lib/frame';
import { Panel, StampSeal, type Pt } from '../lib/manga';
import { easeInOut, easeOut, lerp, riseK, shakeAt, slamK, stampK } from '../lib/motion';
import { Motes } from '../lib/Motes';
import { ART, FPS, MATCH, T } from '../data';

/** lockup=false (the flagship): no seal, no YOCHI DUELS card; the shot carries on into the pullback. */
export const Victory: React.FC<{ lockup?: boolean }> = ({ lockup = true }) => {
  const V = T.victory;
  const t = V.start + useCurrentFrame() / FPS;
  const { land, W, H } = useFmt();
  const A = ART.victory;
  const k = easeInOut((t - V.start) / (V.end - V.start));
  const sh = shakeAt(t, lockup ? [{ t: V.amount, px: 4, dur: 0.3 }, { t: V.brand + 0.07, px: 6, dur: 0.38 }] : [{ t: V.amount, px: 4, dur: 0.3 }]);
  // 16:9 the painting is the frame (1672x941 at 1.148x); 9:16 she fills a tall top panel and the card sits below
  const z0 = land ? W / A.w : 1160 / A.h;
  const cam = land
    ? { x: lerp(A.w / 2, A.w / 2 + 60, k), y: lerp(A.h / 2, A.h / 2 - 10, k), z: z0 * lerp(1.0, 1.045, k) }
    : { x: lerp(560, 590, k), y: A.h / 2, z: z0 * lerp(1.0, 1.04, k) };
  const at: [number, number] = land ? [W / 2, H / 2] : [W / 2, 580];
  const amt = riseK(t, V.amount, 0.45);
  const seal = stampK(t, V.brand);
  const word = slamK(t, V.brand + 0.07, 1.3, 0.16);
  const sub = slamK(t, V.sub, 1.25, 0.14);
  const url = easeOut((t - V.url) / 0.35);
  const col = land ? { cx: 1590, pay: 70, seal: 288, word: 450, sub: 690, url: 762 } : { cx: W / 2, pay: 1215, seal: 1400, word: 1580, sub: 1690, url: 1770 };
  const sealS = land ? 150 : 140;
  const painting = <Flat src={A.src} w={A.w} h={A.h} cam={cam} at={at} />;
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {land ? painting : (
          // 9:16: her panel is centred for the reveal, then rises to make room for the payout and the card
          <AbsoluteFill style={{ transform: `translateY(${lerp(380, 0, easeInOut((t - (V.amount - 0.62)) / 0.55))}px)` }}>
            <Panel poly={[[0, 0], [W, 0], [W, 1110], [0, 1190]] as Pt[]} border={PAPER.ink} bw={6}>{painting}</Panel>
          </AbsoluteFill>
        )}
        <Motes t={t} n={34} strength={0.55} tint="22,19,15" />
        {/* her payout, beside her: the only glow in the film */}
        <div style={{ position: 'absolute', left: col.cx - 330, width: 660, top: col.pay, textAlign: 'center', opacity: amt.a, transform: `translateY(${amt.y}px)` }}>
          <div style={{ fontFamily: DELA, fontSize: 52, lineHeight: 1, color: PAPER.ink }}>{MATCH.her.handle}</div>
          <div style={{ fontFamily: DELA, fontSize: 96, lineHeight: 1.12, color: UP_PAPER, textShadow: `0 0 ${26 * amt.a}px rgba(61,220,132,0.45)` }}>+{MATCH.payout} USDC</div>
        </div>
        <StampSeal t={t} t0={V.amount - 0.07} glyph="勝" x={land ? col.cx + 250 : col.cx + 300} y={land ? col.pay + 22 : col.pay + 10} size={land ? 104 : 96} fill={PAPER.red} ink={PAPER.onRed} rest={-10} />
        {/* the lockup */}
        {lockup && seal.a > 0 && (
          <Img src={staticFile('logo/yochi-seal-paper.svg')} style={{ position: 'absolute', left: col.cx - sealS / 2, top: col.seal, width: sealS, height: sealS, opacity: seal.a, transform: `scale(${seal.s}) rotate(${seal.r + 10}deg)` }} />
        )}
        {lockup && word.a > 0 && (
          <div style={{ position: 'absolute', left: col.cx - 500, width: 1000, top: col.word, textAlign: 'center', fontFamily: DELA, fontSize: land ? 108 : 84, lineHeight: 1.02, color: PAPER.ink, transform: `scale(${word.s})` }}>
            {land ? <>YOCHI<br />DUELS</> : 'YOCHI DUELS'}
          </div>
        )}
        {lockup && sub.a > 0 && (
          <div style={{ position: 'absolute', left: col.cx - 500, width: 1000, top: col.sub, textAlign: 'center', fontFamily: DELA, fontSize: land ? 48 : 54, lineHeight: 1, color: PAPER.red, transform: `scale(${sub.s})` }}>SUDDEN DEATH</div>
        )}
        <div style={{ position: 'absolute', left: col.cx - 500, width: 1000, top: col.url, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: '0.2em', paddingLeft: '0.2em', color: PAPER.ink, opacity: lockup ? url : 0 }}>yochigg.xyz</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
