// Animal spec -> Bedrock behavior-pack files (entity, spawn rules, loot table).
import { NS } from './constants.mjs';

const fam = (value) => ({ test: 'is_family', subject: 'other', value });
const anyFamily = (list) => (list.length === 1 ? fam(list[0]) : { any_of: list.map(fam) });

/** Habitat keys -> Bedrock biome tags. A list means all of them (cold oceans, not cold forests). */
const BIOME_TAGS = {
  river: 'river',
  lakes: { any_of: ['plains', 'forest', 'taiga', 'birch', 'flower_forest', 'meadow', 'jungle'] },
  swamp: 'swamp',
  mangrove: 'mangrove_swamp',
  ocean: { all_of: ['ocean'], none_of: ['warm', 'lukewarm', 'cold', 'frozen'] },
  deep_ocean: ['deep', 'ocean'],
  warm_ocean: ['warm', 'ocean'],
  lukewarm_ocean: ['lukewarm', 'ocean'],
  cold_ocean: ['cold', 'ocean'],
  frozen_ocean: ['frozen', 'ocean'],
  beach: { all_of: ['beach'], none_of: ['cold', 'stone'] },
  stony_shore: ['stone', 'beach'],
  snowy_beach: ['cold', 'beach'],
  ice_spikes: ['ice_plains', 'mutated'],
};

const tagTest = (value, operator = '==') => ({ test: 'has_biome_tag', operator, value });
function biomeTest(key) {
  const t = BIOME_TAGS[key];
  if (!t) throw new Error(`Unknown habitat "${key}"`);
  if (typeof t === 'string') return tagTest(t);
  if (Array.isArray(t)) return t.length === 1 ? tagTest(t[0]) : { all_of: t.map((v) => tagTest(v)) };
  if (t.any_of) return { any_of: t.any_of.map((v) => tagTest(v)) };
  return { all_of: [...t.all_of.map((v) => tagTest(v)), ...t.none_of.map((v) => tagTest(v, '!='))] };
}

/** Prefix vanilla items with minecraft: and leave our own alone. */
export const itemId = (name) => (name.includes(':') ? name : `minecraft:${name}`);

/** Fish and sharks are game for Realistic Hunting; seals, whales and penguins are protected. */
export const isHuntable = (a) => a.movement === 'swim';

const WATER = ['minecraft:water', 'minecraft:flowing_water'];

