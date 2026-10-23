// Fishing with the Angler's Rod and the Sea Rod. Use the rod to cast a bobber; when it dips,
// use the rod again to strike. Then fight the fish: hold sneak to reel in, let go when the line
// gets tight. What bites depends on the biome, the depth of the water and the time of day (the
// catch table is in src/fishing.mjs and shared with the Java mod).
import { ItemStack, system, world } from '@minecraft/server';
import { CATCHES, FIGHT, HABITAT_BIOMES, JUNK, RODS, SPECIES, TREASURE } from './data.js';
import { give, records, saveRecords } from './util.js';

/** Active casts by player id: { bobber, rod, state, waitUntil, biteUntil, fish, ... }. */
const casts = new Map();

const isRod = (stack) => stack && RODS[stack.typeId.replace('aquatic:', '')] && stack.typeId.startsWith('aquatic:');
const rodOf = (stack) => stack.typeId.replace('aquatic:', '');
const mainhand = (player) => player.getComponent('minecraft:equippable')?.getEquipment('Mainhand');
const add = (a, b, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const rand = (min, max) => min + Math.random() * (max - min);

function say(player, key, ...with_) {
  player.onScreenDisplay.setActionBar({ rawtext: [{ translate: key, with: { rawtext: with_ } }] });
}

// ------------------------------------------------------------------ where are we fishing?

/** Habitat keys for the water under the bobber. */
function habitatsAt(bobber) {
  let id = '';
  try {
    id = bobber.dimension.getBiome(bobber.location).id.replace('minecraft:', '');
  } catch {
    return ['lakes'];
  }
  const out = Object.entries(HABITAT_BIOMES).filter(([, ids]) => ids.includes(id)).map(([k]) => k);
  return out.length ? out : ['lakes'];
}

function depthAt(bobber) {
  const loc = { x: Math.floor(bobber.location.x), y: Math.floor(bobber.location.y), z: Math.floor(bobber.location.z) };
  let depth = 0;
  for (let y = loc.y; y > loc.y - 64; y--) {
    let block;
    try { block = bobber.dimension.getBlock({ ...loc, y }); } catch { break; }
    if (!block) break;
    if (block.typeId === 'minecraft:water' || block.isWaterlogged) depth++;
    else if (depth > 0 || !block.isAir) break;
  }
  return depth;
}

function timeOfDay() {
  const t = world.getTimeOfDay();
  if (t >= 1000 && t < 11500) return 'day';
  if (t >= 13500 && t < 22500) return 'night';
  return 'dusk';
}

/** Pick what bites: junk, treasure or a fish from the catch table. */
function pickCatch(cast) {
  const rod = RODS[cast.rod];
  const r = Math.random();
  if (r < rod.treasure) return { kind: 'treasure', item: `minecraft:${TREASURE[Math.floor(Math.random() * TREASURE.length)]}` };
  if (r < rod.treasure + rod.junk) return { kind: 'junk', item: `minecraft:${JUNK[Math.floor(Math.random() * JUNK.length)]}` };
  const habitats = habitatsAt(cast.bobber);
  const depth = depthAt(cast.bobber);
  const now = timeOfDay();
  const options = CATCHES.filter((c) => c.biomes.some((b) => habitats.includes(b)) && depth >= c.depth[0] && depth <= c.depth[1]);
  if (!options.length) return { kind: 'junk', item: 'minecraft:kelp' };
  const weights = options.map((c) => c.rarity * (c.time === 'any' ? 1 : c.time === now ? 2 : 0.5));
  let roll = Math.random() * weights.reduce((s, w) => s + w, 0);
  const c = options.find((_, i) => (roll -= weights[i]) <= 0) ?? options[0];
  return { kind: 'fish', catch: c, item: c.id.includes(':') ? c.id : `aquatic:${c.id}` };
}

// ------------------------------------------------------------------ casting and striking

function cast(player, stack) {
  const view = player.getViewDirection();
  const at = add(player.getHeadLocation(), view, 1);
  let bobber;
  try {
    bobber = player.dimension.spawnEntity('aquatic:bobber', at);
    bobber.applyImpulse({ x: view.x * 0.9, y: view.y * 0.9 + 0.2, z: view.z * 0.9 });
  } catch {
    return;
  }
  player.dimension.playSound('random.bow', player.location, { pitch: 0.6, volume: 0.5 });
  const now = system.currentTick;
  casts.set(player.id, { player, bobber, rod: rodOf(stack), state: 'flying', since: now });
}

function reelIn(player, c) {
  try { c.bobber.remove(); } catch {}
  casts.delete(player.id);
}

function strike(player, c) {
  const pick = pickCatch(c);
  c.bobber.setProperty('aquatic:dip', false);
  if (pick.kind !== 'fish') {
    land(player, c, pick);
    return;
  }
  const fight = pick.catch.fight;
  if (fight > RODS[c.rod].maxFight) {
    // Too strong: it snaps the light line straight away.
    say(player, 'aquatic.fishing.too_strong');
    player.dimension.playSound('random.break', player.location);
    wearRod(player, 2);
    reelIn(player, c);
    return;
  }
  Object.assign(c, {
    state: 'fight', pick, tension: 20, line: dist(player.location, c.bobber.location),
    stamina: FIGHT.stamina + FIGHT.staminaPerFight * fight, burst: 0,
  });
  say(player, 'aquatic.fishing.hooked');
  player.dimension.playSound('random.splash', c.bobber.location, { pitch: 0.8 });
}

/** The fish (or junk) is landed: hand it over, record it, wear the rod. */
function land(player, c, pick) {
  const stack = new ItemStack(pick.item, 1);
  if (pick.kind === 'fish') {
    const [min, max] = pick.catch.weight;
    const kg = min + (max - min) * Math.random() ** 2;
    const text = kg < 1 ? kg.toFixed(2) : kg.toFixed(1);
    const id = pick.item.replace('aquatic:', '');
    const species = pick.item.startsWith('aquatic:') ? id : null;
    // Small fish go straight into a water bucket in the off hand.
    const equip = player.getComponent('minecraft:equippable');
    const off = equip?.getEquipment('Offhand');
    if (species && SPECIES[species]?.bucket && off?.typeId === 'minecraft:water_bucket') {
      equip.setEquipment('Offhand', new ItemStack(`aquatic:${species}_bucket`, 1));
      player.dimension.playSound('bucket.fill_fish', player.location);
    } else {
      stack.setLore([`§7${text} kg`]);
      give(player, stack);
    }
    const name = species ? { translate: `entity.aquatic:${species}.name` } : { translate: stack.localizationKey };
    say(player, 'aquatic.fishing.caught', name, { text });
    player.dimension.playSound('random.orb', player.location, { pitch: 1.2 });
    if (species) {
      const rec = records(player);
      if (!rec.seen.includes(species)) rec.seen.push(species);
      if (!(rec.caught[species] >= kg)) {
        if (rec.caught[species] !== undefined) system.runTimeout(() => say(player, 'aquatic.fishing.record'), 40);
        rec.caught[species] = Math.round(kg * 100) / 100;
      }
      saveRecords(player, rec);
    }
  } else {
    give(player, stack);
    say(player, pick.kind === 'treasure' ? 'aquatic.fishing.treasure' : 'aquatic.fishing.junk');
  }
  wearRod(player, 1);
  reelIn(player, c);
}

function wearRod(player, amount) {
  const equip = player.getComponent('minecraft:equippable');
  const stack = equip?.getEquipment('Mainhand');
  if (!isRod(stack)) return;
  const d = stack.getComponent('minecraft:durability');
  if (!d) return;
  if (d.damage + amount >= d.maxDurability) {
    equip.setEquipment('Mainhand', undefined);
    player.dimension.playSound('random.break', player.location);
    return;
  }
  d.damage += amount;
  equip.setEquipment('Mainhand', stack);
}

// ------------------------------------------------------------------ every tick

function tension(c, fight, sneaking) {
  const rod = RODS[c.rod];
  if (c.burst > 0) c.burst--;
  else if (Math.random() < FIGHT.burstChance * fight && c.stamina > 0) c.burst = FIGHT.burstMin + Math.floor(Math.random() * (FIGHT.burstMax - FIGHT.burstMin));
  const tired = c.stamina <= 0;
  const pull = tired ? FIGHT.tiredPull * fight : fight * (0.6 + Math.random()) * (c.burst > 0 ? 2 : 1);
  if (sneaking) {
    c.tension += FIGHT.base + pull * rod.strain;
    c.line -= rod.reel;
    c.stamina -= FIGHT.drainReel;
  } else {
    c.tension = Math.max(0, c.tension - FIGHT.relax);
    c.line += pull * FIGHT.takeLine;
    c.stamina -= FIGHT.drainIdle;
  }
}

function bar(value) {
  const n = Math.round(Math.max(0, Math.min(100, value)) / 10);
  const colour = value > 80 ? '§c' : value > 55 ? '§6' : '§a';
  return `${colour}${'|'.repeat(n)}§8${'|'.repeat(10 - n)}§r`;
}

/** Draw the fishing line from the rod tip to the bobber with tiny particles. */
function drawLine(player, bobber) {
  const head = player.getHeadLocation();
  const view = player.getViewDirection();
  const tip = add(add(head, view, 1.2), { x: 0, y: 0.4, z: 0 });
  const end = bobber.location;
  const d = dist(tip, end);
  const n = Math.min(24, Math.ceil(d * 1.5));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const sag = Math.sin(t * Math.PI) * Math.min(1.5, d * 0.08);
    try {
      player.dimension.spawnParticle('aquatic:line', { x: tip.x + (end.x - tip.x) * t, y: tip.y + (end.y - tip.y) * t - sag, z: tip.z + (end.z - tip.z) * t });
    } catch {}
  }
}

