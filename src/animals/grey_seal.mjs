import { pinniped } from '../lib/anim.mjs';
import { pinnipedBody } from '../lib/bodies.mjs';
import { fur, patches, underside } from '../lib/texture.mjs';

// Bigger than the harbour seal, with a long "Roman nose" and blotchy grey coat. Grey seals
// gather on rocky shores and sing a haunting moan.
const body = pinnipedBody({ bodyW: 10, bodyH: 8, bodyL: 20, neckW: 7, neckH: 7, neckL: 3, headW: 6, headH: 5, headL: 5, snoutW: 4, snoutH: 3, snoutL: 3, front: 5, hind: 6 });
const coat = (base) => ({ base, layers: [patches('#4e504e', { size: 3, line: 0.4, vary: 0.2, seed: 7 }), underside('#b8b8b0', { y: 2, soft: 1.5 }), fur(0.05)] });

export default {
  id: 'grey_seal',
  name: 'Grey Seal',
  group: 'seal',
  role: 'neutral',
  family: ['seal'],
  size: [1.1, 0.6],
  health: 22,
  speed: 0.11,
  movement: 'pinniped',
  swimSpeed: 0.2,
  breath: 600,
  sleeps: 'night',
  xp: 4,
  attack: { damage: 3, speed: 1.3 },
  hunts: ['small_fish', 'big_fish', 'cod'],
  huntInterval: 90,
  breed: ['aquatic:herring', 'cod'],
  tempt: ['aquatic:herring', 'cod'],
  tame: { items: ['aquatic:herring', 'cod'], chance: 0.25, damage: 4 },
  spawn: [{ biomes: ['stony_shore', 'beach', 'cold_ocean'], weight: 5, group: [2, 4], blocks: ['sand', 'gravel', 'stone'] }],
  loot: [],
  sounds: { ambient: 'mob.polarbear.idle', hurt: 'mob.polarbear.hurt', death: 'mob.polarbear.death', pitch: [1.2, 1.4], interval: 16 },
  egg: ['#6e706c', '#b8b8b0'],
  model: { bones: body.bones },
  materials: {
    fur: coat('#868884'),
    head: coat('#7e807c'),
    snout: { base: '#5e605c', layers: [fur(0.05)] },
    flipper: '#4a4c48',
  },
  anims: pinniped(),
};
