import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, mottle, spots } from '../lib/texture.mjs';

// Long and torpedo-shaped, with a duck-bill snout full of teeth and the dorsal fin far back.
const body = fishBody({
  bodyW: 3, bodyH: 4, bodyL: 12, headW: 3, headH: 3, headL: 6, jaw: true, teeth: true, tailW: 2, tailH: 3, tailL: 4,
  caudalH: 6, caudalL: 3, dorsalH: 3, dorsalL: 3, dorsalAt: 0.72, anal: 2, pectoral: 2, lift: 1, eye: { back: 3 },
});
const { at } = body;

export default {
  id: 'pike',
  name: 'Pike',
  group: 'freshwater',
  role: 'predator',
  family: ['fish', 'big_fish'],
  size: [0.6, 0.4],
  health: 10,
  speed: 0.12,
  movement: 'swim',
  swimSpeed: 0.15,
  babies: false,
  xp: 3,
  attack: { damage: 2, speed: 1.6 },
  hunts: ['small_fish'],
  huntInterval: 60,
  spawn: [{ biomes: ['river', 'lakes', 'swamp'], weight: 4, group: [1, 1], water: true, height: [45, 64] }],
  loot: [{ item: 'aquatic:pike', min: 1, max: 1, smelts: true }, { item: 'bone_meal', min: 0, max: 1, chance: 0.1 }],
  sounds: FISH_SOUNDS,
  egg: ['#4f6b30', '#d9d27a'],
  model: { bones: body.bones },
  materials: {
    // Green with rows of pale bean-shaped spots.
    scales: {
      base: '#6f8a3c',
      layers: [
        ...countershade({ back: '#344a22', belly: '#e6e4c9', at }),
        spots('#c9c46a', { size: 1.8, radius: 0.24, seed: 5, where: ({ p }) => p[1] > at.bottom + 1 }),
        mottle(0.08, { scale: 2 }),
        fur(0.04),
      ],
    },
    head: { base: '#5d7634', layers: [...countershade({ back: '#344a22', belly: '#e6e4c9', at }), mottle(0.08, { scale: 1.5 })] },
    teeth: '#e6e4c9',
    fin: '#7a6a3a',
  },
  anims: fish({ jaw: 'jaw', swimLength: 0.5 }),
};
