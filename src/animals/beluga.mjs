import { cetacean } from '../lib/anim.mjs';
import { cetaceanBody } from '../lib/bodies.mjs';
import { WHALE_SOUNDS } from '../lib/skins.mjs';
import { mottle, underside } from '../lib/texture.mjs';

// The white whale of the Arctic, with a round bulging forehead (the melon) and no dorsal fin.
// So chatty it's called the canary of the sea; it likes swimming alongside people.
const body = cetaceanBody({
  bodyW: 8, bodyH: 8, bodyL: 18, headW: 7, headH: 6, headL: 5, beak: 2, beakW: 4, beakH: 2, tailW: 4, tailH: 4, tailL: 8,
  flukeW: 12, flukeL: 3, flipper: 5, flipperW: 3, dorsalH: 1, dorsalL: 6, dorsalAt: 0.4,
});
const { at } = body;
body.bones.find((b) => b.name === 'head').cubes.push({ origin: [-3, at.hy + 6, at.hz + 1], size: [6, 2, 4], mat: 'head' });

export default {
  id: 'beluga',
  name: 'Beluga',
  group: 'whale',
  role: 'neutral',
  family: ['whale'],
  size: [1.1, 0.8],
  scale: 1.4,
  health: 40,
  speed: 0.12,
  movement: 'cetacean',
  swimSpeed: 0.18,
  breath: 600,
  followsSwimmers: true,
  xp: 6,
  hunts: ['small_fish', 'cod', 'salmon'],
  huntInterval: 120,
  attack: { damage: 3, speed: 1.3 },
  rideFin: { seat: [0, 0.75, 0] },
  spawn: [{ biomes: ['frozen_ocean', 'cold_ocean'], weight: 3, group: [2, 5], water: true, height: [40, 62] }],
  loot: [],
  sounds: { ...WHALE_SOUNDS, pitch: [1.1, 1.4], interval: 10 },
  egg: ['#eef0ee', '#c8ccc8'],
  model: { bones: body.bones },
  materials: {
    skin: { base: '#eceeea', layers: [mottle(0.04, { scale: 3 }), underside('#f6f6f2', { y: at.bottom + 1, soft: 2 })] },
    head: { base: '#f0f2ee', layers: [mottle(0.04, { scale: 3 })] },
    fin: '#dcdeda',
  },
  anims: cetacean({ amp: 18 }),
};