function baseComponents(a) {
  const c = {
    'minecraft:is_hidden_when_invisible': {},
    'minecraft:type_family': { family: [a.id, NS, a.role, a.group, ...(a.family ?? []), 'mob'] },
    'minecraft:collision_box': { width: hitbox(a)[0], height: hitbox(a)[1] },
    'minecraft:health': { value: a.health, max: a.health },
    'minecraft:movement': { value: a.speed },
    'minecraft:jump.static': {},
    'minecraft:nameable': {},
    'minecraft:physics': {},
    'minecraft:pushable': { is_pushable: true, is_pushable_by_piston: true },
    'minecraft:leashable': {},
    'minecraft:despawn': { despawn_from_distance: { min_distance: 54, max_distance: 128 } },
    'minecraft:conditional_bandwidth_optimization': {},
    'minecraft:hurt_on_condition': {
      damage_conditions: [{ filters: { test: 'in_lava', subject: 'self' }, cause: 'lava', damage_per_tick: 4 }],
    },
    'minecraft:behavior.random_look_around': { priority: 10 },
    'minecraft:behavior.look_at_player': { priority: 9, look_distance: 8, probability: 0.02 },
  };
  if (a.size[0] * a.size[1] < 2) c['minecraft:balloonable'] = { mass: Math.max(0.2, a.size[0] * a.size[1]) };
  if (a.persistent) delete c['minecraft:despawn'];

  if (a.sounds?.ambient) {
    c['minecraft:ambient_sound_interval'] = { event_name: 'ambient', range: 16, value: a.sounds.interval ?? 10 };
  }
  if (a.knockbackResistance) {
    c['minecraft:knockback_resistance'] = { value: a.knockbackResistance };
  }

  switch (a.movement) {
    case 'swim':
      // Fish (like cod): can't leave the water and flop about when stranded (see the
      // aquatic:in_water / aquatic:stranded groups and scripts/behaviours.js).
      Object.assign(c, {
        'minecraft:underwater_movement': { value: a.swimSpeed ?? 0.12 },
        'minecraft:movement.sway': { sway_amplitude: 0 },
        'minecraft:navigation.generic': { can_breach: false, can_walk: false, can_path_over_water: false, can_sink: false, can_swim: true, is_amphibious: false },
        'minecraft:breathable': { total_supply: 15, suffocate_time: 0, breathes_air: false, breathes_water: true },
        'minecraft:behavior.random_swim': { priority: 8, interval: 0, xz_dist: a.roam ?? 16, y_dist: 4, speed_multiplier: 1.0 },
        'minecraft:behavior.swim_idle': { priority: 9 },
        'minecraft:behavior.swim_wander': { priority: 9, interval: 0.1, look_ahead: 2 },
      });
      if (a.bottom) {
        // Bottom dwellers (plaice, wolffish) keep low.
        c['minecraft:behavior.random_swim'].y_dist = 1;
      }
      if (a.school) {
        c['minecraft:flocking'] = {
          in_water: true, match_variants: false, use_center_of_mass: true, low_flock_limit: 4, high_flock_limit: 8,
          goal_weight: 2, loner_chance: 0.1, influence_radius: 3, breach_influence: 7, separation_weight: 1.75,
          separation_threshold: 0.95, cohesion_weight: 2, cohesion_threshold: 1.95, innner_cohesion_threshold: 1.25,
          min_height: 1.5, block_distance: 2, block_weight: 0.85,
        };
      }
      delete c['minecraft:physics'];
      delete c['minecraft:behavior.look_at_player'];
      delete c['minecraft:behavior.random_look_around'];
      delete c['minecraft:jump.static'];
      break;
    case 'cetacean':
      // Whales, dolphins and porpoises: breathe air, surface to blow, some leap clear of the water.
      Object.assign(c, {
        'minecraft:underwater_movement': { value: a.swimSpeed ?? 0.15 },
        'minecraft:movement.basic': {},
        'minecraft:navigation.generic': { is_amphibious: true, can_path_over_water: true, can_swim: true, can_walk: false, can_breach: !!a.breaches, can_jump: false },
        'minecraft:breathable': { total_supply: a.breath ?? 240, suffocate_time: 0, breathes_air: true, breathes_water: false, generates_bubbles: false },
        'minecraft:behavior.swim_up_for_breath': { priority: 1, search_radius: 4, search_height: 24 },
        'minecraft:behavior.random_swim': { priority: 7, interval: 0, xz_dist: a.roam ?? 20, y_dist: 6 },
        'minecraft:physics': {},
      });
      if (a.breaches) {
        c['minecraft:behavior.random_breach'] = { priority: 6, interval: a.breaches, xz_dist: 6, cooldown_time: 4.0 };
      }
      if (a.followsSwimmers) {
        c['minecraft:behavior.swim_with_entity'] = {
          priority: 4, success_rate: 0.1, chance_to_stop: 0.0333, state_check_interval: 0.5, catch_up_threshold: 12.0,
          match_direction_threshold: 2.0, catch_up_multiplier: 2.5, speed_multiplier: 1.5, search_range: 20.0, stop_distance: 5.0,
          entity_types: [{ filters: fam('player') }],
        };
      }
      delete c['minecraft:jump.static'];
      delete c['minecraft:behavior.look_at_player'];
      break;
    case 'pinniped':
    case 'penguin':
      // Seals and penguins: at home on land and in the water, but they breathe air.
      Object.assign(c, {
        'minecraft:movement.amphibious': { max_turn: 10 },
        'minecraft:navigation.generic': { is_amphibious: true, can_path_over_water: true, can_swim: true, can_walk: true, can_breach: true, can_sink: false, avoid_damage_blocks: true },
        'minecraft:underwater_movement': { value: a.swimSpeed ?? 0.15 },
        'minecraft:breathable': { total_supply: a.breath ?? 300, suffocate_time: 0, breathes_air: true, breathes_water: false, generates_bubbles: false },
        'minecraft:behavior.swim_up_for_breath': { priority: 1, search_radius: 4, search_height: 16 },
        'minecraft:behavior.random_stroll': { priority: 8, speed_multiplier: 0.8, xz_dist: 8 },
        'minecraft:behavior.random_swim': { priority: 8, speed_multiplier: 1.0, xz_dist: 12, y_dist: 4, interval: 40 },
      });
      break;
    default:
      throw new Error(`${a.id}: unknown movement "${a.movement}"`);
  }

  // Prey runs from the animals that hunt it.
  if (a.fleesFrom?.length) {
    c['minecraft:behavior.avoid_mob_type'] = {
      priority: 3,
      remove_target: true,
      entity_types: [{
        filters: anyFamily(a.fleesFrom),
        max_dist: a.fleeDistance ?? 10,
        walk_speed_multiplier: 1.3,
        sprint_speed_multiplier: a.fleeSpeed ?? 1.6,
      }],
    };
  }

  // How it reacts when hurt.
  if (a.attack) {
    c['minecraft:attack'] = { damage: a.attack.damage, ...(a.attack.effect ? { effect_name: a.attack.effect, effect_duration: 4 } : {}) };
    c['minecraft:behavior.melee_box_attack'] = {
      priority: 3,
      speed_multiplier: a.attack.speed ?? 1.3,
      track_target: true,
      cooldown_time: a.attack.cooldown ?? 1.0,
    };
    c['minecraft:behavior.hurt_by_target'] = { priority: 1, alert_same_type: !!a.alertsPack, hurt_owner: false };
  } else {
    c['minecraft:behavior.panic'] = { priority: 1, speed_multiplier: a.panicSpeed ?? 1.5 };
  }

  if (a.tempt?.length) {
    c['minecraft:behavior.tempt'] = { priority: 4, speed_multiplier: 1.1, items: a.tempt.map(itemId), can_tempt_vertically: true };
  }
  return c;
}

