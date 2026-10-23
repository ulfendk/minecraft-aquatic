import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, gradient } from '../lib/texture.mjs';

// The silver darling: small, blue-backed and silver, in big shoals.
const body = fishBody({
  bodyW: 2, bodyH: 3, bodyL: 6, headW: 2, headH: 3, headL: 2, tailW: 1, tailH: 2, tailL: 2,
  caudalH: 4, caudalL: 2, dorsalH: 2, dorsalL: 2, dorsalAt: 0.35, pectoral: 1, lift: 1,
});
const { at } = body;

export default {
  id: 'herring',
  name: 'Herring',
  group: 'sea',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.3, 0.25],
  health: 3,
  speed: 0.1,
  movement: 'swim',
  swimSpeed: 0.14,
  school: true,
  bucket: true,
  babies: false,
  xp: 1,
  spawn: [{ biomes: ['ocean', 'cold_ocean', 'deep_ocean'], weight: 15, group: [5, 9], water: true, height: [35, 62] }],
  loot: [{ item: 'aquatic:herring', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#2e5a7a', '#c8d4dc'],
  model: { bones: body.bones },
  materials: {
    scales: { base: '#c8d4dc', layers: [...countershade({ back: '#2e5a7a', belly: '#f2f5f7', at, lift: 1 }), fur(0.05)] },
    head: { base: '#b8c6d0', layers: [gradient('#2e5a7a', { axis: 1, from: at.cy, to: at.top })] },
    fin: '#9fb0bc',
  },
  anims: fish({ swimLength: 0.35 }),
};
