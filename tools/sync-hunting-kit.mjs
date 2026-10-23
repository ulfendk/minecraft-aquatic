// Copies the hunting target kit from a Realistic Hunting checkout (default ../minecraft-hunting)
// into tools/vendor/hunting-kit/. The copies are committed, so builds don't need the hunting repo.
//   node tools/sync-hunting-kit.mjs [path-to-minecraft-hunting]
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HUNTING = resolve(process.argv[2] ?? join(ROOT, '..', 'minecraft-hunting'));
const OUT = join(ROOT, 'tools', 'vendor', 'hunting-kit');
const FILES = {
  'hitmodel.mjs': 'src/lib/hitmodel.mjs',
  'zones.mjs': 'src/zones.mjs',
  'hitzones.js': 'src/packs/behavior_pack/scripts/lib/hitzones.js',
  'protocol.js': 'src/packs/behavior_pack/scripts/lib/protocol.js',
  'check.mjs': 'tools/target-kit/check.mjs',
};
const commit = execFileSync('git', ['-C', HUNTING, 'rev-parse', '--short', 'HEAD']).toString().trim();
await mkdir(OUT, { recursive: true });
for (const [name, src] of Object.entries(FILES)) {
  let text = await readFile(join(HUNTING, src), 'utf8');
  // Flatten the relative imports between kit files.
  text = text.replace(/from '(?:\.\.?\/)+(?:[\w/]+\/)?(hitmodel\.mjs|zones\.mjs|hitzones\.js|protocol\.js)'/g, "from './$1'");
  await writeFile(join(OUT, name), `// Copied from minecraft-hunting ${src} @ ${commit} by tools/sync-hunting-kit.mjs. Don't edit here.\n${text}`);
}
console.log(`Hunting kit @ ${commit} → tools/vendor/hunting-kit`);
