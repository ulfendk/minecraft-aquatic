// The Fish Guide: a book that records every creature you have spotted, and your biggest
// catch of each kind of fish.
import { ItemStack, system, world } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import { ANIMALS, SPECIES } from './data.js';
import { records, saveRecords, short } from './util.js';

const GIVEN = 'aquatic:guide_given';
const GROUP_ORDER = ['freshwater', 'sea', 'tropical', 'shark', 'seal', 'whale', 'penguin'];

/** Spotting: every 2 seconds, record creatures near each player (whales from further away). */
function spot() {
  for (const player of world.getPlayers()) {
    const rec = records(player);
    let changed = false;
    let nearby;
    try {
      nearby = player.dimension.getEntities({ families: ['aquatic'], location: player.location, maxDistance: 24 });
    } catch {
      continue;
    }
    for (const e of nearby) {
      const id = short(e.typeId);
      if (rec.seen.includes(id) || !SPECIES[id]) continue;
      const range = SPECIES[id].movement === 'cetacean' ? 24 : 12;
      const d = Math.hypot(e.location.x - player.location.x, e.location.y - player.location.y, e.location.z - player.location.z);
      if (d > range) continue;
      rec.seen.push(id);
      changed = true;
      player.onScreenDisplay.setActionBar({ rawtext: [{ translate: 'aquatic.guide.spotted', with: { rawtext: [nameOf(id)] } }] });
      player.playSound('random.orb', { pitch: 1.4 });
      if (rec.seen.length === ANIMALS.length) player.playSound('random.levelup');
    }
    if (changed) saveRecords(player, rec);
  }
}

// All visible text goes through lang keys so it follows the player's language.
const nameOf = (id) => ({ translate: `entity.aquatic:${id}.name` });
const list = (keys) => keys.flatMap((key, i) => (i ? [{ text: ', ' }, { translate: key }] : [{ translate: key }]));
const line = (label, keys) => (keys.length ? [{ text: '\n§3' }, { translate: label }, { text: '§r ' }, ...list(keys)] : []);

function order() {
  return [...ANIMALS].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.name.localeCompare(b.name));
}

function openIndex(player) {
  const { seen } = records(player);
  const animals = order();
  const form = new ActionFormData()
    .title({ rawtext: [{ translate: 'aquatic.guide.title' }, { text: ` (${seen.length}/${ANIMALS.length})` }] })
    .body({ translate: 'aquatic.guide.intro' });
  let group = null;
  for (const a of animals) {
    if (a.group !== group) {
      group = a.group;
      form.label({ rawtext: [{ text: '§l' }, { translate: `aquatic.group.${group}` }] });
    }
    if (seen.includes(a.id)) form.button(nameOf(a.id), `textures/ui/aquatic/${a.id}`);
    else form.button('§8???');
  }
  form.show(player).then((res) => {
    if (res.canceled || res.selection === undefined) return;
    const a = animals[res.selection];
    if (seen.includes(a.id)) openEntry(player, a);
    else openIndex(player);
  });
}

function openEntry(player, a) {
  const { caught } = records(player);
  const body = [
    { translate: `aquatic.guide.entry.${a.id}` },
    { text: '\n' },
    ...line('aquatic.guide.lives_in', a.habitats.map((h) => `aquatic.habitat.${h}`)),
    ...line('aquatic.guide.traits', a.tags.map((t) => `aquatic.tag.${t}`)),
    ...line('aquatic.guide.breed_with', a.food.map((f) => `aquatic.food.${f}`)),
    ...line('aquatic.guide.tame_with', a.tame.map((f) => `aquatic.food.${f}`)),
  ];
  if (a.time) {
    body.push(...line('aquatic.guide.bites', [`aquatic.time.${a.time}`]), ...line('aquatic.guide.rod', [`item.aquatic:${a.rod}.name`]));
    body.push({ text: '\n§3' }, { translate: 'aquatic.guide.best' }, { text: '§r ' });
    body.push(caught[a.id] !== undefined ? { translate: 'aquatic.catch.weight', with: [String(caught[a.id])] } : { translate: 'aquatic.guide.not_caught' });
  }
  new ActionFormData()
    .title(nameOf(a.id))
    .body({ rawtext: body })
    .button({ translate: 'aquatic.guide.back' }, `textures/ui/aquatic/${a.id}`)
    .show(player)
    .then((res) => {
      if (!res.canceled) openIndex(player);
    });
}

export function setupFishGuide() {
  system.runInterval(spot, 40);
  world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
    if (itemStack?.typeId !== 'aquatic:fish_guide') return;
    source.playSound('item.book.page_turn');
    system.run(() => openIndex(source));
  });
  // Everyone gets a Fish Guide the first time they join a world with the add-on.
  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn || player.getDynamicProperty(GIVEN)) return;
    player.setDynamicProperty(GIVEN, true);
    system.runTimeout(() => {
      try {
        player.getComponent('minecraft:inventory')?.container?.addItem(new ItemStack('aquatic:fish_guide', 1));
        player.sendMessage({ translate: 'aquatic.guide.welcome' });
      } catch {
        // Player left before the timeout.
      }
    }, 60);
  });
}