/** Component groups shared by every species: baby/adult and the day/night schedule. */
function lifeGroups(a) {
  const breedItems = (a.breed ?? []).map(itemId);
  const groups = {
    [`${NS}:baby`]: {
      'minecraft:is_baby': {},
      'minecraft:scale': { value: a.babyScale ?? 0.5 },
      'minecraft:ageable': {
        duration: 1200,
        feed_items: breedItems.map((item) => ({ item, growth: 0.1 })),
        grow_up: { event: `${NS}:grow_up`, target: 'self' },
      },
      'minecraft:behavior.follow_parent': { priority: 5, speed_multiplier: 1.1 },
    },
    [`${NS}:adult`]: {
      'minecraft:experience_reward': { on_bred: 'Math.Random(1,7)', on_death: `query.last_hit_by_player ? Math.Random(1,${a.xp ?? 3}) : 0` },
      'minecraft:loot': { table: `loot_tables/entities/${NS}_${a.id}.json` },
    },
  };
  if (breedItems.length) {
    Object.assign(groups[`${NS}:adult`], {
      'minecraft:breedable': {
        require_tame: false,
        breeds_with: { mate_type: `${NS}:${a.id}`, baby_type: `${NS}:${a.id}`, breed_event: { event: `${NS}:entity_born`, target: 'baby' } },
        breed_items: breedItems,
      },
      'minecraft:behavior.breed': { priority: 2, speed_multiplier: 1.0 },
    });
  }

  // Active hours: hunting and roaming. Resting hours: seals and penguins haul out and nap.
  const active = {};
  const resting = {};
  if (a.hunts?.length) {
    active['minecraft:behavior.nearest_attackable_target'] = {
      priority: 5,
      must_see: true,
      reselect_targets: true,
      attack_interval: a.huntInterval ?? 30,
      entity_types: [{ filters: { all_of: [anyFamily(a.hunts), { test: 'is_family', subject: 'other', operator: '!=', value: 'tamed_seal' }] }, max_dist: a.huntRange ?? 16 }],
    };
  }
  if (a.hostile) {
    // Hostile to players (here: only to hurt swimmers), never in peaceful.
    const playerTarget = {
      filters: { all_of: [fam('player'), ...(a.hostile.filters ?? [])] },
      max_dist: a.hostile.range ?? 10,
    };
    const tgt = active['minecraft:behavior.nearest_attackable_target'];
    if (tgt) tgt.entity_types.push(playerTarget);
    else active['minecraft:behavior.nearest_attackable_target'] = { priority: 5, must_see: true, reselect_targets: true, entity_types: [playerTarget] };
  }
  if (['pinniped', 'penguin'].includes(a.movement)) {
    active['minecraft:behavior.move_to_water'] = { priority: 7, search_range: 16, search_height: 5, search_count: 1, goal_radius: 0.5 };
    resting['minecraft:behavior.move_to_land'] = { priority: 5, search_range: 16, search_height: 5, search_count: 1, goal_radius: 0.5 };
  }

  const sleeps = a.sleeps ?? 'never';
  if (sleeps !== 'never') {
    resting['minecraft:behavior.nap'] = {
      priority: 6,
      cooldown_min: 4,
      cooldown_max: 12,
      mob_detect_dist: 8,
      mob_detect_height: 4,
      can_nap_filters: {
        all_of: [
          { test: 'in_water', subject: 'self', operator: '==', value: false },
          { test: 'on_ground', subject: 'self', operator: '==', value: true },
          { test: 'is_riding', subject: 'self', operator: '==', value: false },
          { test: 'has_target', subject: 'self', operator: '==', value: false },
        ],
      },
      wake_mob_exceptions: { any_of: [fam(a.id), fam(a.group), { test: 'is_sneaking', subject: 'other', operator: '==', value: true }] },
    };
  }
  groups[`${NS}:active`] = active;
  groups[`${NS}:resting`] = resting;
  return groups;
}