function tick() {
  const now = system.currentTick;
  for (const [id, c] of casts) {
    const { player, bobber } = c;
    if (!player.isValid || !bobber.isValid) { casts.delete(id); try { bobber.remove(); } catch {} continue; }
    const rod = mainhand(player);
    if (!isRod(rod) || dist(player.location, bobber.location) > FIGHT.maxLine + 8 || player.dimension.id !== bobber.dimension.id) {
      reelIn(player, c);
      continue;
    }
    if (now % 2 === 0) drawLine(player, bobber);

    switch (c.state) {
      case 'flying':
        if (bobber.isInWater) {
          c.state = 'waiting';
          c.waitUntil = now + FIGHT.waitMin + Math.floor(Math.random() * (FIGHT.waitMax - FIGHT.waitMin));
          bobber.dimension.playSound('random.splash', bobber.location, { pitch: 1.6, volume: 0.4 });
        }
        break;
      case 'waiting':
        if (!bobber.isInWater) break;
        if (now >= c.waitUntil) {
          c.state = 'bite';
          c.biteUntil = now + FIGHT.biteWindow;
          bobber.setProperty('aquatic:dip', true);
          bobber.dimension.playSound('random.splash', bobber.location, { pitch: 1.2 });
          try { bobber.dimension.spawnParticle('minecraft:water_splash_particle_manual', bobber.location); } catch {}
          say(player, 'aquatic.fishing.bite');
        } else if (Math.random() < 0.01) {
          try { bobber.dimension.spawnParticle('minecraft:basic_bubble_particle_manual', bobber.location); } catch {}
        }
        break;
      case 'bite':
        if (now > c.biteUntil) {
          bobber.setProperty('aquatic:dip', false);
          c.state = 'waiting';
          c.waitUntil = now + FIGHT.waitMin + Math.floor(Math.random() * (FIGHT.waitMax - FIGHT.waitMin));
          say(player, 'aquatic.fishing.missed');
        }
        break;
      case 'fight': {
        const fight = c.pick.catch.fight;
        tension(c, fight, player.isSneaking);
        // The bobber follows the fish along the line.
        const dir = { x: bobber.location.x - player.location.x, z: bobber.location.z - player.location.z };
        const flat = Math.hypot(dir.x, dir.z) || 1;
        const target = { x: player.location.x + (dir.x / flat) * c.line, y: bobber.location.y, z: player.location.z + (dir.z / flat) * c.line };
        try { bobber.teleport(target); } catch {}
        if (now % 4 === 0) {
          player.onScreenDisplay.setActionBar({ rawtext: [{ translate: 'aquatic.fishing.tension' }, { text: ` ${bar(c.tension)}  ` }, { translate: 'aquatic.fishing.distance', with: [String(Math.max(0, Math.round(c.line)))] }] });
          if (c.burst > 0) bobber.dimension.playSound('random.splash', bobber.location, { pitch: 1.4, volume: 0.5 });
        }
        if (c.tension >= 100) {
          say(player, 'aquatic.fishing.snapped');
          player.dimension.playSound('random.break', player.location);
          wearRod(player, 2);
          reelIn(player, c);
        } else if (c.line >= FIGHT.maxLine) {
          say(player, 'aquatic.fishing.escaped');
          reelIn(player, c);
        } else if (c.line <= FIGHT.landAt) {
          land(player, c, c.pick);
        }
        break;
      }
    }
  }
}

export function setupFishing() {
  world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
    if (!isRod(itemStack)) return;
    const c = casts.get(player.id);
    if (!c) cast(player, itemStack);
    else if (c.state === 'bite') strike(player, c);
    else if (c.state !== 'fight') reelIn(player, c);
  });
  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    const c = casts.get(playerId);
    if (c) { try { c.bobber.remove(); } catch {} casts.delete(playerId); }
  });
  system.runInterval(tick, 1);
  // Bobbers left over from before a reload belong to nobody.
  system.runInterval(() => {
    const live = new Set([...casts.values()].map((c) => c.bobber.id));
    for (const dim of ['overworld', 'nether', 'the_end']) {
      let found = [];
      try { found = world.getDimension(dim).getEntities({ type: 'aquatic:bobber' }); } catch {}
      for (const b of found) if (!live.has(b.id)) try { b.remove(); } catch {}
    }
  }, 100);
}
