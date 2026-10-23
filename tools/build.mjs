// Generates the behavior pack and resource pack into build/, and the Java mod's resources.
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { animationFile, deadPose } from '../src/lib/anim.mjs';
import { buildEntity, buildLoot, buildSpawnRules, isHuntable } from '../src/lib/behavior.mjs';
import { buildAnimationControllers, buildClientEntity, buildEntitySounds, buildRenderController } from '../src/lib/client.mjs';
import { MIN_ENGINE, NS, PACK_NAME, SCRIPT_SERVER_VERSION, SCRIPT_UI_VERSION } from '../src/lib/constants.mjs';
import { packIcon } from '../src/lib/icon.mjs';
import { langEntries, LOCALES, missingFoods } from '../src/lang.mjs';
import { guideEntry } from '../src/lib/info.mjs';
import { render } from './render.mjs';
import { buildJava } from './java.mjs';
import { buildGeometry } from '../src/lib/model.mjs';
import { paintTexture } from '../src/lib/texture.mjs';
import { bucketItems, buildItem, items as baseItems, recipes } from '../src/items.mjs';
import { huntingProfile } from '../src/hunting.mjs';
import { bobber, bobberAnimations, buildBobber, buildBobberClient } from '../src/bobber.mjs';
import { CATCHES, FIGHT, HABITAT_BIOMES, JUNK, RODS, TREASURE, VANILLA_ROD } from '../src/fishing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'build');
const BP = join(OUT, 'behavior_pack');
const RP = join(OUT, 'resource_pack');

const UUID = {
  bpHeader: '9b75dddd-08f4-480d-860d-3e1b9fa5da64',
  bpData: '6aa82455-e7a7-4bf3-afbe-16b5ced3b6ff',
  bpScript: '866a7014-663c-4bf5-b4fb-066590be2dee',
  rpHeader: 'b708f35a-006a-4981-90a5-3f934db849bc',
  rpResources: 'e50a6331-edb1-4963-bada-c0f9b91c3e7a',
};

const textureCache = new WeakMap();
function paintTextureCached(geo, a) {
  if (!textureCache.has(a)) textureCache.set(a, paintTexture(geo, a.materials));
  return textureCache.get(a);
}

async function write(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2) + '\n');
}

export async function loadAnimals() {
  const dir = join(ROOT, 'src', 'animals');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs')).sort();
  const animals = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    const a = mod.default;
    if (!a.model.bones.some((b) => b.name === 'root')) throw new Error(`${a.id}: the model needs a root bone`);
    if (!a.group) throw new Error(`${a.id}: no Fish Guide group`);
    // Realistic Hunting carcass pose (fish only; the others are protected).
    if (isHuntable(a)) a.anims.dead ??= deadPose(a.model);
    else delete a.anims.dead;
    animals.push(a);
  }
  linkFoodWeb(animals);
  return animals;
}

/** All items, including a bucket for every small fish. */
export async function loadItems(animals) {
  return [...baseItems, ...bucketItems(animals ?? (await loadAnimals()))];
}

/** Prey automatically flees from every species that hunts it. */
function linkFoodWeb(animals) {
  for (const prey of animals) {
    const families = new Set([prey.id, ...(prey.family ?? [])]);
    const hunters = animals.filter((p) => p !== prey && (p.hunts ?? []).some((h) => families.has(h)));
    prey.fleesFrom = [...new Set([...(prey.fleesFrom ?? []), ...hunters.map((h) => h.id)])];
  }
}

function manifests(version) {
  const v = version.split('.').map(Number);
  const bp = {
    format_version: 2,
    header: {
      name: `${PACK_NAME} v${version} (Behavior)`,
      description: 'pack.description',
      uuid: UUID.bpHeader,
      version: v,
      min_engine_version: MIN_ENGINE,
    },
    modules: [
      { type: 'data', uuid: UUID.bpData, version: v },
      { type: 'script', language: 'javascript', uuid: UUID.bpScript, version: v, entry: 'scripts/main.js' },
    ],
    dependencies: [
      { uuid: UUID.rpHeader, version: v },
      { module_name: '@minecraft/server', version: SCRIPT_SERVER_VERSION },
      { module_name: '@minecraft/server-ui', version: SCRIPT_UI_VERSION },
    ],
    metadata: { authors: [`${PACK_NAME} contributors`], license: 'MIT' },
  };
  const rp = {
    format_version: 2,
    header: {
      name: `${PACK_NAME} v${version} (Resources)`,
      description: 'pack.description',
      uuid: UUID.rpHeader,
      version: v,
      min_engine_version: MIN_ENGINE,
    },
    modules: [{ type: 'resources', uuid: UUID.rpResources, version: v }],
    dependencies: [{ uuid: UUID.bpHeader, version: v }],
    metadata: { authors: [`${PACK_NAME} contributors`], license: 'MIT' },
  };
  return { bp, rp };
}

