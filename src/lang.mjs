// In-game texts (.lang files) for every supported language.
// Danish names for animals, items, habitats and tags are shared with the website
// (src/i18n.mjs); vanilla item names follow Minecraft's own da_DK.lang.
import { guide } from './guide.mjs';
import { STRINGS } from './i18n.mjs';
import { NS } from './lib/constants.mjs';
import { BIOME_NAMES, GROUPS, TAGS } from './lib/info.mjs';

export const LOCALES = ['en_US', 'da_DK'];

/** Foods used for breeding and taming, keyed by item id. */
const FOODS = {
  cod: ['Raw Cod', 'Rå torsk'], salmon: ['Raw Salmon', 'Rå laks'], 'aquatic:herring': ['Raw Herring', 'Rå sild'],
};
export const foodKey = (item) => `${NS}.food.${item.replace(/^.*:/, '')}`;

/** Danish compound form used before "-spawnæg" (as in vanilla "Torske-spawnæg"). */
const DA_EGG = {
  perch: 'Aborre', pike: 'Gedde', zander: 'Sandart', brown_trout: 'Ørred', carp: 'Karpe', wels_catfish: 'Malle', eel: 'Ål',
  herring: 'Silde', mackerel: 'Makrel', plaice: 'Rødspætte', garfish: 'Hornfiske', lumpfish: 'Stenbider', wolffish: 'Havkat',
  clownfish: 'Klovnfiske', blue_tang: 'Kirurgfiske', lionfish: 'Dragefiske', swordfish: 'Sværdfiske', ocean_sunfish: 'Klumpfiske',
  manta_ray: 'Djævlerokke', hammerhead: 'Hammerhaj', great_white: 'Hvidhaj', whale_shark: 'Hvalhaj',
  harbour_seal: 'Spættet sæl', grey_seal: 'Gråsæl', walrus: 'Hvalros',
  harbour_porpoise: 'Marsvin', orca: 'Spækhugger', beluga: 'Hvidhval', narwhal: 'Narhval', humpback: 'Pukkelhval',
  sperm_whale: 'Kaskelot', blue_whale: 'Blåhval',
  emperor_penguin: 'Kejserpingvin', king_penguin: 'Kongepingvin', gentoo_penguin: 'Æselpingvin',
};

const UI = {
  'aquatic.guide.title': ['Fish Guide', 'Fiskebog'],
  'aquatic.guide.intro': [
    'Creatures you have spotted or caught appear here. Swim or fish near one to add it.',
    'Dyr, du har set eller fanget, dukker op her. Svøm eller fisk tæt på et for at tilføje det.',
  ],
  'aquatic.guide.spotted': ['New in your Fish Guide: %s', 'Nyt i din fiskebog: %s'],
  'aquatic.guide.back': ['Back to the Fish Guide', 'Tilbage til fiskebogen'],
  'aquatic.guide.welcome': [
    '§bYou received a Fish Guide!§r Use it to see the creatures you have spotted and caught.',
    '§bDu har fået en fiskebog!§r Brug den til at se de dyr, du har set og fanget.',
  ],
  'aquatic.guide.lives_in': ['Lives in:', 'Lever i:'],
  'aquatic.guide.traits': ['Traits:', 'Kendetegn:'],
  'aquatic.guide.breed_with': ['Breed with:', 'Avl med:'],
  'aquatic.guide.tame_with': ['Tame with:', 'Tæm med:'],
  'aquatic.guide.bites': ['Bites best:', 'Bider bedst:'],
  'aquatic.guide.rod': ['Catch it with:', 'Fang den med:'],
  'aquatic.guide.best': ['Your biggest:', 'Din største:'],
  'aquatic.guide.not_caught': ['not caught yet', 'ikke fanget endnu'],
  'aquatic.time.day': ['by day', 'om dagen'],
  'aquatic.time.night': ['at night', 'om natten'],
  'aquatic.time.dusk': ['at dawn and dusk', 'ved daggry og skumring'],
  'aquatic.time.any': ['any time', 'hele døgnet'],
  'aquatic.fishing.bite': ['§eA bite! Use the rod to strike!', '§eDer er bid! Brug stangen for at give tilslag!'],
  'aquatic.fishing.missed': ['It got away before you struck.', 'Den slap væk, før du gav tilslag.'],
  'aquatic.fishing.hooked': ['§aHooked! Hold sneak to reel in, let go when the line is tight.', '§aFisken hænger! Hold snig nede for at spole ind, og slip, når linen er stram.'],
  'aquatic.fishing.tension': ['Line', 'Line'],
  'aquatic.fishing.distance': ['%s m', '%s m'],
  'aquatic.fishing.snapped': ['§cSnap! The line broke.', '§cKnæk! Linen sprang.'],
  'aquatic.fishing.escaped': ['§cIt took all your line and got away.', '§cDen tog al linen og slap væk.'],
  'aquatic.fishing.caught': ['§aYou caught a %s: %s kg', '§aDu fangede en %s: %s kg'],
  'aquatic.fishing.record': ['§6A new personal best!', '§6Ny personlig rekord!'],
  'aquatic.fishing.junk': ['You reeled in some junk.', 'Du fik noget skrammel på krogen.'],
  'aquatic.fishing.treasure': ['§6You reeled in a treasure!', '§6Du fik en skat på krogen!'],
  'aquatic.fishing.too_strong': ['§cToo strong for this rod. You need a Sea Rod.', '§cFor stærk til denne stang. Du skal bruge en havstang.'],
  'aquatic.catch.weight': ['%s kg', '%s kg'],
  'aquatic.seal.fetched': ['Your seal brought you a fish!', 'Din sæl kom med en fisk til dig!'],
  'aquatic.whale.hold': ['Holding on: look where to swim, sneak to let go.', 'Du holder fast: kig derhen, hvor du vil svømme, og snig for at give slip.'],
  'action.interact.aquatic.hold_fin': ['Hold on', 'Hold fast'],
};

