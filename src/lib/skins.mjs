// Colour schemes shared by many fish and marine mammals.
import { gradient, underside } from './texture.mjs';

/**
 * Countershading: darker on the back, pale underneath (most fish and whales), as layers
 * for a material. `at` comes from the body plan (bottom, top, cy).
 */
export const countershade = ({ back, belly, at, soft = 1.2, lift = 1.2 }) => [
  gradient(back, { axis: 1, from: at.cy, to: at.top }),
  underside(belly, { y: at.bottom + lift, soft }),
];

/** Sounds for fish of different sizes. */
export const FISH_SOUNDS = { hurt: 'mob.fish.hurt', death: 'mob.fish.death', pitch: [1.0, 1.2] };
export const BIG_FISH_SOUNDS = { hurt: 'mob.fish.hurt', death: 'mob.fish.death', pitch: [0.55, 0.7] };

/** Habitats. */
export const FRESH = ['river', 'lakes'];

/** Whale sounds: deep, slow calls. */
export const WHALE_SOUNDS = { ambient: 'mob.dolphin.idle_water', hurt: 'mob.dolphin.hurt', death: 'mob.dolphin.death', pitch: [0.4, 0.55], interval: 20 };
export const SONG_SOUNDS = { ambient: 'mob.elderguardian.idle', hurt: 'mob.dolphin.hurt', death: 'mob.dolphin.death', pitch: [0.45, 0.6], interval: 30 };

/** Penguins bray like donkeys (really). */
export const PENGUIN_SOUNDS = { ambient: 'mob.horse.donkey.idle', hurt: 'mob.parrot.hurt', death: 'mob.parrot.death', pitch: [1.5, 1.8], interval: 12 };
