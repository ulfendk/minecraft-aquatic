import { fish } from '../lib/anim.mjs';
import { sharkBody } from '../lib/bodies.mjs';
import { BIG_FISH_SOUNDS } from '../lib/skins.mjs';
import { gradient, spots, stripes, underside } from '../lib/texture.mjs';

// The biggest fish of all, a gentle giant covered in white spots that sieves plankton
// through its huge mouth. You can swim right next to it.
const body = sharkBody({ bodyW: 10, bodyH: 9, bodyL: 28, headW: 10, headH: 8, headL: 6, snout: 0, tailW: 4, tailH: 5, tailL: 12, upper: 12, lower: 6, dorsalH: 6, dorsalL: 6, pectoral: 10, lift: 1 });
const { at } = body;
const skin = (base) => ({
  base,
  layers: [
    gradient('#2a3a4a', { axis: 1, from: at.cy, to: at.top }),
    stripes('#c8d0d8', { axis: 2, period: 4, width: 0.12, warp: 0.5, warpScale: 4, where: ({ p }) => p[1] > at.cy }),
    spots('#e8ecf0', { size: 1.8, radius: 0.22, seed: 23, where: ({ p }) => p[1] > at.cy - 1 }),
    underside('#e8eaec', { y: at.bottom + 2, soft: 1 }),
  ],
});

export default {
  id: 'whale_shark',
  name: 'Whale Shark',
  group: 'shark',
  role: 'neutral',
  family: ['fish', 'shark', 'giant_fish'],
  size: [1.6, 1.1],
  scale: 2.4,
  maxWidth: 4,
  health: 80,
  speed: 0.08,
  movement: 'swim',
  swimSpeed: 0.1,
  babies: false,
  xp: 20,
  knockbackResistance: 1,
  roam: 32,
  // A thick-skinned giant: only the heaviest speargun bolts reach its heart.
  hunt: { minEnergy: 5000, minShotEnergy: 200 },
  spawn: [{ biomes: ['warm_ocean'], weight: 1, group: [1, 1], water: true, height: [30, 56] }],
  loot: [{ item: 'aquatic:raw_fish_steak', min: 4, max: 8 }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#3a4a5a', '#e8ecf0'],
  model: { bones: body.bones },
  materials: { skin: skin('#4a5a6a'), head: skin('#4a5a6a'), teeth: '#2a2a2a', fin: '#33424f' },
  anims: fish({ jaw: 'jaw', swimLength: 1.8, amp: 12 }),
};