/**
 * Lang entries for one locale as [key, value] pairs.
 * animals/items come from the build; `description` is the pack description.
 */
export function langEntries(locale, { animals, items, extraEntities = [], description, version }) {
  const i = LOCALES.indexOf(locale);
  const da = locale === 'da_DK' ? STRINGS.da : null;
  const pick = (pair) => pair[Math.max(0, i)];
  const animalName = (id) => da?.names[id] ?? animals.find((a) => a.id === id)?.name ?? id;
  const out = [];
  out.push(['pack.description', da
    ? `Havets dyr: fisk, hajer, sæler, hvaler og pingviner til Minecraft Bedrock, med fiskestænger (v${version})`
    : `${description} (v${version})`]);

  for (const a of animals) {
    out.push([`entity.${NS}:${a.id}.name`, animalName(a.id)]);
    out.push([`item.spawn_egg.entity.${NS}:${a.id}.name`, da ? `${DA_EGG[a.id] ?? animalName(a.id)}-spawnæg` : `${a.name} Spawn Egg`]);
    out.push([`${NS}.guide.entry.${a.id}`, da?.guide[a.id] ?? guide[a.id] ?? '']);
  }
  for (const e of extraEntities) {
    out.push([`entity.${NS}:${e.id}.name`, da?.items[e.id] ?? e.name]);
    out.push([`item.spawn_egg.entity.${NS}:${e.id}.name`, da?.items[e.id] ?? e.name]);
  }
  for (const item of items) {
    let name = da?.items[item.id] ?? item.name;
    if (item.bucketOf) name = da ? `Spand med ${animalName(item.bucketOf).toLowerCase()}` : item.name;
    out.push([`item.${NS}:${item.id}.name`, name]);
  }

  for (const [id, name] of Object.entries(BIOME_NAMES)) out.push([`${NS}.habitat.${id}`, da?.habitats[name] ?? name]);
  for (const [id, name] of Object.entries(TAGS)) out.push([`${NS}.tag.${id}`, da?.tags[name] ?? name]);
  for (const [id, name] of Object.entries(GROUPS)) out.push([`${NS}.group.${id}`, da?.groups[name] ?? name]);
  for (const [item, pair] of Object.entries(FOODS)) out.push([foodKey(item), pick(pair)]);
  for (const [key, pair] of Object.entries(UI)) out.push([key, pick(pair)]);
  return out;
}

/** Every breed/tame food must have a translation. */
export function missingFoods(animals) {
  const used = new Set(animals.flatMap((a) => [...(a.breed ?? []), ...(a.tame?.items ?? [])]));
  return [...used].filter((item) => !FOODS[item]);
}
