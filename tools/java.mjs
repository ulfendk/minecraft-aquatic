// Generates the Java edition's resources (java/src/generated/resources) from the same specs
// as the Bedrock packs. GeckoLib reads the Bedrock geometry and animation formats directly,
// so models and animations are shared as-is.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { huntingProfile } from '../src/hunting.mjs';
import { NS } from '../src/lib/constants.mjs';
import { hitbox, isHuntable } from '../src/lib/behavior.mjs';
import { eggIcon } from '../src/lib/texture.mjs';
import { CATCHES, FIGHT, HABITAT_BIOMES, JUNK, RODS, TREASURE, VANILLA_ROD } from '../src/fishing.mjs';

const BEDROCK_TO_JAVA_SOUNDS = {
  'mob.fish.hurt': 'entity.cod.hurt', 'mob.fish.death': 'entity.cod.death', 'mob.fish.flop': 'entity.cod.flop',
  'mob.dolphin.idle': 'entity.dolphin.ambient', 'mob.dolphin.idle_water': 'entity.dolphin.ambient_water',
  'mob.dolphin.hurt': 'entity.dolphin.hurt', 'mob.dolphin.death': 'entity.dolphin.death',
  'mob.elderguardian.idle': 'entity.elder_guardian.ambient',
  'mob.polarbear_baby.idle': 'entity.polar_bear.ambient_baby', 'mob.polarbear.idle': 'entity.polar_bear.ambient',
  'mob.polarbear.hurt': 'entity.polar_bear.hurt', 'mob.polarbear.death': 'entity.polar_bear.death',
  'mob.hoglin.ambient': 'entity.hoglin.ambient', 'mob.hoglin.hurt': 'entity.hoglin.hurt', 'mob.hoglin.death': 'entity.hoglin.death',
  'mob.horse.donkey.idle': 'entity.donkey.ambient', 'mob.parrot.hurt': 'entity.parrot.hurt', 'mob.parrot.death': 'entity.parrot.death',
};
/** Vanilla mobs our hunters go after (Bedrock family -> Java entity id). */
const VANILLA_PREY = { cod: 'minecraft:cod', salmon: 'minecraft:salmon', tropicalfish: 'minecraft:tropical_fish', squid: 'minecraft:squid', glow_squid: 'minecraft:glow_squid' };

const javaItem = (id) => (id.includes(':') ? id : `minecraft:${id}`);
const javaSound = (s) => {
  if (!s) return null;
  const j = BEDROCK_TO_JAVA_SOUNDS[s];
  if (!j) throw new Error(`No Java sound mapped for Bedrock sound "${s}" (tools/java.mjs)`);
  return `minecraft:${j}`;
};

async function write(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2) + '\n');
}

/** Turn the Bedrock-style hunting/flee families into concrete entity ids. */
function resolveTargets(families, animals) {
  const out = new Set();
  for (const f of families ?? []) {
    for (const a of animals) if (a.id === f || (a.family ?? []).includes(f)) out.add(`${NS}:${a.id}`);
    if (VANILLA_PREY[f]) out.add(VANILLA_PREY[f]);
  }
  return [...out];
}

function hostileRule(a) {
  if (!a.hostile) return null;
  let when = 'always';
  for (const f of a.hostile.filters ?? []) if (f.test === 'in_water' && f.subject === 'other') when = 'in_water';
  if (when === 'in_water' && (a.hostile.filters ?? []).some((f) => f.test === 'actor_health')) when = 'in_water_hurt';
  return { range: a.hostile.range ?? 8, when };
}

