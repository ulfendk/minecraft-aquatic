import { fish } from '../lib/anim.mjs';
import { sharkBody } from '../lib/bodies.mjs';
import { BIG_FISH_SOUNDS } from '../lib/skins.mjs';
import { fur, gradient, underside } from '../lib/texture.mjs';

// The great white: slate grey above, snow white below, rows of serrated teeth. It hunts seals
// and penguins, and goes for a hurt swimmer too, so get out of the water when you're bleeding.
const body = sharkBody({ bodyW: 8, bodyH: 8, bodyL: 24, headW: 7, headH: 7, headL: 7, snout: 3, tailW: 4, tailH: 4, tailL: 10, upper: 12, lower: 9, dorsalH: 8, dorsalL: 5, pectoral: 9, lift: 1, jawOpen: 12 });
const { at } = body;
const skin = (base) => ({ base, layers: [gradient('#4e5860', { axis: 1, from: at.cy, to: at.top }), underside('#f2f2ee', { y: at.cy - 0.5, soft: 0.6 }), fur(0.03)] });

export default {
  id: 'great_white',
  name: 'Great White Shark',
  group: 'shark',
  role: 'predator',
  family: ['fish', 'shark', 'giant_fish'],
  size: [1.4, 1.0],
  scale: 1.6,
  health: 60,
  speed: 0.14,
  movement: 'swim',
  swimSpeed: 0.2,
  babies: false,
  xp: 15,
  knockbackResistance: 0.6,
  attack: { damage: 8, speed: 1.6 },
  hunts: ['seal', 'penguin', 'big_fish', 'cod', 'salmon'],
  huntInterval: 80,
  huntRange: 20,
  hostile: { range: 14, filters: [{ test: 'in_water', subject: 'other', value: true }, { test: 'actor_health', subject: 'other', operator: '<', value: 14 }] },
  roam: 32,
  spawn: [{ biomes: ['cold_ocean', 'ocean', 'lukewarm_ocean'], weight: 1, group: [1, 1], water: true, height: [30, 58] }],
  loot: [{ item: 'aquatic:raw_fish_steak', min: 2, max: 4 }, { item: 'aquatic:shark_tooth', min: 1, max: 3 }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#5e6870', '#f2f2ee'],
  model: { bones: body.bones },
  materials: { skin: skin('#7a848c'), head: skin('#7a848c'), teeth: '#fbfaf2', fin: '#4e5860' },
  anims: fish({ jaw: 'jaw', swimLength: 1.0, amp: 15 }),
};