/**
 * Collision size after the species' size multiplier. Very wide boxes path badly, so the
 * width is capped (a blue whale's body is far longer than its box is wide).
 */
export function hitbox(a) {
  const k = a.scale ?? 1;
  const r = (v) => Math.round(v * 100) / 100;
  const cap = a.maxWidth ?? Math.max(a.size[0], 2.6);
  return [r(Math.min(a.size[0] * k, cap)), r(Math.min(a.size[1] * k, a.maxHeight ?? Infinity))];
}

/**
 * Seals: wolf-style taming with fish. A tamed seal follows its owner on land and in the
 * water, sits when told (interact), and defends its owner.
 */
function tameGroups(a) {
  const t = a.tame;
  return {
    [`${NS}:wild`]: {
      'minecraft:tameable': {
        probability: t.chance ?? 0.33,
        tame_items: t.items.map(itemId),
        tame_event: { event: `${NS}:on_tame`, target: 'self' },
      },
    },
    [`${NS}:tamed`]: {
      'minecraft:is_tamed': {},
      'minecraft:sittable': {},
      'minecraft:type_family': { family: [a.id, NS, a.role, a.group, 'tamed_seal', ...(a.family ?? []), 'mob'] },
      'minecraft:behavior.stay_while_sitting': { priority: 2 },
      'minecraft:behavior.follow_owner': { priority: 4, speed_multiplier: 1.2, start_distance: 8, stop_distance: 3 },
      'minecraft:behavior.owner_hurt_by_target': { priority: 1 },
      'minecraft:behavior.owner_hurt_target': { priority: 2 },
      'minecraft:attack': { damage: a.tame.damage ?? 3 },
      'minecraft:behavior.melee_box_attack': { priority: 3, speed_multiplier: 1.3, track_target: true },
      'minecraft:healable': { items: t.items.map((item) => ({ item: itemId(item), heal_amount: 4 })) },
      'minecraft:despawn': { despawn_from_distance: { min_distance: 100000, max_distance: 100001 } },
    },
  };
}

/** Whales you can grab on to: a seat at the dorsal fin, the whale keeps swimming its own way. */
function rideComponents(a) {
  const k = a.scale ?? 1;
  return {
    'minecraft:rideable': {
      seat_count: 1,
      family_types: ['player'],
      interact_text: 'action.interact.aquatic.hold_fin',
      pull_in_entities: false,
      seats: { position: a.rideFin.seat.map((v) => Math.round(v * k * 100) / 100), lock_rider_rotation: 0 },
    },
  };
}

/** Several features add damage-sensor rules; merge them into one list. */
function addDamageTrigger(components, trigger, first = false) {
  const ds = components['minecraft:damage_sensor'] ?? { triggers: [] };
  const old = Array.isArray(ds.triggers) ? ds.triggers : [ds.triggers];
  ds.triggers = first ? [trigger, ...old] : [...old, trigger];
  components['minecraft:damage_sensor'] = ds;
}

/** Realistic Hunting states, set by the hunting add-on's scripts (see src/hunting.mjs). */
const HUNT = { calm: 0, alert: 1, flee: 2, wounded: 3, carcass: 4 };

/**
 * Realistic Hunting hooks (fish and sharks only). Nothing here does anything on its own:
 * when the hunting add-on is installed, its scripts set aquatic:hunt_state (spooked fish
 * flee from divers) and fire aquatic:hunt_carcass when one is brought down. A carcass
 * loses everything a living fish does, floats belly up, can't be hurt and rots away after
 * 20 minutes unless it's field dressed.
 */
