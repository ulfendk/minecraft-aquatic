// Fishing: what bites where, and how hard it fights. Shared by the Bedrock script (generated
// into scripts/data.js) and the Java mod (data/aquatic/fishing.json), so both editions
// catch the same fish in the same places.
//
// A catch: { id (item), biomes (habitat keys), depth: [min, max] blocks of water under the
// bobber, time: 'day' | 'night' | 'dusk' | 'any' (when it bites best), weight: [kg, kg],
// fight: 1 (a tiddler) .. 5 (needs the Sea Rod and patience), rarity (relative chance) }.

export const CATCHES = [
  // Freshwater
  { id: 'perch', biomes: ['river', 'lakes'], depth: [1, 20], time: 'day', weight: [0.1, 1.2], fight: 1, rarity: 30 },
  { id: 'pike', biomes: ['river', 'lakes', 'swamp'], depth: [1, 20], time: 'dusk', weight: [1, 16], fight: 3, rarity: 16 },
  { id: 'zander', biomes: ['river', 'lakes'], depth: [2, 30], time: 'night', weight: [1, 9], fight: 3, rarity: 12 },
  { id: 'brown_trout', biomes: ['river', 'lakes'], depth: [1, 20], time: 'dusk', weight: [0.3, 4], fight: 2, rarity: 16 },
  { id: 'carp', biomes: ['lakes', 'swamp', 'river'], depth: [1, 20], time: 'any', weight: [2, 20], fight: 3, rarity: 14 },
  { id: 'wels_catfish', biomes: ['river', 'swamp', 'lakes'], depth: [3, 40], time: 'night', weight: [10, 80], fight: 5, rarity: 3 },
  { id: 'eel', biomes: ['river', 'swamp', 'lakes', 'mangrove'], depth: [1, 30], time: 'night', weight: [0.3, 2], fight: 3, rarity: 10 },
  // Cold and temperate seas
  { id: 'herring', biomes: ['ocean', 'cold_ocean', 'beach', 'stony_shore'], depth: [2, 64], time: 'any', weight: [0.1, 0.4], fight: 1, rarity: 30 },
  { id: 'mackerel', biomes: ['ocean', 'lukewarm_ocean', 'beach'], depth: [2, 64], time: 'day', weight: [0.3, 1.5], fight: 2, rarity: 22 },
  { id: 'plaice', biomes: ['ocean', 'cold_ocean', 'beach'], depth: [3, 64], time: 'any', weight: [0.5, 2.5], fight: 2, rarity: 14 },
  { id: 'garfish', biomes: ['ocean', 'lukewarm_ocean', 'beach', 'stony_shore'], depth: [1, 20], time: 'day', weight: [0.3, 1.2], fight: 3, rarity: 10 },
  { id: 'lumpfish', biomes: ['cold_ocean', 'frozen_ocean', 'stony_shore'], depth: [1, 30], time: 'any', weight: [0.5, 4], fight: 1, rarity: 10 },
  { id: 'wolffish', biomes: ['cold_ocean', 'frozen_ocean', 'deep_ocean'], depth: [10, 64], time: 'night', weight: [3, 15], fight: 4, rarity: 6 },
  // Warm seas
  { id: 'clownfish', biomes: ['warm_ocean'], depth: [1, 20], time: 'day', weight: [0.02, 0.25], fight: 1, rarity: 14 },
  { id: 'blue_tang', biomes: ['warm_ocean'], depth: [1, 30], time: 'day', weight: [0.2, 0.6], fight: 2, rarity: 14 },
  { id: 'lionfish', biomes: ['warm_ocean', 'lukewarm_ocean'], depth: [2, 40], time: 'any', weight: [0.3, 1.3], fight: 2, rarity: 8 },
  { id: 'swordfish', biomes: ['deep_ocean', 'warm_ocean', 'lukewarm_ocean'], depth: [8, 64], time: 'day', weight: [50, 400], fight: 5, rarity: 3 },
  // Vanilla fish keep biting in their usual waters.
  { id: 'minecraft:cod', biomes: ['ocean', 'cold_ocean', 'lukewarm_ocean', 'beach', 'stony_shore'], depth: [1, 64], time: 'any', weight: [0.5, 4], fight: 2, rarity: 20 },
  { id: 'minecraft:salmon', biomes: ['river', 'cold_ocean', 'frozen_ocean', 'snowy_beach'], depth: [1, 64], time: 'any', weight: [1, 8], fight: 3, rarity: 14 },
  { id: 'minecraft:tropical_fish', biomes: ['warm_ocean', 'lukewarm_ocean'], depth: [1, 64], time: 'day', weight: [0.05, 0.5], fight: 1, rarity: 10 },
  { id: 'minecraft:pufferfish', biomes: ['warm_ocean', 'lukewarm_ocean'], depth: [1, 64], time: 'any', weight: [0.2, 1], fight: 1, rarity: 6 },
];