/** Species data read by the Java mod at startup (dk.ulfen.aquatic.species.Species). */
function speciesRecord(a, animals, animNames) {
  const s = a.sounds ?? {};
  const k = a.scale ?? 1;
  return {
    id: a.id,
    kind: ['swim', 'cetacean'].includes(a.movement) ? 'swimmer' : 'amphibian',
    group: a.group,
    width: Math.round((hitbox(a)[0] / k) * 1000) / 1000,
    height: Math.round((hitbox(a)[1] / k) * 1000) / 1000,
    health: a.health,
    speed: a.speed,
    swimSpeed: a.swimSpeed ?? 0.12,
    attackDamage: a.attack?.damage ?? 0,
    attackSpeed: a.attack?.speed ?? 1.3,
    knockbackResistance: a.knockbackResistance ?? 0,
    alertsPack: !!a.alertsPack,
    hunts: resolveTargets(a.hunts, animals),
    huntInterval: a.huntInterval ?? 30,
    huntRange: a.huntRange ?? 16,
    fleesFrom: resolveTargets(a.fleesFrom, animals),
    fleeDistance: a.fleeDistance ?? 10,
    fleeSpeed: a.fleeSpeed ?? 1.6,
    panicSpeed: a.panicSpeed ?? 1.5,
    hostile: hostileRule(a),
    sleeps: a.sleeps ?? 'never',
    movement: a.movement,
    school: !!a.school,
    bottom: !!a.bottom,
    bucket: !!a.bucket,
    poisonous: !!a.poisonous,
    huntable: isHuntable(a),
    breath: (a.breath ?? 300) * 20,
    breaches: a.breaches ?? 0,
    followsSwimmers: !!a.followsSwimmers,
    babies: a.babies !== false,
    babyScale: a.babyScale ?? 0.5,
    scale: k,
    roam: a.roam ?? 16,
    breed: (a.breed ?? []).map(javaItem),
    tempt: (a.tempt ?? a.breed ?? []).map(javaItem),
    tame: a.tame ? { items: a.tame.items.map(javaItem), chance: a.tame.chance ?? 0.33, damage: a.tame.damage ?? 3 } : null,
    rideHeight: a.rideFin ? a.rideFin.seat[1] : 0,
    rideOffset: a.rideFin ? a.rideFin.seat[2] : 0,
    sounds: {
      ambient: javaSound(s.ambient), hurt: javaSound(s.hurt), death: javaSound(s.death),
      pitchMin: (s.pitch ?? [1, 1])[0], pitchMax: (s.pitch ?? [1, 1])[1], interval: s.interval ?? 10,
    },
    animations: animNames,
    runSpeed: a.client?.runSpeed ?? 4,
    spawns: (a.spawn ?? []).map((sp) => ({
      biomes: sp.biomes, weight: sp.weight ?? 5, min: sp.group?.[0] ?? 1, max: sp.group?.[1] ?? 1, water: !!sp.water,
      minY: sp.height?.[0] ?? -64, maxY: sp.height?.[1] ?? 320,
    })),
    egg: a.egg,
  };
}

function lootTable(a) {
  return {
    type: 'minecraft:entity',
    pools: (a.loot ?? []).map((l) => ({
      rolls: 1,
      ...(l.chance ? { conditions: [{ condition: 'minecraft:random_chance', chance: l.chance }] } : {}),
      entries: [{
        type: 'minecraft:item',
        name: javaItem(l.item),
        functions: [
          { function: 'minecraft:set_count', count: { type: 'minecraft:uniform', min: l.min ?? 0, max: l.max ?? 1 } },
          ...(l.smelts ? [{ function: 'minecraft:furnace_smelt', conditions: [{ condition: 'minecraft:entity_properties', entity: 'this', predicate: { flags: { is_on_fire: true } } }] }] : []),
          { function: 'minecraft:enchanted_count_increase', enchantment: 'minecraft:looting', count: { type: 'minecraft:uniform', min: 0, max: 1 } },
        ],
      }],
    })),
  };
}

const ingredient = (i) => (i.tag ? `#${i.tag}` : javaItem(i.item));

/** Bedrock recipe -> Java recipe files. */
function javaRecipes(recipe) {
  const [type, body] = Object.entries(recipe)[0];
  const name = body.description.identifier.split(':')[1];
  const result = (r) => ({ id: javaItem(r.item), count: r.count ?? 1 });
  if (type === 'minecraft:recipe_shaped') {
    return [[name, {
      type: 'minecraft:crafting_shaped', category: 'misc', pattern: body.pattern,
      key: Object.fromEntries(Object.entries(body.key).map(([k, v]) => [k, ingredient(v)])),
      result: result(body.result),
    }]];
  }
  if (type === 'minecraft:recipe_shapeless') {
    return [[name, {
      type: 'minecraft:crafting_shapeless', category: 'misc',
      ingredients: body.ingredients.flatMap((i) => Array.from({ length: i.count ?? 1 }, () => ingredient(i))),
      result: result(body.result),
    }]];
  }
  if (type === 'minecraft:recipe_furnace') {
    const base = { ingredient: javaItem(body.input), result: { id: javaItem(body.output) } };
    const out = [];
    if (body.tags.includes('furnace')) out.push([name, { type: 'minecraft:smelting', category: 'food', ...base, experience: 0.35, cookingtime: 200 }]);
    if (body.tags.includes('smoker')) out.push([body.tags.length === 1 ? name : `${name}_from_smoking`, { type: 'minecraft:smoking', category: 'food', ...base, experience: 0.35, cookingtime: 100 }]);
    if (body.tags.includes('campfire')) out.push([`${name}_from_campfire`, { type: 'minecraft:campfire_cooking', category: 'food', ...base, experience: 0.35, cookingtime: 600 }]);
    return out;
  }
  throw new Error(`Unknown recipe type ${type}`);
}

/** Habitat keys -> Java biome ids (the Bedrock-only aliases are dropped). */
const JAVA_BIOMES = new Set([
  'river', 'frozen_river', 'swamp', 'mangrove_swamp', 'ocean', 'deep_ocean', 'warm_ocean', 'lukewarm_ocean', 'deep_lukewarm_ocean',
  'cold_ocean', 'deep_cold_ocean', 'frozen_ocean', 'deep_frozen_ocean', 'beach', 'stony_shore', 'snowy_beach', 'ice_spikes',
]);