function huntingHooks(a, components, groups, events, properties) {
  const state = `${NS}:hunt_state`;
  const stateIs = (operator, value) => ({ test: 'int_property', subject: 'self', domain: state, operator, value });
  properties[state] = { type: 'int', range: [0, 4], default: 0, client_sync: true };
  components['minecraft:type_family'].family.push('hunting_target');

  const avoid = components['minecraft:behavior.avoid_mob_type'] ?? { priority: 1, remove_target: true, entity_types: [] };
  avoid.priority = 1;
  avoid.entity_types.push({
    filters: { all_of: [{ any_of: [fam('player'), fam('hunting_scare'), fam('hunting_dog')] }, stateIs('>=', HUNT.flee), stateIs('<=', HUNT.wounded)] },
    max_dist: 64,
    walk_speed_multiplier: 1.6,
    sprint_speed_multiplier: a.fleeSpeed ?? 1.8,
  });
  components['minecraft:behavior.avoid_mob_type'] = avoid;

  const sensor = components['minecraft:environment_sensor'];
  const navigation = Object.keys(components).find((k) => k.startsWith('minecraft:navigation.'));
  if (!navigation) throw new Error(`${a.id}: no navigation component`);
  sensor.triggers = [
    ...sensor.triggers.map((t) => ({ ...t, filters: { all_of: [t.filters, stateIs('!=', HUNT.carcass)] } })),
    { filters: { all_of: [stateIs('!=', HUNT.carcass), { test: 'has_component', subject: 'self', operator: '!=', value: navigation }] }, event: `${NS}:hunt_revive` },
  ];
  const alive = {};
  for (const key of Object.keys(components)) {
    if (/^minecraft:(behavior\.|navigation\.|ambient_sound_interval|healable|flocking)/.test(key)) {
      alive[key] = components[key];
      delete components[key];
    }
  }
  groups[`${NS}:hunt_alive`] = alive;
  groups[`${NS}:hunt_carcass`] = {
    'minecraft:interact': { interactions: [{ on_interact: { event: `${NS}:hunt_field_dress`, target: 'self' }, swing: true, interact_text: 'action.interact.hunting.field_dress' }] },
    'minecraft:timer': { looping: false, time: 1200, time_down_event: { event: `${NS}:hunt_rot`, target: 'self' } },
    'minecraft:pushable': { is_pushable: false, is_pushable_by_piston: true },
    'minecraft:physics': { has_gravity: true },
    'minecraft:buoyant': { base_buoyancy: 1.0, apply_gravity: true, simulate_waves: true, big_wave_probability: 0.03, big_wave_speed: 10.0, liquid_blocks: WATER },
    'minecraft:breathable': { total_supply: 15, suffocate_time: 0, breathes_air: true, breathes_water: true },
  };
  groups[`${NS}:hunt_young`] = { 'minecraft:is_baby': {}, 'minecraft:scale': { value: a.babyScale ?? 0.5 } };
  groups[`${NS}:hunt_despawn`] = { 'minecraft:instant_despawn': {} };
  groups[`${NS}:hunt_lured`] = {
    'minecraft:behavior.nearest_attackable_target': {
      priority: 2, must_see: false, reselect_targets: true, within_radius: 80,
      entity_types: [{ filters: fam('hunting_lure'), max_dist: 80 }],
    },
    'minecraft:behavior.move_towards_target': { priority: 2, speed_multiplier: 1.0, within_radius: 80 },
  };

  events['minecraft:entity_spawned'].sequence.unshift({ add: { component_groups: [`${NS}:hunt_alive`] } });
  for (const e of [`${NS}:entity_born`, `${NS}:spawn_adult`, `${NS}:from_bucket`]) events[e]?.add.component_groups.unshift(`${NS}:hunt_alive`);
  const life = Object.keys(groups).filter((g) => ![`${NS}:hunt_carcass`, `${NS}:hunt_young`, `${NS}:hunt_despawn`].includes(g) && !g.startsWith(`${NS}:variant_`));
  events[`${NS}:hunt_carcass`] = {
    sequence: [
      { filters: { test: 'is_baby', subject: 'self', value: true }, add: { component_groups: [`${NS}:hunt_young`] } },
      { remove: { component_groups: life }, add: { component_groups: [`${NS}:hunt_carcass`] }, set_property: { [state]: HUNT.carcass } },
    ],
  };
  events[`${NS}:hunt_revive`] = { add: { component_groups: [`${NS}:hunt_alive`] } };
  events[`${NS}:hunt_field_dress`] = {};
  events[`${NS}:hunt_rot`] = { add: { component_groups: [`${NS}:hunt_despawn`] } };
  events[`${NS}:hunt_lure`] = { add: { component_groups: [`${NS}:hunt_lured`] } };
  events[`${NS}:hunt_unlure`] = { remove: { component_groups: [`${NS}:hunt_lured`] } };
  addDamageTrigger(components, { on_damage: { filters: stateIs('==', HUNT.carcass) }, deals_damage: 'no' }, true);
}

