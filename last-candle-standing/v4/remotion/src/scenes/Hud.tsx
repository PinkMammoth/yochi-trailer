// The prize pool, kept on screen through the rounds so the stake never leaves: top right in 16:9, bottom centre
// in 9:16. One quiet element, the only persistent HUD.
import React from 'react';
import { MONO, SUMI } from '../lib/brand';
import { useFmt } from '../lib/frame';
import { clamp, easeOut } from '../lib/motion';
import { POT } from '../data';

export const PoolHud: React.FC<{ t: number; t0: number; unit?: string }> = ({ t, t0, unit = 'USDC' }) => {
  const { land, H, safe } = useFmt();
  const k = easeOut(clamp((t - t0) / 0.2));
  if (k <= 0) return null;
  const box: React.CSSProperties = land
    ? { right: safe.x, top: safe.y + 10, textAlign: 'right' }
    : { left: 0, right: 0, top: H - safe.y - 66, textAlign: 'center' };
  return (
    <div style={{ position: 'absolute', ...box, opacity: k, transform: `translateY(${(1 - k) * -10}px)`, whiteSpace: 'nowrap' }}>
      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: land ? 26 : 28, letterSpacing: '0.2em', color: SUMI.muted }}>POOL </span>
      <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: land ? 44 : 46, color: SUMI.ink }}>{POT}</span>
      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: land ? 26 : 28, letterSpacing: '0.1em', color: SUMI.ink }}> {unit}</span>
    </div>
  );
};