/** Rods: which catches they can land and how they handle a fight. */
export const RODS = {
  anglers_rod: { maxFight: 3, reel: 0.12, strain: 1.0, junk: 0.10, treasure: 0.02 },
  sea_rod: { maxFight: 5, reel: 0.15, strain: 0.7, junk: 0.05, treasure: 0.05 },
};

/** Not every bite is a fish. */
export const JUNK = ['kelp', 'stick', 'bowl', 'string', 'bone', 'leather_boots', 'lily_pad', 'ink_sac'];
export const TREASURE = ['name_tag', 'saddle', 'nautilus_shell', 'bow', 'book'];

/**
 * The fight, per game tick (20 per second): the fish pulls, harder in bursts; holding sneak
 * reels in but strains the line, letting go eases the tension while the fish takes line.
 * Over 100 tension the line snaps; at maxLine the fish has run out the whole spool.
 */
export const FIGHT = {
  biteWindow: 25, waitMin: 100, waitMax: 500,
  base: 0.4, relax: 4, takeLine: 0.02, maxLine: 40, landAt: 1.6,
  burstChance: 0.025, burstMin: 10, burstMax: 30,
  stamina: 40, staminaPerFight: 40, drainReel: 1.5, drainIdle: 0.5, tiredPull: 0.2,
};

/** Habitat keys -> biome ids (Bedrock ids from Dimension.getBiome, Java registry ids). */
export const HABITAT_BIOMES = {
  river: ['river', 'frozen_river'],
  swamp: ['swampland', 'swamp'],
  mangrove: ['mangrove_swamp'],
  ocean: ['ocean', 'deep_ocean'],
  deep_ocean: ['deep_ocean', 'deep_warm_ocean', 'deep_lukewarm_ocean', 'deep_cold_ocean', 'deep_frozen_ocean'],
  warm_ocean: ['warm_ocean', 'deep_warm_ocean'],
  lukewarm_ocean: ['lukewarm_ocean', 'deep_lukewarm_ocean'],
  cold_ocean: ['cold_ocean', 'deep_cold_ocean'],
  frozen_ocean: ['frozen_ocean', 'deep_frozen_ocean', 'legacy_frozen_ocean'],
  beach: ['beach'],
  stony_shore: ['stone_beach', 'stony_shore'],
  snowy_beach: ['cold_beach', 'snowy_beach'],
  ice_spikes: ['ice_plains_spikes', 'ice_spikes'],
};

/** The fishing record for a species (or null when it can't be caught on a rod). */
export function catchFor(id) {
  return CATCHES.find((c) => c.id === id) ?? null;
}

/** Fish that the vanilla fishing rod can also catch (with these loot weights; cod has 60). */
export const VANILLA_ROD = { herring: 8, mackerel: 6, perch: 6, plaice: 4, brown_trout: 4, pike: 3, carp: 3 };
