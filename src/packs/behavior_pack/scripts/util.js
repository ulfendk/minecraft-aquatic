import { world } from '@minecraft/server';

/**
 * True while Realistic Hunting has made a fish a carcass (aquatic:hunt_state 4): it floats
 * still until it's field dressed or rots, and our behaviours leave it alone.
 */
export function isCarcass(entity) {
  try {
    return entity.getProperty('aquatic:hunt_state') === 4;
  } catch {
    return false;
  }
}

/** All live (not carcass) entities matching a query near at least one player (cheap enough to poll). */
export function nearPlayers(query, radius = 48) {
  const out = new Map();
  for (const player of world.getPlayers()) {
    let found;
    try {
      found = player.dimension.getEntities({ ...query, location: player.location, maxDistance: radius });
    } catch {
      continue;
    }
    for (const e of found) if (!isCarcass(e)) out.set(e.id, e);
  }
  return [...out.values()];
}

export const chance = (p) => Math.random() < p;
export const short = (typeId) => typeId.split(':')[1];

/** Per-entity cooldowns kept in memory (they reset when the world reloads, which is fine). */
const cooldowns = new Map();
export function ready(entity, key, ticks, now) {
  const k = `${entity.id}:${key}`;
  const until = cooldowns.get(k) ?? 0;
  if (now < until) return false;
  cooldowns.set(k, now + ticks);
  return true;
}

/** Give an item to a player, or drop it at their feet when the inventory is full. */
export function give(player, stack) {
  const left = player.getComponent('minecraft:inventory')?.container?.addItem(stack);
  if (left) player.dimension.spawnItem(left, player.location);
}

/** The player's per-species records: { seen: [ids], caught: { id: best kg } }. */
export function records(player) {
  let seen = [], caught = {};
  try { seen = JSON.parse(player.getDynamicProperty('aquatic:seen') ?? '[]'); } catch {}
  try { caught = JSON.parse(player.getDynamicProperty('aquatic:caught') ?? '{}'); } catch {}
  return { seen, caught };
}

export function saveRecords(player, { seen, caught }) {
  player.setDynamicProperty('aquatic:seen', JSON.stringify(seen));
  player.setDynamicProperty('aquatic:caught', JSON.stringify(caught));
}
