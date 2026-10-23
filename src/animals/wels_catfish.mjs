import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { BIG_FISH_SOUNDS } from '../lib/skins.mjs';
import { mottle, underside } from '../lib/texture.mjs';

// Europe's biggest freshwater fish: a broad flat head with long whiskers and a long, eel-like tail.
const body = fishBody({
  bodyW: 6, bodyH: 6, bodyL: 16, headW: 6, headH: 5, headL: 6, jaw: true, tailW: 3, tailH: 5, tailL: 12,
  caudal: 'round', caudalH: 4, caudalL: 2, dorsalH: 2, dorsalL: 2, dorsalAt: 0.2, pectoral: 3, lift: 0,
  eye: { back: 4, down: 1 },
});
const { at } = body;
const head = body.bones.find((b) => b.name === 'head');
body.bones.push({
  name: 'barbels', parent: 'head', pivot: [0, at.bottom + 3, at.zf - 6],
  cubes: [
    { origin: [3, at.bottom + 3, at.zf - 6], size: [8, 0, 1], mat: 'barbel', rotation: [0, -30, -15], pivot: [3, at.bottom + 3, at.zf - 6] },
    { origin: [-11, at.bottom + 3, at.zf - 6], size: [8, 0, 1], mat: 'barbel', rotation: [0, 30, 15], pivot: [-3, at.bottom + 3, at.zf - 6] },
  ],
});
// The long anal fin under the tail.
body.bones.find((b) => b.name === 'tail').cubes.push({ origin: [-0.5, at.bottom - 1, at.zb], size: [1, 1, 11], mat: 'fin' });
head.cubes[0].mat = 'scales';

export default {
  id: 'wels_catfish',
  name: 'Wels Catfish',
  group: 'freshwater',
  role: 'predator',
  family: ['fish', 'big_fish', 'giant_fish'],
  size: [1.0, 0.5],
  health: 30,
  speed: 0.1,
  movement: 'swim',
  swimSpeed: 0.12,
  babies: false,
  bottom: true,
  xp: 6,
  attack: { damage: 4, speed: 1.3 },
  hunts: ['small_fish'],
  huntInterval: 80,
  spawn: [{ biomes: ['river', 'swamp', 'lakes'], weight: 1, group: [1, 1], water: true, height: [38, 60] }],
  loot: [{ item: 'aquatic:wels_catfish', min: 1, max: 1, smelts: true }, { item: 'aquatic:raw_fish_steak', min: 1, max: 3 }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#3a3a2a', '#c8c2a8'],
  model: { bones: body.bones },
  materials: {
    scales: { base: '#3e3e2c', layers: [mottle(0.22, { scale: 2.5, seed: 4 }), underside('#c8c2a8', { y: at.bottom + 1.2, soft: 1 })] },
    head: '#3e3e2c',
    barbel: '#2a2a1e',
    fin: '#34342a',
  },
  anims: fish({ jaw: 'jaw', swimLength: 1.0, amp: 18 }),
};
