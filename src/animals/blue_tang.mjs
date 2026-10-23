import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, region } from '../lib/texture.mjs';

// Royal blue with a black "painter's palette" marking and a bright yellow tail.
const body = fishBody({
  bodyW: 2, bodyH: 5, bodyL: 6, headW: 2, headH: 4, headL: 2, tailW: 1, tailH: 2, tailL: 2,
  caudalH: 4, caudalL: 2, dorsalH: 1, dorsalL: 5, dorsalAt: 0.05, anal: 1, pectoral: 2, lift: 1,
});
const { at } = body;
body.bones.find((b) => b.name === 'caudal_fin').cubes.forEach((c) => { c.mat = 'tail'; });
body.bones.find((b) => b.name === 'tail').cubes[0].mat = 'tail';
// The palette: a black band from behind the eye curving back along the upper body.
const palette = ({ p }) => {
  const z = p[2], y = p[1];
  const centre = at.top - 1.2 - Math.max(0, z) * 0.35;
  return z > at.zf + 0.5 && z < at.zb && Math.abs(y - centre) < 0.9;
};

export default {
  id: 'blue_tang',
  name: 'Blue Tang',
  group: 'tropical',
  role: 'prey',
  family: ['fish', 'small_fish', 'reef_fish'],
  size: [0.3, 0.35],
  health: 3,
  speed: 0.08,
  movement: 'swim',
  swimSpeed: 0.12,
  school: true,
  bucket: true,
  babies: false,
  xp: 1,
  spawn: [{ biomes: ['warm_ocean'], weight: 8, group: [3, 5], water: true, height: [45, 63] }],
  loot: [{ item: 'aquatic:blue_tang', min: 1, max: 1 }],
  sounds: FISH_SOUNDS,
  egg: ['#1f4fd0', '#f2d13b'],
  model: { bones: body.bones },
  materials: {
    scales: { base: '#1f4fd0', layers: [region('#101418', palette), fur(0.04)] },
    head: { base: '#1f4fd0' },
    tail: '#f2d13b',
    fin: { base: '#1a3c9c', layers: [region('#101418', ({ j }) => j === 0)] },
  },
  anims: fish({ swimLength: 0.35 }),
};
