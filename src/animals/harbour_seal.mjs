import { pinniped } from '../lib/anim.mjs';
import { pinnipedBody } from '../lib/bodies.mjs';
import { fur, mottle, spots, underside } from '../lib/texture.mjs';

// The common seal of Danish waters: grey with dark spots, a round puppy face and big dark eyes.
// Win one over with herring and it follows you around, in the water and out.
const body = pinnipedBody({ bodyW: 8, bodyH: 7, bodyL: 16, neckW: 6, neckH: 6, neckL: 3, headW: 5, headH: 5, headL: 4, snoutW: 3, snoutH: 2, snoutL: 2, front: 4, hind: 5 });
const coat = (base) => ({ base, layers: [spots('#4a4a44', { size: 1.8, radius: 0.24, seed: 31 }), underside('#c4c0b4', { y: 2, soft: 1.5 }), mottle(0.06), fur(0.05)] });

export default {
  id: 'harbour_seal',
  name: 'Harbour Seal',
  group: 'seal',
  role: 'neutral',
  family: ['seal'],
  size: [0.9, 0.55],
  health: 16,
  speed: 0.12,
  movement: 'pinniped',
  swimSpeed: 0.2,
  breath: 600,
  sleeps: 'night',
  xp: 3,
  attack: { damage: 2, speed: 1.3 },
  hunts: ['small_fish', 'cod'],
  huntInterval: 90,
  breed: ['aquatic:herring', 'cod'],
  tempt: ['aquatic:herring', 'cod'],
  tame: { items: ['aquatic:herring', 'cod'], chance: 0.3, damage: 3 },
  spawn: [{ biomes: ['beach', 'stony_shore'], weight: 6, group: [2, 4], blocks: ['sand', 'gravel', 'stone'] }],
  loot: [],
  sounds: { ambient: 'mob.polarbear_baby.idle', hurt: 'mob.polarbear.hurt', death: 'mob.polarbear.death', pitch: [1.3, 1.5], interval: 14 },
  egg: ['#8a8a82', '#4a4a44'],
  model: { bones: body.bones },
  materials: {
    fur: coat('#8a8a82'),
    head: coat('#8e8e86'),
    snout: { base: '#6e6e66', layers: [fur(0.05)] },
    flipper: '#5a5a54',
  },
  anims: pinniped(),
};
