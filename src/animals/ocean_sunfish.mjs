import { mottle, underside } from '../lib/texture.mjs';
import { BIG_FISH_SOUNDS } from '../lib/skins.mjs';
import { eyes } from '../lib/parts.mjs';

// The heaviest bony fish in the world: a swimming head with a tall fin above and below and a
// stubby rudder for a tail. It drifts near the surface eating jellyfish.
const cy = 15;
const r = (n) => Math.round(n * 100) / 100;
const scull = (len, amp) => {
  const out = {};
  for (let k = 0; k <= 8; k++) out[r((k / 8) * len).toFixed(2)] = [0, r(amp * Math.sin((k / 8) * Math.PI * 2)), 0];
  return out;
};

export default {
  id: 'ocean_sunfish',
  name: 'Ocean Sunfish',
  group: 'sea',
  role: 'neutral',
  family: ['fish', 'giant_fish'],
  size: [0.9, 1.6],
  scale: 1.2,
  health: 30,
  speed: 0.06,
  movement: 'swim',
  swimSpeed: 0.06,
  babies: false,
  xp: 5,
  roam: 10,
  spawn: [{ biomes: ['warm_ocean', 'lukewarm_ocean', 'ocean'], weight: 1, group: [1, 1], water: true, height: [45, 62] }],
  loot: [{ item: 'aquatic:raw_fish_steak', min: 2, max: 4 }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#8a949c', '#d8dce0'],
  model: {
    bones: [
      { name: 'root', pivot: [0, cy, 0] },
      {
        name: 'body', parent: 'root', pivot: [0, cy, 0],
        cubes: [
          { origin: [-1.5, 8, -6], size: [3, 14, 12], mat: 'skin' },
          { origin: [-1.5, 10, -9], size: [3, 10, 3], mat: 'skin', marks: eyes(3, { back: 0, down: 3, w: 1, h: 2 }) },
        ],
      },
      { name: 'head', parent: 'body', pivot: [0, cy, -9], cubes: [{ origin: [-1, 12, -10], size: [2, 3, 1], mat: 'skin' }] },
      { name: 'dorsal_fin', parent: 'body', pivot: [0, 22, 3], cubes: [{ origin: [-0.5, 22, 2], size: [1, 9, 4], mat: 'fin' }] },
      { name: 'anal_fin', parent: 'body', pivot: [0, 8, 3], cubes: [{ origin: [-0.5, 0, 2], size: [1, 8, 4], mat: 'fin' }] },
      { name: 'tail', parent: 'body', pivot: [0, cy, 6], cubes: [{ origin: [-0.5, 10, 6], size: [1, 10, 2], mat: 'fin' }] },
      { name: 'fin_l', parent: 'body', pivot: [1.5, 14, -4], cubes: [{ origin: [1.5, 13, -4], size: [0, 2, 2], mat: 'fin' }] },
      { name: 'fin_r', parent: 'body', pivot: [-1.5, 14, -4], cubes: [{ origin: [-1.5, 13, -4], size: [0, 2, 2], mat: 'fin' }] },
    ],
  },
  materials: {
    skin: { base: '#8a949c', layers: [mottle(0.14, { scale: 2.5 }), underside('#d8dce0', { y: 11, soft: 3 })] },
    fin: { base: '#6e7880', layers: [mottle(0.1, { scale: 2 })] },
  },
  anims: {
    swim: { loop: true, animation_length: 1.6, bones: { dorsal_fin: { rotation: scull(1.6, 30) }, anal_fin: { rotation: scull(1.6, -30) }, tail: { rotation: scull(1.6, 10) } } },
    idle: { loop: true, animation_length: 3, bones: { dorsal_fin: { rotation: scull(3, 15) }, anal_fin: { rotation: scull(3, -15) } } },
    // Lying on its side at the surface (sunbathing), and stranded.
    flop: { loop: true, animation_length: 1, bones: { root: { rotation: [0, 0, 90], position: [0, 2, 0] }, dorsal_fin: { rotation: scull(1, 20) } } },
    dead: { loop: true, bones: { root: { rotation: [0, 0, 90], position: [0, 2, 0] } } },
  },
};
