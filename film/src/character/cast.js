// Palettes and the named cast. Shells are lacquer; trims are gunmetal; accents are the identity
// colour carried by the crown stripes, harness inlays, pauldron edges and sole lines. The pick
// (green / red) never becomes an identity colour: it only lives on the visor, the cheek slits,
// the taillight and the harness knot.

export const YOCHI = {
  void: [7, 6, 12], text: [245, 243, 255], muted: [168, 162, 200], faint: [141, 135, 176],
  cyan: [24, 224, 255], green: [57, 255, 20], red: [255, 56, 96], red2: [255, 0, 79], gold: [255, 194, 58],
};

export const SHELLS = {
  pearl: [226, 224, 240],   // YOU only
  slate: [84, 82, 106],     // the crowd
  obsidian: [30, 27, 38],   // the rival
  bronze: [92, 80, 72], violet: [96, 84, 124], jade: [70, 96, 90], plum: [80, 70, 104], steel: [66, 72, 96],
};

export const CRESTS = { dome: 0, bear: 1, bull: 2, antenna: 3, frog: 4, cat: 5, fin: 6 };

export const PICK = {
  up: YOCHI.green, down: YOCHI.red, none: YOCHI.text,
  of: (call) => (call > 0 ? YOCHI.green : call < 0 ? YOCHI.red : YOCHI.text),
  glyph: (call) => (call > 0 ? 'up' : call < 0 ? 'down' : 'watch'),
};

// suit: satin base; trim: gunmetal; accentI / knotI: how loudly the identity light and the knot glow
export const CAST = {
  you: { name: 'YOU', shell: SHELLS.pearl, trim: [60, 58, 78], accent: YOCHI.cyan, suit: [22, 21, 32], crest: CRESTS.dome },
  crowd: { name: 'CROWD', shell: SHELLS.slate, trim: [40, 38, 54], accent: [150, 144, 190], suit: [22, 21, 32], accentI: 0.35, knotI: 0.55, crest: CRESTS.dome },
  rival: { name: 'EXIT_LIQUIDITY', shell: SHELLS.obsidian, trim: [22, 20, 30], accent: YOCHI.red, suit: [16, 14, 22], crest: CRESTS.bear },
  deano: { name: 'DEANO', shell: SHELLS.bronze, trim: [44, 38, 36], accent: YOCHI.gold, suit: [22, 20, 26], crest: CRESTS.bull },
  soup: { name: 'SOUP', shell: SHELLS.violet, trim: [48, 42, 62], accent: YOCHI.gold, suit: [22, 20, 32], crest: CRESTS.antenna },
  oxtom: { name: '0XTOM', shell: SHELLS.jade, trim: [36, 46, 44], accent: YOCHI.green, suit: [18, 22, 24], crest: CRESTS.frog },
  cope: { name: 'COPE_DEALER', shell: SHELLS.plum, trim: [40, 36, 54], accent: YOCHI.muted, suit: [22, 20, 32], crest: CRESTS.cat },
  finn: { name: 'CROWD / FIN', shell: SHELLS.steel, trim: [36, 38, 52], accent: [120, 150, 200], suit: [20, 20, 30], accentI: 0.5, crest: CRESTS.fin },
};
