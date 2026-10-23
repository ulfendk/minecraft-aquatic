import { ItemStack, system, world } from '@minecraft/server';
import { ITEMS } from './data.js';

/**
 * Used by tools/bds-test.sh: reports how many of each creature exist and which expected ones
 * are missing, checks every item, and that a fish dropped on dry land knows it is stranded.
 * Message = space-separated expected ids.
 */
export function selfTest(message) {
  const expected = message.split(/\s+/).filter(Boolean);
  const dim = world.getDimension('overworld');
  const counts = {};
  for (const e of dim.getEntities()) {
    if (e.typeId.startsWith('aquatic:')) counts[e.typeId] = (counts[e.typeId] ?? 0) + 1;
  }
  const missing = expected.filter((id) => !counts[`aquatic:${id}`]);
  for (const id of ITEMS) {
    try {
      new ItemStack(id, 1);
    } catch {
      missing.push(id);
    }
  }
  console.log(`[Sea Life] selftest found ${JSON.stringify(counts)}`);

  // A perch on dry land must notice it is out of the water (aquatic:stranded drives the flop).
  const perch = dim.spawnEntity('aquatic:perch', { x: 40.5, y: -60, z: 40.5 });
  system.runTimeout(() => {
    let stranded = false;
    try { stranded = perch.getProperty('aquatic:stranded') === true; } catch {}
    if (!stranded) missing.push('stranded perch');
    try { perch.remove(); } catch {}
    console.log(missing.length ? `[Sea Life] selftest FAIL missing: ${missing.join(' ')}` : '[Sea Life] selftest PASS');
  }, 20);
}
