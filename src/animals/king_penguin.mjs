import { penguinSpec } from '../lib/penguin.mjs';

// A little smaller than the emperor, with bright orange ear patches and an orange chest.
export default penguinSpec({
  id: 'king_penguin',
  name: 'King Penguin',
  body: { bodyW: 6, bodyH: 10, bodyD: 5, headW: 4, headH: 4, headD: 4, beak: 3, flipper: 7 },
  size: [0.5, 1.0],
  health: 10,
  swimSpeed: 0.24,
  colors: { back: '#3a4048', front: '#f6f6f2', chest: '#f7a030', ear: '#f58a1f', beak: '#1c2028', beakStripe: '#f07a28', foot: '#2a2a2a' },
  spawn: [{ biomes: ['snowy_beach', 'stony_shore'], weight: 4, group: [3, 6], blocks: ['snow', 'snow_layer', 'gravel', 'stone', 'sand'] }],
  sounds: { pitch: [1.3, 1.5] },
});
