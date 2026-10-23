import { serpent } from '../lib/anim.mjs';
import { BIG_FISH_SOUNDS } from '../lib/skins.mjs';
import { mottle, region } from '../lib/texture.mjs';

// A long, slimy snake of a fish; dark olive above, yellow below. It hunts at night.
const SEGMENTS = 6;
const segs = [];
for (let i = 0; i < SEGMENTS; i++) {
  const z = i * 3;
  const thin = i >= SEGMENTS - 2;
  segs.push({
    name: `seg${i + 1}`, parent: i === 0 ? 'root' : `seg${i}`, pivot: [0, 1, z],
    cubes: [
      { origin: [-1, thin ? 0.5 : 0, z], size: [2, thin ? 1 : 2, 3], mat: 'skin' },
      ...(i >= 2 ? [{ origin: [0, 2, z], size: [0, 1, 3], mat: 'fin' }, { origin: [0, -1, z], size: [0, 1, 3], mat: 'fin' }] : []),
    ],
  });
}

export default {
  id: 'eel',
  name: 'European Eel',
  group: 'freshwater',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.4, 0.25],
  health: 6,
  speed: 0.1,
  movement: 'swim',
  swimSpeed: 0.11,
  babies: false,
  bottom: true,
  xp: 2,
  spawn: [{ biomes: ['river', 'swamp', 'lakes', 'mangrove'], weight: 4, group: [1, 2], water: true, height: [40, 64] }],
  loot: [{ item: 'aquatic:eel', min: 1, max: 1, smelts: true }],
  sounds: { ...BIG_FISH_SOUNDS, pitch: [1.1, 1.3] },
  egg: ['#3b3a22', '#c9b45a'],
  model: {
    bones: [
      { name: 'root', pivot: [0, 1, 0] },
      ...segs,
      {
        name: 'head', parent: 'seg1', pivot: [0, 1, 0],
        cubes: [{
          origin: [-1, 0, -3], size: [2, 2, 3], mat: 'skin',
          marks: [{ face: 'right', x: 1, y: 0, color: '#0a0a08' }, { face: 'left', x: 1, y: 0, color: '#0a0a08' }, { face: 'front', x: 0, y: 1, w: 2, color: '#1a1a14' }],
        }],
      },
    ],
  },
  materials: {
    skin: { base: '#3b3a22', layers: [region('#c9b45a', ({ face: f, p }) => f === 'bottom' || p[1] < 0.6), mottle(0.1, { scale: 1.5 })] },
    fin: '#4a4630',
  },
  anims: serpent({ segments: ['head', ...segs.map((s) => s.name)], amp: 14 }),
};
