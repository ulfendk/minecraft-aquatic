import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, gradient, stripes } from '../lib/texture.mjs';

// Streamlined and fast, with wavy black tiger stripes on a green-blue back.
const body = fishBody({
  bodyW: 2, bodyH: 3, bodyL: 8, headW: 2, headH: 3, headL: 3, tailW: 1, tailH: 2, tailL: 3,
  caudal: 'lunate', caudalH: 5, caudalL: 2, dorsalH: 2, dorsalL: 2, dorsal2: 1, dorsalAt: 0.2, anal: 1, pectoral: 1, lift: 1,
});
const { at } = body;

export default {
  id: 'mackerel',
  name: 'Mackerel',
  group: 'sea',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.4, 0.25],
  health: 4,
  speed: 0.12,
  movement: 'swim',
  swimSpeed: 0.17,
  school: true,
  bucket: true,
  babies: false,
  xp: 1,
  spawn: [{ biomes: ['ocean', 'lukewarm_ocean'], weight: 12, group: [5, 9], water: true, height: [40, 62] }],
  loot: [{ item: 'aquatic:mackerel', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#2a6a6a', '#10202a'],
  model: { bones: body.bones },
  materials: {
    scales: {
      base: '#d8e2e8',
      layers: [
        ...countershade({ back: '#2a6a6a', belly: '#f4f6f6', at, lift: 1 }),
        stripes('#10202a', { axis: 2, period: 1.8, width: 0.35, warp: 1.2, warpScale: 1.5, where: ({ p }) => p[1] > at.cy + 0.3 }),
        fur(0.04),
      ],
    },
    head: { base: '#c0ccd2', layers: [gradient('#2a5a5e', { axis: 1, from: at.cy, to: at.top })] },
    fin: '#4a5a60',
  },
  anims: fish({ swimLength: 0.3 }),
};
