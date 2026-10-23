import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { countershade, FISH_SOUNDS } from '../lib/skins.mjs';
import { fur } from '../lib/texture.mjs';

// Needle-thin with a long beak of a jaw; its bones are green. Comes inshore in May.
const body = fishBody({
  bodyW: 2, bodyH: 2, bodyL: 12, headW: 2, headH: 2, headL: 2, tailW: 1, tailH: 2, tailL: 3,
  caudalH: 4, caudalL: 2, dorsalH: 2, dorsalL: 2, dorsalAt: 0.8, anal: 2, pectoral: 1, lift: 1,
});
const { at } = body;
body.bones.find((b) => b.name === 'head').cubes.push(
  { origin: [-0.5, at.bottom + 0.5, at.zf - 9], size: [1, 1, 7], mat: 'beak' },
);

export default {
  id: 'garfish',
  name: 'Garfish',
  group: 'sea',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.45, 0.2],
  health: 4,
  speed: 0.12,
  movement: 'swim',
  swimSpeed: 0.17,
  school: true,
  bucket: true,
  babies: false,
  xp: 2,
  spawn: [{ biomes: ['ocean', 'lukewarm_ocean'], weight: 6, group: [3, 6], water: true, height: [50, 63] }],
  loot: [{ item: 'aquatic:garfish', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#2a6e5a', '#d4e0dc'],
  model: { bones: body.bones },
  materials: {
    scales: { base: '#c8d8d4', layers: [...countershade({ back: '#1e5a50', belly: '#f2f6f4', at, lift: 0.6, soft: 0.8 }), fur(0.04)] },
    head: { base: '#2a6e5a' },
    beak: '#2f6a4a',
    fin: '#5a7a70',
  },
  anims: fish({ swimLength: 0.4 }),
};
