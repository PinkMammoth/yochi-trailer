// Example shots. Plain data: Blender's exporter imports this file too (node --experimental-strip-types).
import { IMPACT_DRAMATIC, IMPACT_HOUSE, type ShotSpec } from '../lib/shot.ts';

/** The approved 2.5D test (demo-2p5d), rebuilt on the package: Untouchable, one dramatic hit at 3.2 s. */
export const untouchable169: ShotSpec = {
  character: 'untouchable', format: '16:9', durationInFrames: 150,
  camera: { push: [1, 1.12], truck: [-26, 6] },
  ambient: { breath: 0.0045, sway: 0.25 },
  impact: {
    frame: 96, ...IMPACT_DRAMATIC,
    slash: { from: [0.997, 0.065], to: [0.57, 0.958], width: 170, behind: true },
    seal: { glyph: '連勝', at: [0.839, 0.759], size: 210 },
    burst: true,
  },
};

export const untouchable916: ShotSpec = {
  ...untouchable169, format: '9:16',
  camera: { push: [1, 1.1], truck: [-18, 10] },
  impact: {
    ...untouchable169.impact!,
    slash: { from: [1.02, 0.05], to: [0.52, 0.47], width: 150, behind: true },
    seal: { glyph: '連勝', at: [0.8, 0.6], size: 200 },
  },
};

/** Duel Master (house BiRefNet matte, no hand-authored hints): her reward glyph 師. Her ground is a vermilion
 *  disc, so a vermilion slash would vanish into it: the slash is sumi ink here. */
export const duelMaster169: ShotSpec = {
  character: 'duel-master', format: '16:9', durationInFrames: 150,
  camera: { push: [1, 1.1], truck: [24, -6] },
  ambient: { breath: 0.0045, sway: 0.2 },
  light: { angle: [200, 160] },
  impact: {
    frame: 96, ...IMPACT_DRAMATIC,
    slash: { from: [1.0, 0.02], to: [0.6, 0.62], width: 160, behind: true, tone: 'ink' },
    seal: { glyph: '師', at: [0.13, 0.74], size: 210 },
    burst: true,
  },
};

export const duelMaster916: ShotSpec = {
  ...duelMaster169, format: '9:16',
  camera: { push: [1, 1.1], truck: [16, -10] },
  impact: {
    ...duelMaster169.impact!,
    slash: { from: [1.02, 0.12], to: [0.58, 0.46], width: 150, behind: true, tone: 'ink' },
    seal: { glyph: '師', at: [0.22, 0.62], size: 200 },
  },
};

/**
 * Dynamic sequences use cuts, not choreography. Three shots, 2.5 s: an ink silhouette tease (a locked reward),
 * a hard cut to the painting on the hit (the unlock, house impact numbers), a hard cut to another painting gone
 * grey (the loss). Silhouettes need a clean figure matte: Untouchable's is, Duel Master's carries some of her disc.
 */
export const cutSequence: { from: number; spec: ShotSpec }[] = [
  { from: 0, spec: { character: 'untouchable', format: '16:9', durationInFrames: 22, variant: 'silhouette', camera: { push: [1.0, 1.04], truck: [0, 0] }, atmosphere: { dust: 40, ink: 10, bokeh: 2 } } },
  { from: 22, spec: { character: 'untouchable', format: '16:9', durationInFrames: 30, camera: { push: [1.06, 1.12], truck: [-10, 0], offset: 60 },
      impact: { frame: 0, ...IMPACT_HOUSE, slash: { from: [0.997, 0.065], to: [0.57, 0.958], width: 170, behind: true, reveal: 2 }, seal: { glyph: '連勝', at: [0.839, 0.759], size: 210 }, burst: true } } },
  { from: 52, spec: { character: 'duel-master', format: '16:9', durationInFrames: 23, variant: 'grey', camera: { push: [1.08, 1.03], truck: [0, 0] }, ambient: { breath: 0, sway: 0 },
      impact: { frame: 0, ...IMPACT_HOUSE, punch: 0.04, flash: 0 } } },
];
