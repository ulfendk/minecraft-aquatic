import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { FISH_SOUNDS } from '../lib/skins.mjs';
import { mottle, spots, underside } from '../lib/texture.mjs';

// A round, knobbly little fish that clings to rocks with a sucker on its belly. Males guarding
// eggs turn orange-red underneath.
const body = fishBody({
  bodyW: 4, bodyH: 5, bodyL: 6, headW: 4, headH: 4, headL: 2, tailW: 2, tailH: 3, tailL: 2,
  caudal: 'round', caudalH: 4, caudalL: 2, dorsalH: 2, dorsalL: 4, dorsalAt: 0.1, pectoral: 2, lift: 1,
});
const { at } = body;
body.bones.find((b) => b.name === 'dorsal_fin').cubes[0].mat = 'scales';

export default {
  id: 'lumpfish',
  name: 'Lumpfish',
  group: 'sea',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.35, 0.4],
  health: 5,
  speed: 0.06,
  movement: 'swim',
  swimSpeed: 0.08,
  bucket: true,
  babies: false,
  bottom: true,
  xp: 1,
  spawn: [{ biomes: ['cold_ocean', 'frozen_ocean', 'stony_shore'], weight: 5, group: [1, 2], water: true, height: [40, 62] }],
  loot: [{ item: 'aquatic:lumpfish', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#5a6f7a', '#e0662a'],
  model: { bones: body.bones },
  materials: {
    scales: {
      base: '#5a6f7a',
      layers: [
        spots('#7f949e', { size: 1.2, radius: 0.22, seed: 14 }),
        mottle(0.12, { scale: 1.5 }),
        underside('#e0662a', { y: at.bottom + 1.6, soft: 1 }),
      ],
    },
    head: { base: '#5a6f7a', layers: [spots('#7f949e', { size: 1.2, radius: 0.2, seed: 15 }), underside('#e0662a', { y: at.bottom + 1.4, soft: 1 })] },
    fin: '#4a5c66',
  },
  anims: fish({ swimLength: 0.6, amp: 18 }),
};
