// The Bedrock fishing bobber: a little red-and-white float the rods cast (scripts/fishing.js).
// It floats on the water and dips under when a fish bites (the aquatic:dip property).
// Java uses the vanilla fishing hook instead.
import { NS } from './lib/constants.mjs';

export const bobber = {
  id: 'bobber',
  name: 'Bobber',
  model: {
    bones: [
      { name: 'root', pivot: [0, 0, 0] },
      {
        name: 'float', parent: 'root', pivot: [0, 1, 0],
        cubes: [
          { origin: [-1.5, 0, -1.5], size: [3, 2, 3], mat: 'white' },
          { origin: [-1.5, 2, -1.5], size: [3, 2, 3], mat: 'red' },
          { origin: [-0.5, 4, -0.5], size: [1, 2, 1], mat: 'stick' },
        ],
      },
    ],
  },
  materials: { white: '#f4f4f0', red: '#d02020', stick: '#3a2a1a' },
};

export function buildBobber() {
  return {
    format_version: '1.21.90',
    'minecraft:entity': {
      description: {
        identifier: `${NS}:bobber`,
        is_spawnable: false,
        is_summonable: true,
        properties: { [`${NS}:dip`]: { type: 'bool', default: false, client_sync: true } },
      },
      components: {
        'minecraft:type_family': { family: ['aquatic_bobber', 'inanimate'] },
        'minecraft:collision_box': { width: 0.25, height: 0.25 },
        'minecraft:physics': {},
        'minecraft:pushable': { is_pushable: false, is_pushable_by_piston: false },
        'minecraft:damage_sensor': { triggers: [{ cause: 'all', deals_damage: 'no' }] },
        'minecraft:knockback_resistance': { value: 1 },
        'minecraft:buoyant': { base_buoyancy: 1.0, apply_gravity: true, simulate_waves: true, big_wave_probability: 0.02, big_wave_speed: 6.0, liquid_blocks: ['minecraft:water', 'minecraft:flowing_water'] },
        'minecraft:conditional_bandwidth_optimization': {},
      },
    },
  };
}

export function buildBobberClient() {
  return {
    format_version: '1.10.0',
    'minecraft:client_entity': {
      description: {
        identifier: `${NS}:bobber`,
        materials: { default: 'entity_alphatest' },
        textures: { default: `textures/entity/${NS}/bobber` },
        geometry: { default: `geometry.${NS}.bobber` },
        animations: { dip: `animation.${NS}.bobber.dip` },
        scripts: { animate: [{ dip: `query.property('${NS}:dip')` }] },
        render_controllers: [`controller.render.${NS}.bobber`],
      },
    },
  };
}

export const bobberAnimations = {
  format_version: '1.8.0',
  animations: {
    [`animation.${NS}.bobber.dip`]: { loop: true, animation_length: 0.5, bones: { float: { position: { '0.0': [0, -3, 0], '0.25': [0, -5, 0], '0.5': [0, -3, 0] } } } },
  },
};