export function buildEntity(a) {
  const components = baseComponents(a);
  const groups = { ...lifeGroups(a), ...(a.tame ? tameGroups(a) : {}), ...(a.extraGroups ?? {}) };
  const properties = { ...(a.properties ?? {}) };
  const sensorTriggers = [];

  const sleeps = a.sleeps ?? 'never';
  const activeByDay = sleeps !== 'day';
  sensorTriggers.push(
    { filters: { test: 'is_daytime', value: activeByDay }, event: `${NS}:become_active` },
    { filters: { test: 'is_daytime', value: !activeByDay }, event: `${NS}:become_resting` },
  );

  // Fish swim weightless in water; stranded on land they drop and flop about (the client
  // shows the flop animation from aquatic:stranded, scripts/behaviours.js makes them hop).
  if (a.movement === 'swim') {
    const stranded = `${NS}:stranded`;
    properties[stranded] = { type: 'bool', default: false, client_sync: true };
    const is = (value) => ({ test: 'bool_property', subject: 'self', domain: stranded, operator: '==', value });
    groups[`${NS}:in_water`] = { 'minecraft:physics': { has_gravity: false } };
    groups[`${NS}:stranded`] = { 'minecraft:physics': { has_gravity: true } };
    sensorTriggers.push(
      { filters: { all_of: [{ test: 'in_water', subject: 'self', value: true }, is(true)] }, event: `${NS}:enter_water` },
      { filters: { all_of: [{ test: 'in_water', subject: 'self', value: false }, is(false)] }, event: `${NS}:leave_water` },
    );
  }

  if (a.rideFin) Object.assign(components, rideComponents(a));
  if (a.tame) {
    // Wild seals despawn like other animals, tamed ones stay.
    groups[`${NS}:wild`]['minecraft:despawn'] = components['minecraft:despawn'];
    delete components['minecraft:despawn'];
    delete groups[`${NS}:tamed`]['minecraft:despawn'];
  }

  components['minecraft:environment_sensor'] = { triggers: sensorTriggers };
  Object.assign(components, a.extraComponents ?? {});

  const adult = [`${NS}:adult`, ...(a.tame ? [`${NS}:wild`] : [])];
  const startWater = a.movement === 'swim' ? [`${NS}:in_water`] : [];
  const events = {
    'minecraft:entity_spawned': {
      sequence: [
        {
          randomize: a.babies === false ? [{ weight: 1, add: { component_groups: adult } }] : [
            { weight: 85, add: { component_groups: adult } },
            { weight: 15, add: { component_groups: [`${NS}:baby`] } },
          ],
        },
        { add: { component_groups: [`${NS}:active`, ...startWater] } },
        ...(a.variants ? [{ randomize: a.variants.map((v, i) => ({ weight: v.weight ?? 1, add: { component_groups: [`${NS}:variant_${i}`] } })) }] : []),
      ],
    },
    [`${NS}:entity_born`]: { add: { component_groups: [`${NS}:baby`, `${NS}:active`, ...startWater] } },
    [`${NS}:spawn_adult`]: { add: { component_groups: [...adult, `${NS}:active`, ...startWater] } },
    [`${NS}:from_bucket`]: { add: { component_groups: [`${NS}:adult`, `${NS}:active`, ...startWater] } },
    [`${NS}:grow_up`]: { remove: { component_groups: [`${NS}:baby`] }, add: { component_groups: adult } },
    [`${NS}:become_active`]: { remove: { component_groups: [`${NS}:resting`] }, add: { component_groups: [`${NS}:active`] } },
    [`${NS}:become_resting`]: { remove: { component_groups: [`${NS}:active`] }, add: { component_groups: [`${NS}:resting`] } },
  };
  if (a.movement === 'swim') {
    events[`${NS}:enter_water`] = { remove: { component_groups: [`${NS}:stranded`] }, add: { component_groups: [`${NS}:in_water`] }, set_property: { [`${NS}:stranded`]: false } };
    events[`${NS}:leave_water`] = { remove: { component_groups: [`${NS}:in_water`] }, add: { component_groups: [`${NS}:stranded`] }, set_property: { [`${NS}:stranded`]: true } };
  }
  if (a.tame) {
    events[`${NS}:on_tame`] = { remove: { component_groups: [`${NS}:wild`] }, add: { component_groups: [`${NS}:tamed`] } };
  }
  if (a.variants) {
    a.variants.forEach((v, i) => {
      groups[`${NS}:variant_${i}`] = { 'minecraft:variant': { value: i } };
      events[`${NS}:make_variant_${i}`] = {
        remove: { component_groups: a.variants.map((_, j) => `${NS}:variant_${j}`).filter((_, j) => j !== i) },
        add: { component_groups: [`${NS}:variant_${i}`] },
      };
    });
  }
  Object.assign(events, a.extraEvents ?? {});
  if (isHuntable(a)) huntingHooks(a, components, groups, events, properties);

  return {
    format_version: '1.21.90',
    'minecraft:entity': {
      description: {
        identifier: `${NS}:${a.id}`,
        spawn_category: isWaterOnly(a) ? 'water_creature' : 'creature',
        is_spawnable: true,
        is_summonable: true,
        ...(Object.keys(properties).length ? { properties } : {}),
      },
      component_groups: groups,
      components,
      events,
    },
  };
}

