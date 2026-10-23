import { pinniped } from '../lib/anim.mjs';
import { pinnipedBody } from '../lib/bodies.mjs';
import { fur, mottle, underside } from '../lib/texture.mjs';

// A huge, wrinkled, whiskered seal with long ivory tusks, lounging in herds on Arctic ice.
// Usually peaceful, but the whole herd defends a walrus that's attacked.
const body = pinnipedBody({ bodyW: 14, bodyH: 11, bodyL: 22, neckW: 12, neckH: 10, neckL: 3, headW: 9, headH: 7, headL: 6, snoutW: 7, snoutH: 4, snoutL: 3, front: 6, hind: 7, tusks: 5 });
const skin = (base) => ({ base, layers: [mottle(0.14, { scale: 2 }), fur(0.06), underside('#8a5a48', { y: 2, soft: 2 })] });

export default {
  id: 'walrus',
  name: 'Walrus',
  group: 'seal',
  role: 'neutral',
  family: ['seal', 'walrus'],
  size: [1.4, 1.0],
  scale: 1.2,
  health: 40,
  speed: 0.09,
  movement: 'pinniped',
  swimSpeed: 0.16,
  breath: 600,
  sleeps: 'night',
  xp: 6,
  knockbackResistance: 0.6,
  attack: { damage: 6, speed: 1.2 },
  alertsPack: true,
  breed: ['cod', 'salmon'],
  tempt: ['cod', 'salmon'],
  spawn: [{ biomes: ['snowy_beach', 'frozen_ocean'], weight: 4, group: [2, 4], blocks: ['ice', 'packed_ice', 'snow', 'snow_layer', 'sand', 'gravel'] }],
  loot: [],
  sounds: { ambient: 'mob.hoglin.ambient', hurt: 'mob.hoglin.hurt', death: 'mob.hoglin.death', pitch: [0.55, 0.7], interval: 18 },
  egg: ['#a8705a', '#f0e8d0'],
  model: { bones: body.bones },
  materials: {
    fur: skin('#a8705a'),
    head: skin('#a06a54'),
    snout: { base: '#b8866a', layers: [mottle(0.1)] },
    flipper: '#7a4e3e',
    tusk: '#f0e8d0',
  },
  anims: pinniped({ amp: 22 }),
};
