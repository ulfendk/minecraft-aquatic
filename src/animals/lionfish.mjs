import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { FISH_SOUNDS } from '../lib/skins.mjs';
import { stripes } from '../lib/texture.mjs';

// Red-and-white stripes, fan-like fins and a crest of long venomous spines. Hitting one hurts:
// the spines poison whatever touches them.
const body = fishBody({
  bodyW: 2, bodyH: 4, bodyL: 6, headW: 2, headH: 4, headL: 3, tailW: 1, tailH: 2, tailL: 2,
  caudal: 'round', caudalH: 4, caudalL: 3, dorsalH: 0, pectoral: 5, lift: 1,
});
const { at } = body;
// Spines along the back.
body.bones.find((b) => b.name === 'dorsal_fin').cubes.push(
  ...[0, 1, 2, 3, 4].map((i) => ({ origin: [0, at.top, at.zf + 0.5 + i * 1.2], size: [0, 6 - i, 1], mat: 'spine', rotation: [-20, 0, 0], pivot: [0, at.top, at.zf + 0.5 + i * 1.2] })),
);
// The fan-like pectoral fins are big and striped.
for (const n of ['fin_l', 'fin_r']) {
  const fin = body.bones.find((b) => b.name === n);
  fin.cubes[0].size = [5, 0, 5];
  fin.cubes[0].mat = 'fan';
}

export default {
  id: 'lionfish',
  name: 'Lionfish',
  group: 'tropical',
  role: 'neutral',
  family: ['fish', 'reef_fish'],
  size: [0.35, 0.35],
  health: 6,
  speed: 0.06,
  movement: 'swim',
  swimSpeed: 0.07,
  bucket: true,
  babies: false,
  poisonous: true,
  roam: 6,
  xp: 2,
  spawn: [{ biomes: ['warm_ocean', 'lukewarm_ocean'], weight: 4, group: [1, 2], water: true, height: [40, 62] }],
  loot: [{ item: 'aquatic:lionfish', min: 1, max: 1 }],
  sounds: FISH_SOUNDS,
  egg: ['#f4e8dc', '#a02a1a'],
  model: { bones: body.bones },
  materials: {
    scales: { base: '#f4e8dc', layers: [stripes('#a02a1a', { axis: 2, period: 1.6, width: 0.5, warp: 0.5, warpScale: 2 })] },
    head: { base: '#f0e2d4', layers: [stripes('#a02a1a', { axis: 1, period: 1.4, width: 0.45, warp: 0.4, warpScale: 2 })] },
    spine: { base: '#e8d8c8', layers: [stripes('#a02a1a', { axis: 1, period: 1.5, width: 0.5, warp: 0 })] },
    fan: { base: '#f0e0d0', layers: [stripes('#8a2a1a', { axis: 0, period: 1.2, width: 0.45, warp: 0.3, warpScale: 2 })] },
    fin: { base: '#e8d0c0', layers: [stripes('#a02a1a', { axis: 1, period: 1.2, width: 0.5, warp: 0 })] },
  },
  anims: fish({ swimLength: 0.8, amp: 14 }),
};
