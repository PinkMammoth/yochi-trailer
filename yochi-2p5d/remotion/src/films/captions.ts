// End-card caption variants, shared by the Elysium films. One prop (`caption`) switches them.
//
//   coming-soon  SAFE DEFAULT. The published version of NEW CHALLENGER. Claims nothing is live.
//   testnet      Elysium testnet is playable now (the approved Elysium card, card-elysium/, says so publicly).
//                Testnet URL and the card's "no real money" line.
//   mainnet      UNPUBLISHED. Do not render for release or post until the Elysium mainnet deployment is
//                confirmed and counsel's real-money wording replaces the placeholder small print. Every frame of
//                this variant carries a burned-in UNPUBLISHED slate unless `slate: false` is passed explicitly.
export type CaptionId = 'coming-soon' | 'testnet' | 'mainnet';

export interface Caption {
  line: string;
  url: string;
  small: string | null;
  published: boolean;
  note: string;
  /** type size relative to the film's caption size, set per variant by design (never auto-fitted) */
  scale?: number;
}

export const CAPTIONS: Record<CaptionId, Caption> = {
  'coming-soon': {
    line: 'COMING SOON',
    url: 'yochigg.xyz',
    small: null,
    published: true,
    note: 'Safe default: makes no claim about Elysium deployment.',
  },
  testnet: {
    line: 'LIVE ON TESTNET',
    url: 'testnet.yochigg.xyz',
    small: 'ELYSIUM TESTNET · NO REAL MONEY',
    published: true,
    note: 'Matches the approved Elysium testnet card (card-elysium/).',
  },
  mainnet: {
    line: 'NOW LIVE ON ELYSIUM',
    url: 'yochigg.xyz',
    small: '18+ · REAL-MONEY GAMEPLAY · PLAY RESPONSIBLY',
    published: false,
    // 19 characters: at the house size it would leave title-safe. Cap ~41 px; re-set with counsel's final copy
    scale: 0.84,
    note: 'UNPUBLISHED until Elysium mainnet deployment is confirmed. Small print is a placeholder for counsel.',
  },
};

export const UNPUBLISHED_SLATE = 'UNPUBLISHED VARIANT · MAINNET NOT CONFIRMED · DO NOT POST';
