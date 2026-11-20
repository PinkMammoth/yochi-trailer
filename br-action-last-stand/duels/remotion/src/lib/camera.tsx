// The camera layer: a source point (x, y) placed at a screen point, at z screen px per source px, rotated r deg.
// Painting: a kit card brought to life by yochi-2p5d (CharacterShot in 'card' format = the painting rect at its
// native pixels, 1392x1828, so our camera never upsamples a pre-scaled render). Flat: a still image (an approved
// pose on its own paper) on the same camera. Neither ever alters the pixels.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { CharacterShot, type ShotSpec } from '../../../../../yochi-2p5d/remotion/src/lib';
import { FPS } from '../data';
import { useFmt } from './frame';
import { easeInOut, lerp } from './motion';

export interface Cam { x: number; y: number; z: number; r?: number }
export const camLerp = (a: Cam, b: Cam, k: number): Cam => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: a.z * Math.pow(b.z / a.z, k), r: lerp(a.r ?? 0, b.r ?? 0, k) });
export const camAt = (a: Cam, b: Cam, t: number, t0: number, t1: number, ease = easeInOut) => camLerp(a, b, ease((t - t0) / (t1 - t0)));

const place = (cam: Cam, sx: number, sy: number, ox = 0, oy = 0): React.CSSProperties => ({
  position: 'absolute', left: 0, top: 0, transformOrigin: '0 0',
  transform: `translate(${sx}px, ${sy}px) rotate(${cam.r ?? 0}deg) scale(${cam.z}) translate(${-(cam.x - ox)}px, ${-(cam.y - oy)}px)`,
});

const PLATE = { x: 72, y: 150, w: 1392, h: 1828 };
/** the painting's safe rect (card px, yochi-2p5d SAFE): clear of the card frame, crests and corner ornaments */
const SAFE = { x0: 108, y0: 262, x1: 1428, y1: 1892 };
export type Box = [number, number, number, number]; // screen rect that shows this painting (a panel's bounds)
/** keep the visible window inside the painting: shift the camera, or push in if the window is too big */
export function clampCam(cam: Cam, at: [number, number], box: Box): Cam {
  const [bx0, by0, bx1, by1] = box;
  let z = Math.max(cam.z, (bx1 - bx0) / (SAFE.x1 - SAFE.x0), (by1 - by0) / (SAFE.y1 - SAFE.y0));
  const lx = (at[0] - bx0) / z, rx = (bx1 - at[0]) / z, ty = (at[1] - by0) / z, by = (by1 - at[1]) / z;
  const x = Math.min(Math.max(cam.x, SAFE.x0 + lx), SAFE.x1 - rx);
  const y = Math.min(Math.max(cam.y, SAFE.y0 + ty), SAFE.y1 - by);
  return { ...cam, x, y, z };
}

export const Painting: React.FC<{
  id: string; cam: Cam; dur: number; at?: [number, number]; box?: Box; ground?: 'sumi' | 'paper';
  ambient?: ShotSpec['ambient']; atmosphere?: ShotSpec['atmosphere']; impact?: ShotSpec['impact']; variant?: ShotSpec['variant'];
}> = ({ id, cam: cam0, dur, at: at0, box, ground = 'sumi', ambient, atmosphere, impact, variant }) => {
  const { W, H } = useFmt();
  const at: [number, number] = at0 ?? [W / 2, H / 2];
  const cam = clampCam(cam0, at, box ?? [0, 0, W, H]);
  const spec: ShotSpec = {
    character: id, format: 'card', fps: FPS, durationInFrames: Math.max(2, dur), ground, grade: false, variant,
    camera: { push: [1, 1], truck: [0, 0], toTarget: 0 },
    ambient: ambient ?? { breath: 0.008, sway: 0.35 },
    atmosphere: atmosphere ?? { dust: 70, ink: 12, bokeh: 3, wind: 1.2 },
    light: { shadow: 0.22, pool: 0.07 },
    impact,
  };
  return (
    <div style={{ ...place(cam, at[0], at[1], PLATE.x, PLATE.y), width: PLATE.w, height: PLATE.h }}>
      <CharacterShot spec={spec} />
    </div>
  );
};

export const Flat: React.FC<{ src: string; w: number; h: number; cam: Cam; at?: [number, number]; style?: React.CSSProperties }> = ({ src, w, h, cam, at, style }) => {
  const { W, H } = useFmt();
  return <Img src={staticFile(src)} style={{ ...place(cam, at?.[0] ?? W / 2, at?.[1] ?? H / 2), width: w, height: h, ...style }} />;
};
