import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, mottle, spots } from '../lib/texture.mjs';

// Golden-brown with black spots and a scatter of red ones.
const body = fishBody({
  bodyW: 3, bodyH: 4, bodyL: 9, headW: 3, headH: 4, headL: 3, tailW: 2, tailH: 3, tailL: 3,
  caudalH: 5, caudalL: 2, dorsalH: 3, dorsalL: 3, dorsal2: 1, anal: 1, pectoral: 2, lift: 1,
});
const { at } = body;

export default {
  id: 'brown_trout',
  name: 'Brown Trout',
  group: 'freshwater',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.5, 0.35],
  health: 6,
  speed: 0.12,
  movement: 'swim',
  swimSpeed: 0.15,
  bucket: true,
  babies: false,
  xp: 2,
  spawn: [{ biomes: ['river', 'lakes'], weight: 8, group: [1, 3], water: true, height: [45, 70] }],
  loot: [{ item: 'aquatic:brown_trout', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#8a6a35', '#c03a2a'],
  model: { bones: body.bones },
  materials: {
    scales: {
      base: '#b8964a',
      layers: [
        ...countershade({ back: '#5b4a2a', belly: '#f0e2b8', at }),
        spots('#2a1f14', { size: 1.4, radius: 0.2, seed: 3, where: ({ p }) => p[1] > at.bottom + 1.5 }),
        spots('#c03a2a', { size: 2.2, radius: 0.16, seed: 9, where: ({ p }) => p[1] > at.bottom + 1 && p[1] < at.top - 1 }),
        mottle(0.05, { scale: 2 }),
        fur(0.04),
      ],
    },
    head: { base: '#a8863e', layers: [...countershade({ back: '#5b4a2a', belly: '#f0e2b8', at }), spots('#2a1f14', { size: 1.4, radius: 0.18, seed: 4 })] },
    fin: '#8a7046',
  },
  anims: fish({ swimLength: 0.45 }),
};
