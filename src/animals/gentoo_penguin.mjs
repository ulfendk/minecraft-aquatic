import { penguinSpec } from '../lib/penguin.mjs';

// The fastest swimming penguin of all, with a white band over its head and a bright orange
// beak and feet.
export default penguinSpec({
  id: 'gentoo_penguin',
  name: 'Gentoo Penguin',
  body: { bodyW: 5, bodyH: 8, bodyD: 5, headW: 4, headH: 4, headD: 4, beak: 2, flipper: 6 },
  size: [0.45, 0.8],
  health: 8,
  swimSpeed: 0.3,
  colors: { back: '#262b33', front: '#f6f6f2', ear: '#262b33', brow: '#f6f6f2', beak: '#ee5a24', foot: '#f08a3a' },
  spawn: [{ biomes: ['snowy_beach', 'frozen_ocean', 'stony_shore'], weight: 5, group: [3, 6], blocks: ['snow', 'snow_layer', 'gravel', 'stone', 'ice'] }],
  sounds: { pitch: [1.6, 1.9] },
});