/** The vanilla fishing rod's fish table, with some of our fish added (Bedrock overrides the file). */
function vanillaFishLoot() {
  const smelt = [{ function: 'furnace_smelt', conditions: [{ condition: 'entity_properties', entity: 'this', properties: { on_fire: true } }] }];
  return {
    pools: [{
      rolls: 1,
      entries: [
        { type: 'item', name: 'minecraft:cod', weight: 60, functions: smelt },
        { type: 'item', name: 'minecraft:salmon', weight: 25, functions: smelt },
        { type: 'item', name: 'minecraft:tropical_fish', weight: 2 },
        { type: 'item', name: 'minecraft:pufferfish', weight: 13 },
        ...Object.entries(VANILLA_ROD).map(([id, weight]) => ({ type: 'item', name: `${NS}:${id}`, weight, functions: smelt })),
      ],
    }],
  };
}

export async function build({ quiet = false } = {}) {
  const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
  await rm(BP, { recursive: true, force: true });
  await rm(RP, { recursive: true, force: true });

  // Hand-written files first; generated files may add to the same folders.
  await cp(join(ROOT, 'src', 'packs', 'behavior_pack'), BP, { recursive: true });
  await cp(join(ROOT, 'src', 'packs', 'resource_pack'), RP, { recursive: true });

  const { bp, rp } = manifests(pkg.version);
  await write(join(BP, 'manifest.json'), bp);
  await write(join(RP, 'manifest.json'), rp);
  const icon = packIcon();
  await write(join(BP, 'pack_icon.png'), icon);
  await write(join(RP, 'pack_icon.png'), icon);

  const animals = await loadAnimals();
  const items = await loadItems(animals);
  const java = { geos: {}, anims: {}, textures: {}, langs: {} };
  const entitySounds = {};
  const report = [];

  for (const a of animals) {
    // Behavior
    await write(join(BP, 'entities', `${a.id}.json`), buildEntity(a));
    await write(join(BP, 'spawn_rules', `${a.id}.json`), buildSpawnRules(a));
    await write(join(BP, 'loot_tables', 'entities', `${NS}_${a.id}.json`), buildLoot(a));

    // Model + texture
    const geo = buildGeometry(`geometry.${NS}.${a.id}`, a.model);
    const texture = paintTextureCached(geo, a);
    await write(join(RP, 'models', 'entity', `${a.id}.geo.json`), geo.geometry);
    await write(join(RP, 'textures', 'entity', NS, `${a.id}.png`), texture);
    java.geos[a.id] = geo.geometry;
    java.textures[a.id] = texture;

    // Animation
    const animNames = Object.keys(a.anims);
    const anims = animationFile(a.id, a.anims);
    await write(join(RP, 'animations', `${a.id}.animation.json`), anims);
    java.anims[a.id] = anims;
    await write(join(RP, 'animation_controllers', `${a.id}.animation_controllers.json`), buildAnimationControllers(a, animNames));
    await write(join(RP, 'entity', `${a.id}.entity.json`), buildClientEntity(a, animNames, a.egg));
    const boneNames = a.model.bones.map((b) => b.name);
    await write(join(RP, 'render_controllers', `${a.id}.render_controllers.json`), buildRenderController(a, boneNames));

    // Portrait for the Fish Guide.
    await write(join(RP, 'textures', 'ui', NS, `${a.id}.png`), render(geo.geometry, texture, { yaw: 35, size: 64 }));

    entitySounds[`${NS}:${a.id}`] = buildEntitySounds(a);
    report.push(`${a.id} (${geo.width}x${geo.height})`);
  }

  // The fishing bobber.
  {
    const geo = buildGeometry(`geometry.${NS}.bobber`, bobber.model);
    await write(join(BP, 'entities', 'bobber.json'), buildBobber());
    await write(join(RP, 'entity', 'bobber.entity.json'), buildBobberClient());
    await write(join(RP, 'models', 'entity', 'bobber.geo.json'), geo.geometry);
    await write(join(RP, 'textures', 'entity', NS, 'bobber.png'), paintTexture(geo, bobber.materials));
    await write(join(RP, 'animations', 'bobber.animation.json'), bobberAnimations);
    await write(join(RP, 'render_controllers', 'bobber.render_controllers.json'), {
      format_version: '1.8.0',
      render_controllers: { [`controller.render.${NS}.bobber`]: { geometry: 'Geometry.default', materials: [{ '*': 'Material.default' }], textures: ['Texture.default'] } },
    });
  }

  // Data for the scripts (Fish Guide, fishing, buckets, behaviours).
  const data = animals.map(guideEntry);
  const species = Object.fromEntries(animals.map((a) => [a.id, {
    movement: a.movement, group: a.group, bucket: !!a.bucket, tame: !!a.tame, ride: !!a.rideFin, poisonous: !!a.poisonous,
    spout: a.movement === 'cetacean' ? Math.round(hitboxHeight(a) * 10) / 10 : 0,
  }]));
  const itemIds = items.map((i) => `${NS}:${i.id}`);
  await write(join(BP, 'scripts', 'data.js'), [
    '// Generated by tools/build.mjs',
    `export const ANIMALS = ${JSON.stringify(data, null, 2)};`,
    `export const SPECIES = ${JSON.stringify(species)};`,
    `export const ITEMS = ${JSON.stringify(itemIds)};`,
    `export const CATCHES = ${JSON.stringify(CATCHES)};`,
    `export const RODS = ${JSON.stringify(RODS)};`,
    `export const FIGHT = ${JSON.stringify(FIGHT)};`,
    `export const HABITAT_BIOMES = ${JSON.stringify(HABITAT_BIOMES)};`,
    `export const JUNK = ${JSON.stringify(JUNK)};`,
    `export const TREASURE = ${JSON.stringify(TREASURE)};`,
    '',
  ].join('\n'));

  // Realistic Hunting target profiles (fish and sharks), sent to the hunting add-on when it's installed.
  const profiles = animals.filter(isHuntable).map((a) => huntingProfile(a));
  await write(join(BP, 'scripts', 'hunting_targets.js'), `// Generated by tools/build.mjs\nexport const PROFILES = ${JSON.stringify(profiles)};\n`);
  await cp(join(ROOT, 'tools', 'vendor', 'hunting-kit', 'protocol.js'), join(BP, 'scripts', 'hunting_protocol.js'));

  // The vanilla fishing rod catches some of our fish too.
  await write(join(BP, 'loot_tables', 'gameplay', 'fishing', 'fish.json'), vanillaFishLoot());

  // Items
  const itemTextures = {};
  for (const item of items) {
    await write(join(BP, 'items', `${item.id}.json`), buildItem(item));
    await write(join(RP, 'textures', 'items', NS, `${item.id}.png`), item.icon);
    itemTextures[`${NS}_${item.id}`] = { textures: `textures/items/${NS}/${item.id}` };
  }
  for (const recipe of recipes) {
    const body = Object.values(recipe)[0];
    const name = body.description.identifier.split(':')[1];
    await write(join(BP, 'recipes', `${name}.json`), { format_version: '1.12', ...recipe });
  }
  await write(join(RP, 'textures', 'item_texture.json'), {
    resource_pack_name: NS,
    texture_name: 'atlas.items',
    texture_data: itemTextures,
  });

  // Sounds: entity events point at vanilla sound definitions.
  await write(join(RP, 'sounds.json'), { entity_sounds: { entities: entitySounds } });

  // Language
  const missing = missingFoods(animals);
  if (missing.length) throw new Error(`Add translations for these foods in src/lang.mjs: ${missing.join(', ')}`);
  for (const locale of LOCALES) {
    const entries = langEntries(locale, {
      animals, items, extraEntities: [bobber], description: pkg.description, version: pkg.version,
    });
    java.langs[locale] = entries;
    const text = entries.map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
    for (const pack of [BP, RP]) await write(join(pack, 'texts', `${locale}.lang`), text);
  }
  for (const pack of [BP, RP]) await write(join(pack, 'texts', 'languages.json'), LOCALES);

  // Java edition resources
  const speciesCount = await buildJava({
    animals, ...java, items, recipes, icon,
    OUT: join(ROOT, 'java', 'src', 'generated', 'resources'),
  });

  if (!quiet) console.log(`Java: ${speciesCount} species written to java/src/generated/resources`);
  if (!quiet) console.log(`Built ${animals.length} animals: ${report.join(', ')}\nItems: ${items.map((i) => i.id).join(', ')}`);
  return { animals, items, version: pkg.version };
}

function hitboxHeight(a) {
  return a.size[1] * (a.scale ?? 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
