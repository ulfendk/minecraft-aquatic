import { fish } from '../lib/anim.mjs';
import { fishBody } from '../lib/bodies.mjs';
import { BIG_FISH_SOUNDS } from '../lib/skins.mjs';
import { mottle, stripes, underside } from '../lib/texture.mjs';

// A bottom-dweller with a long body, dark bands and big tusk-like teeth for crushing crabs and
// sea urchins. Leave it alone or it bites.
const body = fishBody({
  bodyW: 4, bodyH: 5, bodyL: 12, headW: 4, headH: 5, headL: 5, jaw: true, teeth: true, tailW: 3, tailH: 4, tailL: 8,
  caudal: 'round', caudalH: 4, caudalL: 2, dorsalH: 2, dorsalL: 12, dorsalAt: 0.0, pectoral: 3, lift: 0,
  eye: { back: 2, down: 0 },
});
const { at } = body;
body.bones.find((b) => b.name === 'tail').cubes.push(
  { origin: [-0.5, at.top - 1, at.zb], size: [1, 1, 7], mat: 'fin' },
  { origin: [-0.5, at.bottom, at.zb], size: [1, 1, 7], mat: 'fin' },
);

export default {
  id: 'wolffish',
  name: 'Atlantic Wolffish',
  group: 'sea',
  role: 'neutral',
  family: ['fish', 'big_fish'],
  size: [0.6, 0.4],
  health: 14,
  speed: 0.08,
  movement: 'swim',
  swimSpeed: 0.1,
  babies: false,
  bottom: true,
  xp: 4,
  attack: { damage: 4, speed: 1.4 },
  spawn: [{ biomes: ['cold_ocean', 'frozen_ocean', 'deep_ocean'], weight: 3, group: [1, 1], water: true, height: [25, 50] }],
  loot: [{ item: 'aquatic:wolffish', min: 1, max: 1, smelts: true }],
  sounds: BIG_FISH_SOUNDS,
  egg: ['#6a7480', '#3a4250'],
  model: { bones: body.bones },
  materials: {
    scales: {
      base: '#6a7480',
      layers: [
        stripes('#3a4250', { axis: 2, period: 4, width: 0.3, warp: 1.2, warpScale: 3 }),
        mottle(0.12, { scale: 2 }),
        underside('#b8bcc0', { y: at.bottom + 1, soft: 1 }),
      ],
    },
    head: { base: '#6a7480', layers: [mottle(0.15, { scale: 1.5 }), underside('#b8bcc0', { y: at.bottom + 1, soft: 1 })] },
    teeth: '#f0ead8',
    fin: '#4e5662',
  },
  anims: fish({ jaw: 'jaw', swimLength: 0.9, amp: 18 }),
};
