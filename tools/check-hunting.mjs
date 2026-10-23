// Checks every fish's and shark's Realistic Hunting profile without the game:
//   node tools/check-hunting.mjs [-v] [ids...]
// A broadside heart shot must grade perfect, a quartering shot must reach the vitals, a
// shot over the back must miss (see tools/vendor/hunting-kit/check.mjs).
import { loadAnimals } from './build.mjs';
import { huntingProfile } from '../src/hunting.mjs';
import { isHuntable } from '../src/lib/behavior.mjs';
import { checkProfile } from './vendor/hunting-kit/check.mjs';

export async function checkHunting({ only = [], verbose = false } = {}) {
  const failures = [];
  for (const a of await loadAnimals()) {
    if (!isHuntable(a) || (only.length && !only.includes(a.id))) continue;
    const p = huntingProfile(a);
    const r = checkProfile(p);
    failures.push(...r.failures);
    if (verbose || r.failures.length) console.log(`${p.id} (${p.game.class}, ${p.game.minEnergy} J, ${p.hitModel.organs.length} organs)\n${r.lines.join('\n')}`);
  }
  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const failures = await checkHunting({ only: args.filter((x) => !x.startsWith('-')), verbose: args.includes('-v') });
  if (failures.length) {
    console.error(`${failures.length} hunting check(s) failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log('Hunting profiles OK');
}
