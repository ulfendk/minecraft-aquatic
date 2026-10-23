// Behaviours that entity JSON alone can't express: stranded fish flopping about, whales
// blowing when they surface, penguins tobogganing and huddling, tame seals bringing fish,
// riding a whale by its fin, and the lionfish's venomous spines.
import { ItemStack, system, world } from '@minecraft/server';
import { SPECIES } from './data.js';
import { chance, give, nearPlayers, ready, short } from './util.js';

const SLIDE_BLOCKS = new Set(['minecraft:ice', 'minecraft:packed_ice', 'minecraft:blue_ice', 'minecraft:snow', 'minecraft:snow_layer', 'minecraft:frosted_ice']);
const ofKind = (movement) => nearPlayers({ families: ['aquatic'] }, 64).filter((e) => SPECIES[short(e.typeId)]?.movement === movement);

/** A fish out of water bounces about on its side until it finds water or suffocates. */
function flop() {
  for (const fish of ofKind('swim')) {
    try {
      if (!fish.getProperty('aquatic:stranded') || !fish.isOnGround) continue;
      fish.applyImpulse({ x: (Math.random() - 0.5) * 0.15, y: 0.28, z: (Math.random() - 0.5) * 0.15 });
      fish.dimension.playSound('mob.fish.flop', fish.location, { volume: 0.6 });
    } catch {}
  }
}

/** Whales blow a spout of spray when they come up to breathe. */
function spouts(now) {
  for (const whale of ofKind('cetacean')) {
    try {
      if (!whale.isInWater) continue;
      const top = { x: whale.location.x, y: whale.location.y + SPECIES[short(whale.typeId)].spout + 0.3, z: whale.location.z };
      const above = whale.dimension.getBlock(top);
      if (!above?.isAir || !ready(whale, 'spout', 160, now)) continue;
      whale.dimension.spawnParticle('aquatic:spout', top);
      whale.dimension.playSound('mob.dolphin.blowhole', top, { pitch: 0.5, volume: 2 });
    } catch {}
  }
}

/** Penguins toboggan on their bellies across ice and snow, and huddle together at night. */
function penguins(now) {
  const night = world.getTimeOfDay() >= 13000 && world.getTimeOfDay() < 23000;
  const all = ofKind('penguin');
  for (const p of all) {
    try {
      const below = p.dimension.getBlock({ x: p.location.x, y: p.location.y - 0.2, z: p.location.z });
      const v = p.getVelocity();
      const speed = Math.hypot(v.x, v.z);
      const slide = !p.isInWater && SLIDE_BLOCKS.has(below?.typeId) && speed > 0.06;
      if (p.getProperty('aquatic:sliding') !== slide) p.setProperty('aquatic:sliding', slide);
      if (slide) p.applyImpulse({ x: v.x * 0.25, y: 0, z: v.z * 0.25 });
      if (night && !p.isInWater && now % 40 === 0) {
        const colony = all.filter((o) => o !== p && o.dimension.id === p.dimension.id && Math.hypot(o.location.x - p.location.x, o.location.z - p.location.z) < 12);
        if (colony.length) {
          const cx = colony.reduce((s, o) => s + o.location.x, 0) / colony.length;
          const cz = colony.reduce((s, o) => s + o.location.z, 0) / colony.length;
          const dx = cx - p.location.x, dz = cz - p.location.z, d = Math.hypot(dx, dz);
          if (d > 1.5) p.applyImpulse({ x: (dx / d) * 0.12, y: 0, z: (dz / d) * 0.12 });
        }
      }
    } catch {}
  }
}

/** Now and then a tame seal that has been swimming comes back with a herring for you. */
function fetchFish(now) {
  for (const seal of ofKind('pinniped')) {
    try {
      if (!seal.getComponent('minecraft:is_tamed') || !seal.isInWater || !chance(0.05) || !ready(seal, 'fetch', 1200, now)) continue;
      const owner = seal.dimension.getPlayers({ location: seal.location, maxDistance: 10, closest: 1 })[0];
      if (!owner) continue;
      give(owner, new ItemStack('aquatic:herring', 1));
      owner.onScreenDisplay.setActionBar({ translate: 'aquatic.seal.fetched' });
      seal.dimension.playSound('mob.polarbear_baby.idle', seal.location, { pitch: 1.4 });
    } catch {}
  }
}

/** Holding on to a whale: it swims where you look, and you can breathe. */
const riders = new Set();
function ride() {
  for (const player of world.getPlayers()) {
    let whale;
    try { whale = player.getComponent('minecraft:riding')?.entityRidingOn; } catch {}
    const riding = whale && SPECIES[short(whale.typeId)]?.ride;
    if (!riding) { riders.delete(player.id); continue; }
    if (!riders.has(player.id)) {
      riders.add(player.id);
      player.onScreenDisplay.setActionBar({ translate: 'aquatic.whale.hold' });
    }
    try {
      player.addEffect('water_breathing', 60, { showParticles: false });
      const view = player.getViewDirection();
      whale.applyImpulse({ x: view.x * 0.035, y: view.y * 0.03, z: view.z * 0.035 });
    } catch {}
  }
}

export function setupBehaviours() {
  system.runInterval(() => {
    const now = system.currentTick;
    if (now % 10 === 0) flop();
    if (now % 40 === 0) spouts(now);
    if (now % 5 === 0) penguins(now);
    if (now % 100 === 0) fetchFish(now);
    ride();
  }, 1);

  // Lionfish spines: whatever hits one is poisoned.
  world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
    if (!hurtEntity.typeId.startsWith('aquatic:') || !SPECIES[short(hurtEntity.typeId)]?.poisonous) return;
    const attacker = damageSource.damagingEntity;
    if (!attacker || damageSource.cause !== 'entityAttack') return;
    try { attacker.addEffect('poison', 120, { amplifier: 1 }); } catch {}
  });
}
