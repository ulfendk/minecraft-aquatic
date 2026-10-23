import { system, world } from '@minecraft/server';
import { setupBehaviours } from './behaviours.js';
import { setupBuckets } from './buckets.js';
import { setupFishGuide } from './fishguide.js';
import { setupFishing } from './fishing.js';
import { setupHunting } from './hunting.js';
import { selfTest } from './selftest.js';

world.afterEvents.worldLoad.subscribe(() => {
  setupBehaviours();
  setupBuckets();
  setupFishGuide();
  setupFishing();
  setupHunting();
  console.log('[Sea Life] loaded');
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id === 'aquatic:selftest') selfTest(event.message);
});
