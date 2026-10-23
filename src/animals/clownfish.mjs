import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { FISH_SOUNDS } from '../lib/skins.mjs';
import { hex, region } from '../lib/texture.mjs';

// Orange with three white bands edged in black. Lives in pairs among anemones and coral.
const body = fishBody({
  bodyW: 2, bodyH: 3, bodyL: 4, headW: 2, headH: 3, headL: 2, tailW: 1, tailH: 2, tailL: 1,
  caudal: 'round', caudalH: 3, caudalL: 2, dorsalH: 2, dorsalL: 3, dorsalAt: 0.1, anal: 1, pectoral: 1, lift: 1,
});
const { at } = body;
// Band centres along z (head, middle, tail root).
const bands = [at.zf - 0.5, 0.5, at.zb + 0.5];
const banded = (c, { p }) => {
  for (const z of bands) {
    const d = Math.abs(p[2] - z);
    if (d < 0.5) return hex('#f8f6f0');
    if (d < 1.0) return hex('#1a1612');
  }
  return c;
};

export default {
  id: 'clownfish',
  name: 'Clownfish',
  group: 'tropical',
  role: 'prey',
  family: ['fish', 'small_fish', 'reef_fish'],
  size: [0.25, 0.25],
  health: 3,
  speed: 0.08,
  movement: 'swim',
  swimSpeed: 0.1,
  bucket: true,
  babies: false,
  roam: 4,
  xp: 1,
  spawn: [{ biomes: ['warm_ocean'], weight: 8, group: [2, 3], water: true, height: [45, 63] }],
  loot: [{ item: 'aquatic:clownfish', min: 1, max: 1 }],
  sounds: FISH_SOUNDS,
  egg: ['#f07a1a', '#f8f6f0'],
  model: { bones: body.bones },
  materials: {
    scales: { base: '#f07a1a', layers: [banded] },
    head: { base: '#f07a1a', layers: [banded] },
    fin: { base: '#f07a1a', layers: [region('#1a1612', ({ j, fh, i, fw }) => j === 0 || j === fh - 1 || i === fw - 1)] },
  },
  anims: fish({ swimLength: 0.3, amp: 22 }),
};

