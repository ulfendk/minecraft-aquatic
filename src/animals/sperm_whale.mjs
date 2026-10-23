import { cetacean } from '../lib/anim.mjs';
import { cetaceanBody } from '../lib/bodies.mjs';
import { WHALE_SOUNDS } from '../lib/skins.mjs';
import { mottle, stripes } from '../lib/texture.mjs';

// A giant box-shaped head on a wrinkled body. It dives deeper than any other whale to hunt
// squid in the dark, holding its breath for over an hour.
const body = cetaceanBody({
  bodyW: 14, bodyH: 13, bodyL: 30, headW: 13, headH: 13, headL: 20, jaw: true, tailW: 8, tailH: 7, tailL: 14,
  flukeW: 22, flukeL: 5, flipper: 6, flipperW: 3, dorsalH: 2, dorsalL: 4, dorsalAt: 0.65, eye: { back: 4, down: 8 },
});
const { at } = body;
const wrinkled = (base) => ({ base, layers: [stripes('#3a3a3c', { axis: 2, period: 1.6, width: 0.25, warp: 1.5, warpScale: 2 }), mottle(0.1, { scale: 3 })] });

export default {
  id: 'sperm_whale',
  name: 'Sperm Whale',
  group: 'whale',
  role: 'predator',
  family: ['whale', 'great_whale'],
  size: [2.0, 1.6],
  scale: 2.3,
  maxWidth: 4.5,
  maxHeight: 3,
  health: 160,
  speed: 0.1,
  movement: 'cetacean',
  swimSpeed: 0.14,
  breath: 1800,
  xp: 0,
  knockbackResistance: 1,
  attack: { damage: 10, speed: 1.2 },
  hunts: ['squid', 'glow_squid'],
  huntInterval: 60,
  huntRange: 32,
  rideFin: { seat: [0, 1.25, 0.2] },
  roam: 40,
  spawn: [{ biomes: ['deep_ocean'], weight: 1, group: [1, 2], water: true, height: [20, 55] }],
  loot: [],
  sounds: { ...WHALE_SOUNDS, pitch: [0.35, 0.45] },
  egg: ['#4a4a4c', '#8a8a8c'],
  model: { bones: body.bones },
  materials: { skin: wrinkled('#4a4a4c'), head: wrinkled('#505052'), mouth: '#d8d4cc', fin: '#3e3e40' },
  anims: cetacean({ jaw: 'jaw', amp: 14, slow: 1.8 }),
};
