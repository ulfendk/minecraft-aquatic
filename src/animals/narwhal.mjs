import { cetacean } from '../lib/anim.mjs';
import { cetaceanBody } from '../lib/bodies.mjs';
import { WHALE_SOUNDS } from '../lib/skins.mjs';
import { gradient, spots, underside } from '../lib/texture.mjs';

// The unicorn of the sea: its "horn" is a spiralling tooth up to three metres long. Lives among
// the Arctic sea ice.
const body = cetaceanBody({
  bodyW: 8, bodyH: 7, bodyL: 18, headW: 6, headH: 6, headL: 5, tailW: 4, tailH: 4, tailL: 8,
  flukeW: 12, flukeL: 3, flipper: 4, flipperW: 2, dorsalH: 1, dorsalL: 6, dorsalAt: 0.45, tusk: 18,
});
const { at } = body;
const skin = (base) => ({ base, layers: [spots('#3a4248', { size: 1.4, radius: 0.32, seed: 41 }), gradient('#5a6268', { axis: 1, from: at.cy, to: at.top }), underside('#e8e8e2', { y: at.bottom + 2, soft: 1.5 })] });

export default {
  id: 'narwhal',
  name: 'Narwhal',
  group: 'whale',
  role: 'neutral',
  family: ['whale'],
  size: [1.1, 0.75],
  scale: 1.4,
  health: 40,
  speed: 0.12,
  movement: 'cetacean',
  swimSpeed: 0.18,
  breath: 900,
  xp: 6,
  attack: { damage: 5, speed: 1.4 },
  hunts: ['small_fish', 'cod'],
  huntInterval: 120,
  spawn: [{ biomes: ['frozen_ocean'], weight: 3, group: [2, 4], water: true, height: [35, 62] }],
  loot: [],
  sounds: { ...WHALE_SOUNDS, pitch: [0.9, 1.1] },
  egg: ['#9aa0a4', '#f0ead8'],
  model: { bones: body.bones },
  materials: {
    skin: skin('#a8aeb2'),
    head: skin('#9ea4a8'),
    fin: '#5a6268',
    tusk: { base: '#f0ead8', layers: [spots('#c8bfa8', { size: 1.2, radius: 0.3, seed: 2 })] },
  },
  anims: cetacean({ amp: 18 }),
};
