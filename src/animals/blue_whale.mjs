import { cetacean } from '../lib/anim.mjs';
import { cetaceanBody } from '../lib/bodies.mjs';
import { SONG_SOUNDS } from '../lib/skins.mjs';
import { mottle, spots, stripes, underside } from '../lib/texture.mjs';

// The largest animal that has ever lived: longer than three buses, mottled blue-grey, with a
// tiny dorsal fin far back. It lives on krill and is as gentle as it is enormous.
const body = cetaceanBody({
  bodyW: 14, bodyH: 12, bodyL: 48, headW: 13, headH: 9, headL: 16, jaw: true, tailW: 8, tailH: 6, tailL: 20,
  flukeW: 28, flukeL: 6, flipper: 10, flipperW: 3, dorsalH: 2, dorsalL: 3, dorsalAt: 0.85,
});
const { at } = body;
const skin = (base) => ({ base, layers: [spots('#8aa0b4', { size: 2.2, radius: 0.25, seed: 61 }), mottle(0.1, { scale: 4 }), underside('#9aa8a8', { y: at.bottom + 2, soft: 2 })] });

export default {
  id: 'blue_whale',
  name: 'Blue Whale',
  group: 'whale',
  role: 'neutral',
  family: ['whale', 'great_whale'],
  size: [2.0, 1.4],
  scale: 2.6,
  maxWidth: 5,
  maxHeight: 3.5,
  health: 200,
  speed: 0.1,
  movement: 'cetacean',
  swimSpeed: 0.14,
  breath: 900,
  xp: 0,
  knockbackResistance: 1,
  rideFin: { seat: [0, 0.95, 1.6] },
  roam: 48,
  spawn: [{ biomes: ['deep_ocean'], weight: 1, group: [1, 1], water: true, height: [30, 56] }],
  loot: [],
  sounds: { ...SONG_SOUNDS, pitch: [0.35, 0.45] },
  egg: ['#5a7088', '#9aa8a8'],
  model: { bones: body.bones },
  materials: {
    skin: skin('#5a7088'),
    head: skin('#566c84'),
    mouth: { base: '#7a8a94', layers: [stripes('#c8ccc8', { axis: 0, period: 2, width: 0.4, warp: 0 })] },
    fin: '#4a6078',
  },
  anims: cetacean({ jaw: 'jaw', amp: 12, slow: 2.2 }),
};
