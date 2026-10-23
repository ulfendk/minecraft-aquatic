import { fish } from '../lib/anim.mjs';
import { sharkBody } from '../lib/bodies.mjs';
import { BIG_FISH_SOUNDS, countershade } from '../lib/skins.mjs';
import { fur } from '../lib/texture.mjs';

// The hammer-shaped head spreads its eyes and senses wide apart; great for finding fish
// hidden in the sand.
const body = sharkBody({ bodyW: 6, bodyH: 6, bodyL: 20, headW: 5, headH: 5, headL: 5, snout: 0, tailL: 9, upper: 10, lower: 4, dorsalH: 7, dorsalL: 4, pectoral: 6, lift: 1 });
const { at } = body;
const head = body.bones.find((b) => b.name === 'head');
head.cubes[0].marks = [];
head.cubes.push({
  origin: [-9, at.hy + 3, at.zf - at.headL - 3], size: [18, 2, 3], mat: 'head',
  marks: [{ face: 'right', x: 1, y: 0, color: '#111111' }, { face: 'left', x: 1, y: 0, color: '#111111' }],
});

export default {
  id: 'hammerhead',
  name: 'Hammerhead Shark',
  group: 'shark',
  role: 'predator',
  family: ['fish', 'shark', 'giant_fish'],
  size: [1.2, 0.7],
  scale: 1.3,
  health: 40,
  speed: 0.12,
  movement: 'swim',
  swimSpeed: 0.18,
  babies: false,
  xp: 10,
  attack: { damage: 6, speed: 1.5 },
  hunts: ['small_fish', 'big_fish', 'cod', 'salmon'],
  huntInterval: 60,
  roam: 24,
  spawn: [{ biomes: ['warm_ocean', 'lukewarm_ocean'], weight: 2, group: [1, 3], water: true, height: [30, 58] }],
  loot: [{ item: 'aquatic:raw_fish_steak', min: 1, max: 3 }, { item: 'aquatic:shark_tooth', min: 0, max: 2 }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#7a7f78', '#e8e8e0'],
  model: { bones: body.bones },
  materials: {
    skin: { base: '#8a8f86', layers: [...countershade({ back: '#6a6f68', belly: '#ecece4', at, lift: 2, soft: 1 }), fur(0.03)] },
    head: { base: '#8a8f86', layers: [...countershade({ back: '#6a6f68', belly: '#ecece4', at, lift: 2, soft: 1 })] },
    teeth: '#f4f2ea',
    fin: '#6a6f68',
  },
  anims: fish({ jaw: 'jaw', swimLength: 0.9, amp: 16 }),
};
