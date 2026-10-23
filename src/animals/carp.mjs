import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, mottle, worleyScales } from '../lib/texture.mjs';

// Deep-bodied and bronze, with big scales, a long dorsal fin and whiskers on the lip.
const body = fishBody({
  bodyW: 4, bodyH: 6, bodyL: 9, headW: 3, headH: 4, headL: 3, tailW: 2, tailH: 4, tailL: 3,
  caudalH: 7, caudalL: 3, dorsalH: 2, dorsalL: 6, dorsalAt: 0.3, anal: 2, pectoral: 2, lift: 1,
});
const { at } = body;
body.bones.find((b) => b.name === 'head').cubes.push(
  { origin: [-1.5, at.bottom + 1, at.zf - 4], size: [0, 1, 2], mat: 'fin' },
  { origin: [1.5, at.bottom + 1, at.zf - 4], size: [0, 1, 2], mat: 'fin' },
);

export default {
  id: 'carp',
  name: 'Carp',
  group: 'freshwater',
  role: 'neutral',
  family: ['fish', 'big_fish'],
  size: [0.55, 0.5],
  health: 10,
  speed: 0.1,
  movement: 'swim',
  swimSpeed: 0.11,
  babies: false,
  bottom: true,
  xp: 2,
  spawn: [{ biomes: ['lakes', 'swamp', 'river'], weight: 6, group: [1, 3], water: true, height: [45, 64] }],
  loot: [{ item: 'aquatic:carp', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#8a6a2a', '#e2c98a'],
  model: { bones: body.bones },
  materials: {
    scales: {
      base: '#a07a32',
      layers: [
        ...countershade({ back: '#5a4a22', belly: '#e2c98a', at }),
        worleyScales('#6a5020', { size: 1.8, line: 0.1 }),
        mottle(0.06, { scale: 2 }),
        fur(0.04),
      ],
    },
    head: { base: '#9a7432', layers: [...countershade({ back: '#5a4a22', belly: '#e2c98a', at })] },
    fin: '#7a5a2a',
  },
  anims: fish({ swimLength: 0.7, amp: 20 }),
};
