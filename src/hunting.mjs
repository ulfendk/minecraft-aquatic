// Realistic Hunting support: every animal as a hunting target profile (game data plus a
// hit model built from its own geometry, with organ boxes placed inside the torso, neck
// and head). The profiles are sent to the hunting add-on when both are installed
// (Bedrock: scripts/hunting.js, Java: hunting/targets/aquatic.json); see README.
//
// An animal can tune its profile with `hunt: { weight, class, minEnergy, score, trophy,
// maleTrophy, call, senses, organs, maleBones }`.
import { buildHitModel, fishOrgans, headOrgans, neckOrgans, torsoOrgans } from '../tools/vendor/hunting-kit/hitmodel.mjs';
import { PROTOCOL } from '../tools/vendor/hunting-kit/protocol.js';
import { NS } from './lib/constants.mjs';

/** Live weight range in kg (fish and sharks only: seals, whales and penguins are protected). */
const WEIGHT = {
  perch: [0.1, 1.2], pike: [1, 16], zander: [1, 9], brown_trout: [0.3, 4], carp: [2, 20], wels_catfish: [10, 80], eel: [0.3, 2],
  herring: [0.1, 0.4], mackerel: [0.3, 1.5], plaice: [0.5, 2.5], garfish: [0.3, 1.2], lumpfish: [0.5, 4], wolffish: [3, 15],
  clownfish: [0.02, 0.25], blue_tang: [0.2, 0.6], lionfish: [0.3, 1.3], swordfish: [50, 400], ocean_sunfish: [250, 1000],
  manta_ray: [500, 2000], hammerhead: [150, 450], great_white: [600, 1800], whale_shark: [5000, 15000],
};

const TUSKS = new Set();

const SENSES = {
  prey: { sight: 1.2, hearing: 1.3, smell: 1.3, alertTime: 12, herd: 16 },
  predator: { sight: 1.2, hearing: 1.3, smell: 1.5, alertTime: 10, herd: 0 },
  neutral: { sight: 1.1, hearing: 1.2, smell: 1.2, alertTime: 10, herd: 10 },
  megafauna: { sight: 0.7, hearing: 1.2, smell: 1.6, alertTime: 12, herd: 12 },
  scavenger: { sight: 1.8, hearing: 1.0, smell: 1.0, alertTime: 8, herd: 6 },
};
const FISH_SENSES = { sight: 1.0, hearing: 1.3, smell: 0.6, alertTime: 6, herd: 6 };

const volume = (c) => c.size[0] * c.size[1] * c.size[2];

/** Bounding box { origin, size } of a bone's main cubes (leaving out spikes, quills, fins). */
function mainBox(bone) {
  const cubes = (bone?.cubes ?? []).filter((c) => !c.rotation && volume(c) > 0);
  if (!cubes.length) return null;
  const big = Math.max(...cubes.map(volume));
  const main = cubes.filter((c) => volume(c) >= big * 0.25);
  const min = [0, 1, 2].map((i) => Math.min(...main.map((c) => c.origin[i])));
  const max = [0, 1, 2].map((i) => Math.max(...main.map((c) => c.origin[i] + c.size[i])));
  return { origin: min, size: max.map((v, i) => v - min[i]) };
}

/** The front-most of a bone's main cubes (the head end of a headless body). */
function frontCube(bone) {
  const cubes = bone.cubes.filter((c) => !c.rotation && volume(c) > 0);
  const big = Math.max(...cubes.map(volume));
  const c = cubes.filter((x) => volume(x) >= big * 0.25).sort((x, y) => x.origin[2] - y.origin[2])[0];
  return { origin: c.origin, size: c.size };
}

/** Front part of a box (low z) as a stand-in head, for animals without a head bone. */
const front = (box, f) => ({ origin: box.origin, size: [box.size[0], box.size[1], box.size[2] * f] });
const back = (box, f) => ({ origin: [box.origin[0], box.origin[1], box.origin[2] + box.size[2] * (1 - f)], size: [box.size[0], box.size[1], box.size[2] * f] });

