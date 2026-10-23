// Facts derived from animal specs, shared by the website, the lang files and the Fish
// Guide script (which shows them through translation keys).
import { guide } from '../guide.mjs';
import { catchFor } from '../fishing.mjs';

export const BIOME_NAMES = {
  river: 'Rivers', lakes: 'Lakes and ponds', swamp: 'Swamps', mangrove: 'Mangrove swamps',
  ocean: 'Ocean', deep_ocean: 'Deep ocean', warm_ocean: 'Warm ocean', lukewarm_ocean: 'Lukewarm ocean',
  cold_ocean: 'Cold ocean', frozen_ocean: 'Frozen ocean', beach: 'Beaches', stony_shore: 'Stony shores',
  snowy_beach: 'Snowy beaches', ice_spikes: 'Ice spikes',
};

/** The Fish Guide's chapters, in order. */
export const GROUPS = {
  freshwater: 'Freshwater fish', sea: 'Sea fish', tropical: 'Tropical fish', shark: 'Sharks and rays',
  seal: 'Seals', whale: 'Whales', penguin: 'Penguins',
};

export const TAGS = {
  hunter: 'Hunter', prey: 'Prey', dangerous: 'Dangerous', fights_back: 'Fights back', schools: 'Swims in schools',
  venomous: 'Venomous spines', bucket: 'Fits in a bucket', tameable: 'Can be tamed', rideable: 'Hold on and ride',
  breathes_air: 'Breathes air', protected: 'Protected', gentle: 'Gentle', game: 'Game fish',
};

export function habitatIds(a) {
  return [...new Set((a.spawn ?? []).flatMap((s) => s.biomes))];
}

export function habitats(a) {
  return habitatIds(a).map((b) => BIOME_NAMES[b] ?? b);
}

export function tagIds(a) {
  const t = [];
  if (a.hunts?.length) t.push('hunter');
  if (a.fleesFrom?.length && !a.attack) t.push('prey');
  if (a.hostile) t.push('dangerous');
  else if (a.attack) t.push('fights_back');
  if (a.school) t.push('schools');
  if (a.poisonous) t.push('venomous');
  if (a.bucket) t.push('bucket');
  if (a.tame) t.push('tameable');
  if (a.rideFin) t.push('rideable');
  if (a.movement !== 'swim') t.push('breathes_air', 'protected');
  else t.push('game');
  if (!a.attack && !a.fleesFrom?.length) t.push('gentle');
  return t;
}

export function tags(a) {
  return tagIds(a).map((id) => TAGS[id]);
}

/** Compact record for the in-game Fish Guide script (texts come from lang keys). */
export function guideEntry(a) {
  const c = catchFor(a.id);
  return {
    id: a.id,
    name: a.name,
    group: a.group,
    text: guide[a.id] ?? '',
    habitats: habitatIds(a),
    tags: tagIds(a),
    food: (a.breed ?? []).map((i) => i.replace(/^.*:/, '')),
    tame: (a.tame?.items ?? []).map((i) => i.replace(/^.*:/, '')),
    ...(c ? { time: c.time, rod: c.fight >= 4 ? 'sea_rod' : 'anglers_rod', weight: c.weight } : {}),
  };
}