export async function buildJava({ animals, geos, anims, textures, items, recipes, langs, icon, OUT }) {
  const R = OUT;
  await rm(R, { recursive: true, force: true });
  const A = join(R, 'assets', NS);
  const D = join(R, 'data', NS);

  const species = [];
  for (const a of animals) {
    await write(join(A, 'geckolib', 'models', 'entity', `${a.id}.geo.json`), geos[a.id]);
    await write(join(A, 'geckolib', 'animations', 'entity', `${a.id}.animation.json`), anims[a.id]);
    await write(join(A, 'textures', 'entity', `${a.id}.png`), textures[a.id]);
    await write(join(A, 'textures', 'item', `${a.id}_spawn_egg.png`), eggIcon(a.egg[0], a.egg[1], a.id.length));
    await itemModel(A, `${a.id}_spawn_egg`, 'minecraft:item/generated');
    await write(join(D, 'loot_table', 'entities', `${a.id}.json`), lootTable(a));
    species.push(speciesRecord(a, animals, Object.keys(a.anims)));
  }
  await write(join(D, 'species.json'), species);

  // Fishing: the same catch table as Bedrock, with Java biome ids.
  const habitats = Object.fromEntries(Object.entries(HABITAT_BIOMES).map(([k, ids]) => [k, ids.filter((id) => JAVA_BIOMES.has(id)).map((id) => `minecraft:${id}`)]));
  await write(join(D, 'fishing.json'), {
    catches: CATCHES.map((c) => ({ ...c, id: javaItem(c.id.includes(':') ? c.id : `${NS}:${c.id}`) })),
    rods: RODS, fight: FIGHT, habitats,
    junk: JUNK.map(javaItem), treasure: TREASURE.map(javaItem),
    vanillaRod: Object.entries(VANILLA_ROD).map(([id, weight]) => ({ item: `${NS}:${id}`, weight })),
  });

  // Realistic Hunting picks these up from every mod's hunting/targets/ (fish and sharks only).
  await write(join(R, 'hunting', 'targets', `${NS}.json`), animals.filter(isHuntable).map((a) => {
    const { bedrock, icon: _icon, entry, ...p } = huntingProfile(a, { name: `entity.${NS}.${a.id}` });
    const s = a.sounds ?? {};
    return {
      ...p,
      sounds: { warn: javaSound(s.ambient), death: javaSound(s.death), pitch: s.pitch ?? [1, 1] },
      loot: p.loot.map((l) => ({ ...l, item: javaItem(l.item) })),
    };
  }));

  // Item definitions the Java mod registers (dk.ulfen.aquatic.AquaticRegistry).
  await write(join(D, 'items.json'), items.map((i) => ({
    id: i.id, stack: i.stack ?? 64, food: i.food ? [i.food.nutrition, i.food.saturation] : null, bowl: !!i.bowl,
    rod: i.rod ? i.id : null, durability: i.durability ?? 0, bucketOf: i.bucketOf ?? null,
  })));
  for (const item of items) {
    await write(join(A, 'textures', 'item', `${item.id}.png`), item.icon);
    await itemModel(A, item.id, item.rod ? 'minecraft:item/handheld_rod' : 'minecraft:item/generated');
  }
  // Raw fish for the soup and sushi recipes, plus vanilla's.
  await write(join(D, 'tags', 'item', 'raw_fish.json'), {
    values: [...items.filter((i) => i.tags?.includes('aquatic:raw_fish')).map((i) => `${NS}:${i.id}`), 'minecraft:cod', 'minecraft:salmon'],
  });

  for (const recipe of recipes) for (const [name, body] of javaRecipes(recipe)) await write(join(D, 'recipe', `${name}.json`), body);

  // Language files: Bedrock keys -> Java keys.
  for (const [locale, entries] of Object.entries(langs)) {
    const out = {};
    for (const [k, v] of entries) {
      let m;
      if ((m = k.match(/^entity\.aquatic:(.+)\.name$/))) out[`entity.${NS}.${m[1]}`] = v;
      else if ((m = k.match(/^item\.spawn_egg\.entity\.aquatic:(.+)\.name$/))) out[`item.${NS}.${m[1]}_spawn_egg`] = v;
      else if ((m = k.match(/^item\.aquatic:(.+)\.name$/))) out[`item.${NS}.${m[1]}`] = v;
      else if (k.startsWith('aquatic.')) out[k] = v.replace(/§[0-9a-fk-or]/g, '');
    }
    out[`itemGroup.${NS}`] = locale === 'da_DK' ? 'Havets dyr' : 'Sea Life';
    await write(join(A, 'lang', `${locale.toLowerCase()}.json`), out);
  }

  await write(join(A, 'icon.png'), icon);
  return species.length;
}

async function itemModel(A, id, parent) {
  await write(join(A, 'models', 'item', `${id}.json`), { parent, textures: { layer0: `${NS}:item/${id}` } });
  await write(join(A, 'items', `${id}.json`), { model: { type: 'minecraft:model', model: `${NS}:item/${id}` } });
}