/** A box inside `box`: fractions along x (centred width), y and z. */
function inner(bone, zone, box, w, [g0, g1], [f0, f1]) {
  const [x0, y0, z0] = box.origin;
  const [W, H, L] = box.size;
  return { bone, zone, origin: [x0 + W * (1 - w) / 2, y0 + H * g0, z0 + L * f0], size: [W * w, H * (g1 - g0), L * (f1 - f0)] };
}

/** Snakes, eels and centipedes: a chain of segments seg1 (front) .. segN. */
function chainOrgans(a, bones, { gills = false } = {}) {
  const segs = bones.filter((b) => /^seg\d+$/.test(b.name)).sort((x, y) => Number(x.name.slice(3)) - Number(y.name.slice(3)));
  const box = (i) => mainBox(segs[Math.min(i, segs.length - 1)]);
  const n = segs.length;
  const at = (f) => Math.min(n - 1, Math.floor(n * f));
  const organs = [];
  for (const s of segs) organs.push(inner(s.name, 'spine', mainBox(s), 0.34, [0.66, 1], [0, 1]));
  const h = at(0.15), l = at(0.15), l2 = at(0.3), lv = at(0.45), st = at(0.6);
  organs.push(inner(segs[h].name, 'heart', box(h), 0.6, [0.08, 0.6], [0.1, 0.5]));
  organs.push(inner(segs[l].name, gills ? 'gills' : 'lungs', box(l), 0.8, [0.1, 0.66], [0.5, 1]));
  if (l2 !== l) organs.push(inner(segs[l2].name, 'lungs', box(l2), 0.8, [0.1, 0.66], [0, 1]));
  organs.push(inner(segs[lv].name, 'liver', box(lv), 0.8, [0.1, 0.66], [0, 1]));
  if (st !== lv) organs.push(inner(segs[st].name, 'stomach', box(st), 0.8, [0.1, 0.66], [0, 1]));
  const head = bones.find((b) => b.name === 'head');
  if (head) organs.push(...headOrgans('head', mainBox(head)));
  return organs;
}

/** Organ boxes for an animal, from its bones. */
export function organsFor(a) {
  if (a.hunt?.organs) return a.hunt.organs;
  const bones = a.model.bones;
  const byName = (n) => bones.find((b) => b.name === n);
  if (bones.some((b) => b.name === 'seg1')) return chainOrgans(a, bones, { gills: a.movement === 'swim' });
  const body = mainBox(byName('body'));
  if (!body) throw new Error(`${a.id}: no body bone to put the organs in`);
  const head = byName('head');
  if (a.movement === 'swim') {
    return head ? fishOrgans('body', body, 'head', mainBox(head)) : fishOrgans('body', back(body, 0.7), 'body', front(body, 0.3));
  }
  const organs = [...torsoOrgans('body', body, a.hunt?.torso)];
  for (const neck of bones.filter((b) => /^neck\d*$/.test(b.name))) {
    const box = mainBox(neck);
    if (box) organs.push(...neckOrgans(neck.name, box));
  }
  if (head && mainBox(head)) organs.push(...headOrgans('head', mainBox(head)));
  else organs.push(inner('body', 'brain', front(frontCube(byName('body')), 0.4), 0.5, [0.45, 0.85], [0.1, 0.8]));
  return organs;
}

