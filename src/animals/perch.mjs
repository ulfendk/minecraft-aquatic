import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, mottle, stripes } from '../lib/texture.mjs';

const body = fishBody({
  bodyW: 3, bodyH: 5, bodyL: 7, headW: 3, headH: 4, headL: 3, tailW: 2, tailH: 3, tailL: 3,
  caudalH: 5, caudalL: 2, dorsalH: 3, dorsalL: 3, dorsal2: 2, anal: 1, pectoral: 2, lift: 1,
});
const { at } = body;

export default {
  id: 'perch',
  name: 'Perch',
  group: 'freshwater',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.45, 0.4],
  health: 4,
  speed: 0.1,
  movement: 'swim',
  swimSpeed: 0.12,
  school: true,
  bucket: true,
  babies: false,
  xp: 1,
  spawn: [{ biomes: ['river', 'lakes'], weight: 10, group: [3, 6], water: true, height: [45, 64] }],
  loot: [{ item: 'aquatic:perch', min: 1, max: 1, smelts: true }, { item: 'bone_meal', min: 0, max: 1, chance: 0.05 }],
  sounds: FISH_SOUNDS,
  egg: ['#6f8a3c', '#2f3a17'],
  model: { bones: body.bones },
  materials: {
    // Olive-gold with dark vertical bars and orange-red lower fins.
    scales: {
      base: '#a5a84a',
      layers: [
        ...countershade({ back: '#4f6b2a', belly: '#e8e3c8', at }),
        stripes('#2f3a17', { axis: 2, period: 2.4, width: 0.38, warp: 0.6, warpScale: 3, where: ({ p }) => p[1] > at.bottom + 1.5 }),
        mottle(0.06, { scale: 2 }),
        fur(0.04),
      ],
    },
    head: { base: '#8f9a42', layers: [...countershade({ back: '#4f6b2a', belly: '#e8e3c8', at })] },
    fin: '#cf5b2c',
  },
  anims: fish({ swimLength: 0.45 }),
};
