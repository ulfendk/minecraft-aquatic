import { penguinSpec } from '../lib/penguin.mjs';

// The biggest penguin: over a metre tall, with golden ear patches and a pale yellow chest.
// Colonies huddle together to keep warm through the night.
export default penguinSpec({
  id: 'emperor_penguin',
  name: 'Emperor Penguin',
  body: { bodyW: 7, bodyH: 12, bodyD: 6, headW: 5, headH: 5, headD: 5, beak: 3, flipper: 8 },
  size: [0.6, 1.2],
  health: 12,
  swimSpeed: 0.24,
  colors: { back: '#1c2028', front: '#f4f4f0', chest: '#f6e6a0', ear: '#f2b632', beak: '#1c2028', beakStripe: '#e8803a', foot: '#2a2a2a' },
  spawn: [{ biomes: ['snowy_beach', 'ice_spikes', 'frozen_ocean'], weight: 4, group: [3, 6], blocks: ['snow', 'snow_layer', 'ice', 'packed_ice', 'snow_block'] }],
  sounds: { pitch: [1.1, 1.3] },
});
