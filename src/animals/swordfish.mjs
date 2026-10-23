import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { BIG_FISH_SOUNDS, countershade } from '../lib/skins.mjs';
import { fur } from '../lib/texture.mjs';

// One of the fastest fish in the sea, with a long flat sword it slashes through shoals with.
const body = fishBody({
  bodyW: 4, bodyH: 6, bodyL: 18, headW: 4, headH: 5, headL: 5, tailW: 2, tailH: 3, tailL: 8,
  caudal: 'lunate', caudalH: 12, caudalL: 3, dorsalH: 7, dorsalL: 3, dorsalAt: 0.05, anal: 2, pectoral: 5, lift: 2,
  eye: { back: 1, down: 1, w: 1, h: 1 },
});
const { at } = body;
body.bones.push({
  name: 'sword', parent: 'head', pivot: [0, at.cy, at.zf - 5],
  cubes: [{ origin: [-1, at.cy, at.zf - 19], size: [2, 1, 14], mat: 'sword' }],
});

export default {
  id: 'swordfish',
  name: 'Swordfish',
  group: 'sea',
  role: 'predator',
  family: ['fish', 'big_fish', 'giant_fish'],
  size: [1.0, 0.7],
  scale: 1.3,
  health: 30,
  speed: 0.14,
  movement: 'swim',
  swimSpeed: 0.24,
  babies: false,
  xp: 8,
  attack: { damage: 5, speed: 1.8 },
  hunts: ['small_fish'],
  huntInterval: 60,
  roam: 24,
  spawn: [{ biomes: ['deep_ocean', 'warm_ocean', 'lukewarm_ocean'], weight: 1, group: [1, 1], water: true, height: [30, 58] }],
  loot: [{ item: 'aquatic:swordfish', min: 1, max: 1, smelts: true }, { item: 'aquatic:raw_fish_steak', min: 2, max: 4 }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#2a2a4a', '#d0d0d8'],
  model: { bones: body.bones },
  materials: {
    scales: { base: '#7a7a8a', layers: [...countershade({ back: '#24243e', belly: '#d8d8e0', at, lift: 2, soft: 1.5 }), fur(0.04)] },
    head: { base: '#6a6a7a', layers: [...countershade({ back: '#24243e', belly: '#d0d0d8', at, lift: 2 })] },
    sword: '#3a3a4a',
    fin: '#2e2e44',
  },
  anims: fish({ swimLength: 0.5, amp: 18 }),
};