/** Fish are hunted underwater with harpoons and spearguns, which carry far less energy than rifles. */
function fishGame(a, weight) {
  const max = weight[1];
  const shark = (a.family ?? []).includes('shark');
  const cls = a.hunt?.class ?? (shark && a.attack ? 'dangerous' : max < 5 ? 'small' : max < 40 ? 'medium' : 'big');
  const [baseEnergy, baseShot] = { small: [60, 4], medium: [150, 15], big: [400, 40], dangerous: [500, 60] }[cls];
  const minEnergy = a.hunt?.minEnergy ?? baseEnergy, minShotEnergy = a.hunt?.minShotEnergy ?? baseShot;
  const trophy = a.hunt?.trophy !== undefined ? a.hunt.trophy : shark ? 'trophy_shark_jaw' : max >= 40 ? 'trophy_tuna' : null;
  const score = a.hunt?.score ?? (trophy ? Math.round(60 * Math.log10(Math.max(2, max)) + 20) : 0);
  return { class: cls, minEnergy, minShotEnergy, weight, score, trophy, maleTrophy: false };
}

function gameData(a) {
  const weight = a.hunt?.weight ?? WEIGHT[a.id];
  if (!weight) throw new Error(`${a.id}: no hunting weight`);
  if (a.movement === 'swim') return fishGame(a, weight);
  const max = weight[1];
  const dangerous = ['predator', 'megafauna'].includes(a.role) && max >= 50;
  const cls = a.hunt?.class ?? (max < 30 ? 'small' : dangerous ? 'dangerous' : max > 300 ? 'big' : 'medium');
  const minEnergy = a.hunt?.minEnergy ?? {
    small: max < 2 ? 150 : 300,
    medium: max < 60 ? 1000 : 1600,
    big: max < 800 ? 2000 : 2700,
    dangerous: max >= 1000 ? 5000 : 2700,
  }[cls];
  const trophy = a.hunt?.trophy !== undefined ? a.hunt.trophy
    : TUSKS.has(a.id) ? 'trophy_tusks'
    : cls === 'small' && !(a.role === 'predator' && max >= 5) ? null
    : 'trophy_skull';
  const call = a.hunt?.call !== undefined ? a.hunt.call : a.role === 'predator' ? 'predator' : null;
  const score = a.hunt?.score ?? (trophy ? Math.round((60 * Math.log10(Math.max(2, max)) + 20) * (cls === 'dangerous' ? 1.2 : 1)) : 0);
  return {
    class: cls,
    minEnergy,
    ...(cls === 'small' ? { minShotEnergy: max < 2 ? 3 : 5 } : {}),
    weight,
    score,
    trophy,
    maleTrophy: a.hunt?.maleTrophy ?? false,
    ...(call ? { call } : {}),
  };
}

/** The hunting target profile for an animal. `ns` is the entity namespace. */
export function huntingProfile(a, { ns = NS, name } = {}) {
  const spec = { id: a.id, model: a.model, organs: organsFor(a) };
  const maleBones = a.hunt?.maleBones ?? [];
  const fish = a.movement === 'swim';
  return {
    v: PROTOCOL,
    id: `${ns}:${a.id}`,
    name: name ?? `entity.${ns}:${a.id}.name`,
    game: gameData(a),
    senses: a.hunt?.senses ?? (fish ? FISH_SENSES : SENSES[a.role] ?? SENSES.neutral),
    scale: a.scale ?? 1,
    health: a.health,
    bird: a.movement === 'fly',
    fish,
    hitModel: buildHitModel(spec),
    hitModelFemale: maleBones.length ? buildHitModel(spec, { exclude: new Set(maleBones) }) : null,
    // Lions: variant 0 is the maned male. Everyone else's variants are colours.
    sex: maleBones.length ? 'variant0' : 'random',
    sounds: { warn: a.sounds?.ambient ?? null, death: a.sounds?.death ?? null, pitch: a.sounds?.pitch ?? [1, 1] },
    icon: `textures/ui/${NS}/${a.id}`,
    entry: `${NS}.guide.entry.${a.id}`,
    loot: (a.loot ?? []).map((l) => ({ item: l.item, min: l.min ?? 1, max: l.max ?? l.min ?? 1 })),
    bedrock: {
      state: `${NS}:hunt_state`,
      events: { carcass: `${NS}:hunt_carcass`, lure: `${NS}:hunt_lure`, unlure: `${NS}:hunt_unlure` },
    },
  };
}
