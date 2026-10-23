import { cetacean } from '../lib/anim.mjs';
import { cetaceanBody } from '../lib/bodies.mjs';
import { SONG_SOUNDS } from '../lib/skins.mjs';
import { mottle, region, spots, stripes } from '../lib/texture.mjs';

// Famous for its song and its spectacular leaps clear of the water. The flippers are a third
// of its body length; the head is covered in knobs. Hold on to its fin for a ride.
const body = cetaceanBody({
  bodyW: 14, bodyH: 12, bodyL: 34, headW: 12, headH: 9, headL: 12, jaw: true, tailW: 8, tailH: 6, tailL: 16,
  flukeW: 26, flukeL: 6, flipper: 22, flipperW: 4, flipperAngle: 35, dorsalH: 2, dorsalL: 5, dorsalAt: 0.7,
});
const { at } = body;
const throat = ({ face: f }) => f === 'bottom';

export default {
  id: 'humpback',
  name: 'Humpback Whale',
  group: 'whale',
  role: 'neutral',
  family: ['whale', 'great_whale'],
  size: [2.2, 1.6],
  scale: 2.2,
  maxWidth: 4.5,
  maxHeight: 3,
  health: 150,
  speed: 0.1,
  movement: 'cetacean',
  swimSpeed: 0.14,
  breath: 900,
  breaches: 30,
  babies: true,
  persistent: false,
  xp: 0,
  knockbackResistance: 1,
  rideFin: { seat: [0, 1.0, 0.45] },
  roam: 40,
  spawn: [{ biomes: ['ocean', 'deep_ocean', 'cold_ocean'], weight: 1, group: [1, 2], water: true, height: [30, 58] }],
  loot: [],
  sounds: SONG_SOUNDS,
  egg: ['#22262c', '#e8eaea'],
  model: { bones: body.bones },
  materials: {
    skin: { base: '#2a2e34', layers: [mottle(0.08, { scale: 4 }), region('#d8dad6', ({ face: f, p }) => f === 'bottom' && p[2] < at.zf + 12)] },
    head: { base: '#2a2e34', layers: [spots('#4a4e54', { size: 2, radius: 0.22, seed: 51, where: ({ face: f }) => f === 'top' })] },
    mouth: { base: '#2a2e34', layers: [stripes('#d8dad6', { axis: 0, period: 2, width: 0.4, warp: 0, where: throat })] },
    fin: { base: '#e8eaea', layers: [mottle(0.1, { scale: 2 }), region('#2a2e34', ({ face: f, cube }) => f === 'top' && cube.bone === 'fluke')] },
  },
  anims: cetacean({ jaw: 'jaw', amp: 14, slow: 1.8, flipperAngle: 35 }),
};
