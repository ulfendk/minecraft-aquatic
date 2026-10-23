import { flatfish } from '../lib/anim.mjs';
import { FISH_SOUNDS } from '../lib/skins.mjs';
import { mottle, spots, region } from '../lib/texture.mjs';

// A flatfish: it lies on its side on the sea floor, both eyes on its upper (brown) side, which
// is dotted with orange spots. The blind side underneath is white. Danes fry it for stjerneskud.
const top = 2;
export default {
  id: 'plaice',
  name: 'Plaice',
  group: 'sea',
  role: 'prey',
  family: ['fish', 'small_fish'],
  size: [0.5, 0.15],
  health: 5,
  speed: 0.08,
  movement: 'swim',
  swimSpeed: 0.1,
  bucket: true,
  babies: false,
  bottom: true,
  xp: 1,
  spawn: [{ biomes: ['ocean', 'cold_ocean'], weight: 8, group: [1, 3], water: true, height: [30, 58] }],
  loot: [{ item: 'aquatic:plaice', min: 1, max: 1, smelts: true }],
  sounds: FISH_SOUNDS,
  egg: ['#7a6a4a', '#e0662a'],
  model: {
    bones: [
      { name: 'root', pivot: [0, 1, 0] },
      {
        name: 'body', parent: 'root', pivot: [0, 1, 0],
        cubes: [
          { origin: [-4, 1, -4], size: [8, 1, 8], mat: 'skin' },
          // Fin fringe all round.
          { origin: [-5, 1, -3], size: [1, 1, 7], mat: 'fringe' },
          { origin: [4, 1, -3], size: [1, 1, 7], mat: 'fringe' },
        ],
      },
      {
        name: 'head', parent: 'body', pivot: [0, 1, -4],
        cubes: [{
          origin: [-3, 1, -7], size: [5, 1, 3], mat: 'skin',
          marks: [{ face: 'top', x: 2, y: 0, color: '#1a1a14' }, { face: 'top', x: 3, y: 1, color: '#1a1a14' }],
        }],
      },
      {
        name: 'tail', parent: 'body', pivot: [0, 1, 4],
        cubes: [
          { origin: [-1.5, 1, 4], size: [3, 1, 2], mat: 'skin' },
          { origin: [-3, 1, 6], size: [6, 0, 3], mat: 'fringe' },
        ],
      },
    ],
  },
  materials: {
    skin: {
      base: '#7a6a4a',
      layers: [
        mottle(0.15, { scale: 1.5, seed: 8 }),
        spots('#e0662a', { size: 2.2, radius: 0.22, seed: 12, where: ({ face: f }) => f === 'top' }),
        region('#efece2', ({ face: f, p }) => f === 'bottom' || (f !== 'top' && p[1] < top - 0.6)),
      ],
    },
    fringe: { base: '#6a5c40', layers: [region('#e8e4d8', ({ face: f }) => f === 'bottom')] },
  },
  anims: flatfish(),
};
