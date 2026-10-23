import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, mottle, stripes } from '../lib/texture.mjs';

// A pikeperch: slim and grey-green with faint saddle bars and big glassy eyes for hunting in the dark.
const body = fishBody({
  bodyW: 3, bodyH: 4, bodyL: 10, headW: 3, headH: 3, headL: 4, jaw: true, teeth: true, tailW: 2, tailH: 3, tailL: 4,
  caudalH: 6, caudalL: 2, dorsalH: 3, dorsalL: 4, dorsal2: 3, dorsalAt: 0.2, anal: 2, pectoral: 2, lift: 1,
  eye: { color: '#d8dcc0' },
});
const { at } = body;

export default {
  id: 'zander',
  name: 'Zander',
  group: 'freshwater',
  role: 'predator',
  family: ['fish', 'big_fish'],
  size: [0.55, 0.35],
  health: 8,
  speed: 0.12,
  movement: 'swim',
  swimSpeed: 0.14,
  babies: false,
  xp: 3,
  attack: { damage: 2, speed: 1.5 },
  hunts: ['small_fish'],
  huntInterval: 60,
  spawn: [{ biomes: ['river', 'lakes'], weight: 4, group: [1, 3], water: true, height: [40, 62] }],
  loot: [{ item: 'aquatic:zander', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#5a6b5a', '#c9cfc0'],
  model: { bones: body.bones },
  materials: {
    scales: {
      base: '#9aa696',
      layers: [
        ...countershade({ back: '#4a5a4a', belly: '#eceee6', at }),
        stripes('#5e6a58', { axis: 2, period: 3, width: 0.3, warp: 1, warpScale: 3, where: ({ p }) => p[1] > at.cy }),
        mottle(0.07, { scale: 2 }),
        fur(0.04),
      ],
    },
    head: { base: '#8a9686', layers: [...countershade({ back: '#4a5a4a', belly: '#eceee6', at })] },
    teeth: '#eceee6',
    fin: '#6f7868',
  },
  anims: fish({ jaw: 'jaw', swimLength: 0.5 }),
};
