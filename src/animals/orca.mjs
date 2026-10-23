import { cetacean } from '../lib/anim.mjs';
import { cetaceanBody } from '../lib/bodies.mjs';
import { WHALE_SOUNDS } from '../lib/skins.mjs';
import { region, underside } from '../lib/texture.mjs';

// The killer whale: black and white, with a tall dorsal fin. Pods hunt seals, penguins and big
// fish together. They leave people alone, and you can hold on to that fin and ride along.
const body = cetaceanBody({
  bodyW: 9, bodyH: 9, bodyL: 22, headW: 8, headH: 7, headL: 8, jaw: true, tailW: 5, tailH: 5, tailL: 10,
  flukeW: 14, flukeL: 4, flipper: 7, flipperW: 4, dorsalH: 10, dorsalL: 4, dorsalAt: 0.35,
});
const { at } = body;
const black = '#15181c', white = '#f4f4f0';
// The white eye patch above and behind the eye, the grey saddle behind the fin.
const eyePatch = ({ face: f, p }) => (f === 'left' || f === 'right') && p[2] > at.hz + 2 && p[2] < at.hz + 7 && p[1] > at.hy + 4 && p[1] < at.hy + 6;
const saddle = ({ face: f, p }) => (f === 'top' || p[1] > at.top - 2) && p[2] > at.zf + 10 && p[2] < at.zf + 15;

export default {
  id: 'orca',
  name: 'Orca',
  group: 'whale',
  role: 'predator',
  family: ['whale', 'orca'],
  size: [1.4, 1.0],
  scale: 1.8,
  maxWidth: 3,
  health: 60,
  speed: 0.14,
  movement: 'cetacean',
  swimSpeed: 0.24,
  breath: 600,
  breaches: 50,
  xp: 10,
  knockbackResistance: 0.8,
  attack: { damage: 8, speed: 1.6 },
  alertsPack: true,
  hunts: ['seal', 'penguin', 'big_fish', 'small_fish'],
  huntInterval: 120,
  huntRange: 24,
  rideFin: { seat: [0, 1.15, -0.2] },
  roam: 32,
  spawn: [{ biomes: ['cold_ocean', 'frozen_ocean', 'ocean'], weight: 2, group: [2, 4], water: true, height: [35, 60] }],
  loot: [],
  sounds: { ...WHALE_SOUNDS, pitch: [0.8, 1.0] },
  egg: [black, white],
  model: { bones: body.bones },
  materials: {
    skin: { base: black, layers: [underside(white, { y: at.bottom + 2.5, soft: 0.5 }), region('#8a8e92', saddle)] },
    head: { base: black, layers: [underside(white, { y: at.hy + 2, soft: 0.5 }), region(white, eyePatch)] },
    mouth: white,
    fin: { base: black, layers: [region(white, ({ face: f }) => f === 'bottom')] },
  },
  anims: cetacean({ jaw: 'jaw', amp: 18 }),
};
