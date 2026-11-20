// 10.74-13.60: on the final hit, the page: Duel Master composed and alive, 勝, her payout rising; then the house seal
// stamps and the lockup: YOCHI DUELS · SUDDEN DEATH · yochigg.xyz, held through the music's ring-out.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { DELA, MONO, PAPER, UP_PAPER } from '../lib/brand';
import { Painting } from '../lib/camera';
import { useFmt } from '../lib/frame';
import { Panel, StampSeal, bbox, type Pt } from '../lib/manga';
import { easeInOut, easeOut, lerp, riseK, shakeAt, slamK, stampK } from '../lib/motion';
import { FPS, MATCH, T, fr } from '../data';

export const Finale: React.FC = () => {
  const S = T.finale;
  const t = S.start + useCurrentFrame() / FPS;
  const { land, W, H, safe } = useFmt();
  const dur = fr(S.end - S.start);
  const sh = shakeAt(t, [{ t: S.win, px: 6, dur: 0.38 }, { t: S.brand + 0.07, px: 6, dur: 0.38 }]);
  const panel: Pt[] = land ? [[0, 0], [820, 0], [740, H], [0, H]] : [[0, 0], [W, 0], [W, 1060], [0, 1160]];
  const open = easeOut((t - S.start) / 0.14);
  const amt = riseK(t, S.amount, 0.4);
  const seal = stampK(t, S.brand);
  const word = slamK(t, S.brand + 0.07, 1.3, 0.16);
  const sub = slamK(t, S.sub, 1.25, 0.14);
  const url = easeOut((t - S.url) / 0.3);
  const col = land ? { cx: 1340, top: 150 } : { cx: W / 2, top: 1230 };
  const sealS = land ? 230 : 190;
  return (
    <AbsoluteFill style={{ background: PAPER.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <AbsoluteFill style={{ transform: land ? `translateX(${(1 - open) * -120}px)` : `translateY(${(1 - open) * -160}px)` }}>
          <Panel poly={panel} border={PAPER.ink} bw={6}>
            <Painting id="duel-master" ground="paper" cam={{ x: 860, y: land ? 760 : 700, z: (land ? 0.98 : 1.1) * lerp(1, 1.06, easeInOut((t - S.start) / 2.8)) }} dur={dur}
              at={land ? [380, 540] : [540, 560]} box={bbox(panel)} ambient={{ breath: 0.012, sway: 0.5 }} atmosphere={{ dust: 60, ink: 8, bokeh: 2, wind: 1 }} />
          </Panel>
        </AbsoluteFill>
        <StampSeal t={t} t0={S.win - 0.07} glyph="勝" x={land ? 660 : 930} y={land ? 120 : 140} size={land ? 160 : 150} fill={PAPER.red} ink={PAPER.onRed} rest={-10} />
        {/* her payout, low on her panel: the only glow in the film */}
        <div style={{ position: 'absolute', left: safe.x, ...(land ? { bottom: safe.y + 10 } : { top: 860 }), opacity: amt.a, transform: `translateY(${amt.y}px)` }}>
          <div style={{ display: 'inline-block', background: PAPER.surface1, boxShadow: `0 0 0 4px ${PAPER.ink}`, padding: '14px 26px 10px' }}>
            <div style={{ fontFamily: DELA, fontSize: 44, lineHeight: 1, color: PAPER.ink }}>{MATCH.her.handle}</div>
            <div style={{ fontFamily: DELA, fontSize: land ? 92 : 88, lineHeight: 1.08, color: UP_PAPER, textShadow: `0 0 ${24 * amt.a}px rgba(61,220,132,0.4)` }}>+{MATCH.payout} USDC</div>
          </div>
        </div>
        {/* the lockup */}
        {seal.a > 0 && (
          <Img src={staticFile('logo/yochi-seal-paper.svg')} style={{ position: 'absolute', left: col.cx - sealS / 2, top: col.top, width: sealS, height: sealS, opacity: seal.a, transform: `scale(${seal.s}) rotate(${seal.r + 10}deg)` }} />
        )}
        {word.a > 0 && (
          <div style={{ position: 'absolute', left: col.cx - 600, width: 1200, top: col.top + sealS + 40, textAlign: 'center', fontFamily: DELA, fontSize: land ? 112 : 104, lineHeight: 1, color: PAPER.ink, transform: `scale(${word.s})` }}>
            {land ? 'YOCHI DUELS' : <>YOCHI<br />DUELS</>}
          </div>
        )}
        {sub.a > 0 && (
          <div style={{ position: 'absolute', left: col.cx - 600, width: 1200, top: col.top + sealS + (land ? 182 : 284), textAlign: 'center', fontFamily: DELA, fontSize: land ? 64 : 60, lineHeight: 1, color: PAPER.red, transform: `scale(${sub.s})` }}>
            SUDDEN DEATH
          </div>
        )}
        <div style={{ position: 'absolute', left: col.cx - 600, width: 1200, top: col.top + sealS + (land ? 300 : 392), textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: '0.2em', paddingLeft: '0.2em', color: PAPER.ink, opacity: url }}>
          yochigg.xyz
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