export const isWaterOnly = (a) => (a.spawn ?? []).length > 0 && a.spawn.every((s) => s.water);

/** Group spawning. Variant species spawn single-variant groups. */
function herd(a, s) {
  const size = { min_size: s.group?.[0] ?? 1, max_size: s.group?.[1] ?? 1 };
  if (a.variants && !a.variantsMixed) return a.variants.map((v, i) => ({ ...size, event: `${NS}:make_variant_${i}` }));
  return size;
}

export function buildSpawnRules(a) {
  const conditions = (a.spawn ?? []).map((s) => {
    const biomes = s.biomes.map(biomeTest);
    const cond = {
      'minecraft:spawns_on_surface': {},
      ...(s.blocks ? { 'minecraft:spawns_on_block_filter': s.blocks.map(itemId) } : {}),
      'minecraft:brightness_filter': { min: 7, max: 15, adjust_for_weather: false },
      'minecraft:weight': { default: s.weight ?? 5 },
      'minecraft:herd': herd(a, s),
      'minecraft:density_limit': { surface: s.density ?? 4 },
      'minecraft:biome_filter': biomes.length === 1 ? biomes[0] : { any_of: biomes },
    };
    if (s.water) {
      delete cond['minecraft:spawns_on_surface'];
      delete cond['minecraft:brightness_filter'];
      delete cond['minecraft:spawns_on_block_filter'];
      cond['minecraft:spawns_underwater'] = {};
      cond['minecraft:density_limit'] = { underwater: s.density ?? 6 };
      cond['minecraft:height_filter'] = { min: s.height?.[0] ?? 40, max: s.height?.[1] ?? 62 };
    }
    return cond;
  });
  return {
    format_version: '1.8.0',
    'minecraft:spawn_rules': {
      description: { identifier: `${NS}:${a.id}`, population_control: isWaterOnly(a) ? 'water_animal' : 'animal' },
      conditions,
    },
  };
}

export function buildLoot(a) {
  const pools = (a.loot ?? []).map((l) => {
    const functions = [{ function: 'set_count', count: { min: l.min ?? 0, max: l.max ?? 1 } }];
    if (l.smelts) functions.push({ function: 'furnace_smelt', conditions: [{ condition: 'entity_properties', entity: 'this', properties: { on_fire: true } }] });
    functions.push({ function: 'looting_enchant', count: { min: 0, max: 1 } });
    return {
      rolls: 1,
      ...(l.chance ? { conditions: [{ condition: 'random_chance_with_looting', chance: l.chance, looting_multiplier: 0.05 }] } : {}),
      entries: [{ type: 'item', name: itemId(l.item), weight: 1, functions }],
    };
  });
  return { pools };
}
