import { cetacean } from '../lib/anim.mjs';
import { cetaceanBody } from '../lib/bodies.mjs';
import { countershade, WHALE_SOUNDS } from '../lib/skins.mjs';
import { fur } from '../lib/texture.mjs';

// Denmark's own small whale: shy, round-headed, with a little triangular fin. You mostly see its
// back roll over the surface as it breathes.
const body = cetaceanBody({ bodyW: 5, bodyH: 5, bodyL: 12, headW: 5, headH: 4, headL: 4, tailW: 3, tailH: 3, tailL: 6, flukeW: 8, flukeL: 3, flipper: 3, dorsalH: 3, dorsalL: 3, dorsalAt: 0.45 });
const { at } = body;
const skin = (base) => ({ base, layers: [...countershade({ back: '#2e343a', belly: '#e8eaea', at, lift: 1.8, soft: 1 }), fur(0.03)] });

export default {
  id: 'harbour_porpoise',
  name: 'Harbour Porpoise',
  group: 'whale',
  role: 'neutral',
  family: ['whale', 'porpoise'],
  size: [0.8, 0.5],
  health: 16,
  speed: 0.12,
  movement: 'cetacean',
  swimSpeed: 0.2,
  breath: 240,
  breaches: 60,
  xp: 2,
  hunts: ['small_fish'],
  huntInterval: 90,
  attack: { damage: 2, speed: 1.4 },
  spawn: [{ biomes: ['ocean', 'cold_ocean'], weight: 4, group: [2, 4], water: true, height: [45, 62] }],
  loot: [],
  sounds: { ...WHALE_SOUNDS, pitch: [1.0, 1.2] },
  egg: ['#3e444a', '#e8eaea'],
  model: { bones: body.bones },
  materials: { skin: skin('#5e646a'), head: skin('#5e646a'), fin: '#2e343a' },
  anims: cetacean({ amp: 22 }),
};
