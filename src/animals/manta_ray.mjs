import { ray } from '../lib/anim.mjs';
import { rayBody } from '../lib/bodies.mjs';
import { BIG_FISH_SOUNDS } from '../lib/skins.mjs';
import { mottle, region } from '../lib/texture.mjs';

// A giant ray that "flies" through warm seas on huge wings, filtering plankton. Black on top
// with pale shoulder patches, white underneath. Completely harmless.
const body = rayBody({ bodyW: 12, bodyH: 3, bodyL: 12, wing: 20, wingL: 10, hornL: 4, tailL: 12, lift: 2 });
const { at } = body;
const belly = ({ face: f }) => f === 'bottom';

export default {
  id: 'manta_ray',
  name: 'Manta Ray',
  group: 'shark',
  role: 'neutral',
  family: ['fish', 'giant_fish', 'ray'],
  size: [2.6, 0.4],
  scale: 1.4,
  maxWidth: 3.2,
  health: 40,
  speed: 0.1,
  movement: 'swim',
  swimSpeed: 0.12,
  babies: false,
  xp: 6,
  roam: 24,
  spawn: [{ biomes: ['warm_ocean', 'lukewarm_ocean'], weight: 1, group: [1, 2], water: true, height: [40, 60] }],
  loot: [{ item: 'aquatic:raw_fish_steak', min: 1, max: 3 }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#1e2228', '#f0f0ec'],
  model: { bones: body.bones },
  materials: {
    back: { base: '#1e2228', layers: [region('#d8dcd8', ({ face: f, p }) => f === 'top' && p[2] < at.zf + 5 && Math.abs(p[0]) > 3), region('#f0f0ec', belly), mottle(0.06)] },
    wing: { base: '#1e2228', layers: [region('#f0f0ec', belly), region('#cfd4d0', ({ face: f, p }) => f === 'top' && p[2] < at.zf + 3 && Math.abs(p[0]) < 12), mottle(0.06)] },
    horn: '#2a2e34',
    tail: '#15181c',
  },
  anims: ray({ swimLength: 2.6, amp: 32 }),
};
