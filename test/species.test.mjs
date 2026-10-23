// Unit tests for the species, fishing and item data (node --test).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadAnimals, loadItems } from '../tools/build.mjs';
import { CATCHES, HABITAT_BIOMES, RODS, VANILLA_ROD } from '../src/fishing.mjs';
import { hitbox, isHuntable } from '../src/lib/behavior.mjs';
import { buildGeometry } from '../src/lib/model.mjs';
import { langEntries, LOCALES } from '../src/lang.mjs';
import { BIOME_NAMES, GROUPS } from '../src/lib/info.mjs';

const animals = await loadAnimals();
const items = await loadItems(animals);
const itemIds = new Set(items.map((i) => i.id));

test('35 species in seven groups', () => {
  assert.equal(animals.length, 35);
  for (const a of animals) assert.ok(GROUPS[a.group], `${a.id}: unknown group ${a.group}`);
  for (const g of Object.keys(GROUPS)) assert.ok(animals.some((a) => a.group === g), `no species in group ${g}`);
});

test('every model builds into a texture of at most 512 pixels', () => {
  for (const a of animals) {
    const geo = buildGeometry(`geometry.aquatic.${a.id}`, a.model);
    assert.ok(geo.width <= 512 && geo.height <= 512, a.id);
  }
});

test('every catch is an item and lives in known waters', () => {
  for (const c of CATCHES) {
    if (!c.id.includes(':')) assert.ok(itemIds.has(c.id), `${c.id} is not an item`);
    for (const b of c.biomes) assert.ok(b === 'lakes' || HABITAT_BIOMES[b], `${c.id}: unknown habitat ${b}`);
    assert.ok(c.fight >= 1 && c.fight <= RODS.sea_rod.maxFight, `${c.id}: no rod can land it`);
    assert.ok(c.weight[0] < c.weight[1] && c.depth[0] <= c.depth[1], c.id);
  }
  for (const id of Object.keys(VANILLA_ROD)) assert.ok(itemIds.has(id), id);
});

test('every species lives somewhere we have a name for', () => {
  for (const a of animals) for (const s of a.spawn) for (const b of s.biomes) assert.ok(BIOME_NAMES[b], `${a.id}: ${b}`);
});

test('only small fish fit in a bucket, and each has its bucket item', () => {
  for (const a of animals.filter((x) => x.bucket)) {
    assert.equal(a.movement, 'swim', a.id);
    assert.ok(a.size[0] * (a.scale ?? 1) <= 0.6, `${a.id} is too big for a bucket`);
    assert.ok(itemIds.has(`${a.id}_bucket`), a.id);
  }
});

test('fish and sharks are game; seals, whales and penguins are protected', () => {
  for (const a of animals) {
    assert.equal(isHuntable(a), a.movement === 'swim', a.id);
    if (['seal', 'whale', 'penguin'].includes(a.group)) assert.equal(isHuntable(a), false, a.id);
  }
});

test('giants keep a hitbox that still paths', () => {
  for (const a of animals) {
    const [w, h] = hitbox(a);
    assert.ok(w <= 5 && h <= 3.5, `${a.id}: ${w}x${h}`);
  }
});

test('English and Danish have the same texts', () => {
  const pkg = { description: 'x', version: '0.0.0' };
  const [en, da] = LOCALES.map((l) => new Map(langEntries(l, { animals, items, ...pkg })));
  assert.deepEqual([...en.keys()].sort(), [...da.keys()].sort());
  for (const [k, v] of da) assert.ok(v, `da: empty ${k}`);
  for (const a of animals) assert.notEqual(da.get(`entity.aquatic:${a.id}.name`), a.name, `${a.id} has no Danish name`);
});
