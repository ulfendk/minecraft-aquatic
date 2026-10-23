// Custom items: the fish you catch, food, rods, the Fish Guide and fish buckets, with
// pixel-art icons and recipes.
import { pixelIcon } from './lib/texture.mjs';

// ---------------------------------------------------------------- icons

// Fish silhouettes; b back, s side, w belly, f fin, e eye, p pattern.
const SHAPES = {
  fish: [
    '................',
    '................',
    '................',
    '......ff........',
    '.....bbbbb...ff.',
    '...bbbbbpbbb.ff.',
    '..bebbsspssbbff.',
    '.bbbssssspssfff.',
    '.bsssssssspsfff.',
    '..wwwwwwwwwwbff.',
    '...wwwwwwwww.ff.',
    '.....ff.ff...ff.',
    '................',
    '................',
    '................',
    '................',
  ],
  long: [
    '................',
    '................',
    '................',
    '................',
    '..........ff....',
    '.......bbbbbb.ff',
    '.bbbbbbbbpbbbbff',
    'bebsssssspssssff',
    '.wwwwwwwwwwwwwff',
    '.......f..f...ff',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  flat: [
    '................',
    '................',
    '.....ffffff.....',
    '...ffbbbbbbff...',
    '..fbbbpbbbbbbf..',
    '.fbebbbbbbpbbbf.',
    '.fbbebbbpbbbbbff',
    '.fbbbbbbbbbbbbff',
    '.fbbbbpbbbbpbbf.',
    '..fbbbbbbbbbbf..',
    '...ffbbbbbbff...',
    '.....ffffff.....',
    '................',
    '................',
    '................',
    '................',
  ],
  tall: [
    '................',
    '.....ffff.......',
    '....fbbbbf......',
    '...bbbbbbbb..ff.',
    '..bbbbbpbbbbfff.',
    '.bebbsspsssbfff.',
    '.bbsssspsssbbff.',
    '.bsssssspsssbff.',
    '..sssssspsssbff.',
    '..wwwwwwwwwwbff.',
    '...wwwwwwww..ff.',
    '....ffff........',
    '................',
    '................',
    '................',
    '................',
  ],
};

const fishIcon = (shape, c) => pixelIcon(SHAPES[shape], { '.': null, b: c.back, s: c.side, w: c.belly, f: c.fin, e: '#101010', p: c.pattern ?? c.side });

const FISH = {
  perch: { name: 'Raw Perch', shape: 'fish', back: '#4f6b2a', side: '#a5a84a', belly: '#e8e3c8', fin: '#cf5b2c', pattern: '#2f3a17', food: [2, 0.1], cooks: 'cooked_fish' },
  pike: { name: 'Raw Pike', shape: 'long', back: '#344a22', side: '#6f8a3c', belly: '#e6e4c9', fin: '#7a6a3a', pattern: '#c9c46a', food: [2, 0.1], cooks: 'cooked_fish' },
  zander: { name: 'Raw Zander', shape: 'long', back: '#4a5a4a', side: '#9aa696', belly: '#eceee6', fin: '#6f7868', pattern: '#5e6a58', food: [2, 0.1], cooks: 'cooked_fish' },
  brown_trout: { name: 'Raw Brown Trout', shape: 'fish', back: '#5b4a2a', side: '#b8964a', belly: '#f0e2b8', fin: '#8a7046', pattern: '#c03a2a', food: [2, 0.1], cooks: 'cooked_oily_fish' },
  carp: { name: 'Raw Carp', shape: 'tall', back: '#5a4a22', side: '#a07a32', belly: '#e2c98a', fin: '#7a5a2a', pattern: '#6a5020', food: [2, 0.1], cooks: 'cooked_fish' },
  wels_catfish: { name: 'Raw Wels Catfish', shape: 'long', back: '#2a2a1e', side: '#3e3e2c', belly: '#c8c2a8', fin: '#34342a', food: [3, 0.1], cooks: 'cooked_fish' },
  eel: { name: 'Raw Eel', shape: 'long', back: '#2b2a18', side: '#3b3a22', belly: '#c9b45a', fin: '#4a4630', food: [2, 0.1], cooks: 'cooked_oily_fish' },
  herring: { name: 'Raw Herring', shape: 'fish', back: '#2e5a7a', side: '#c8d4dc', belly: '#f2f5f7', fin: '#9fb0bc', food: [2, 0.1], cooks: 'cooked_oily_fish' },
  mackerel: { name: 'Raw Mackerel', shape: 'fish', back: '#2a6a6a', side: '#d8e2e8', belly: '#f4f6f6', fin: '#4a5a60', pattern: '#10202a', food: [2, 0.1], cooks: 'cooked_oily_fish' },
  plaice: { name: 'Raw Plaice', shape: 'flat', back: '#7a6a4a', side: '#7a6a4a', belly: '#efece2', fin: '#6a5c40', pattern: '#e0662a', food: [2, 0.1], cooks: 'fried_plaice' },
  garfish: { name: 'Raw Garfish', shape: 'long', back: '#1e5a50', side: '#c8d8d4', belly: '#f2f6f4', fin: '#5a7a70', food: [2, 0.1], cooks: 'cooked_fish' },
  lumpfish: { name: 'Raw Lumpfish', shape: 'tall', back: '#4a5c66', side: '#5a6f7a', belly: '#e0662a', fin: '#4a5c66', pattern: '#7f949e', food: [2, 0.1], cooks: 'cooked_fish' },
  wolffish: { name: 'Raw Wolffish', shape: 'long', back: '#4e5662', side: '#6a7480', belly: '#b8bcc0', fin: '#4e5662', pattern: '#3a4250', food: [2, 0.1], cooks: 'cooked_fish' },
  clownfish: { name: 'Clownfish', shape: 'fish', back: '#f07a1a', side: '#f07a1a', belly: '#f07a1a', fin: '#1a1612', pattern: '#f8f6f0', food: [1, 0.1] },
  blue_tang: { name: 'Blue Tang', shape: 'tall', back: '#101418', side: '#1f4fd0', belly: '#1f4fd0', fin: '#f2d13b', food: [1, 0.1] },
  lionfish: { name: 'Lionfish', shape: 'tall', back: '#a02a1a', side: '#f4e8dc', belly: '#f4e8dc', fin: '#a02a1a', pattern: '#a02a1a', food: [1, 0.1], cooks: 'cooked_fish' },
  swordfish: { name: 'Raw Swordfish', shape: 'long', back: '#24243e', side: '#7a7a8a', belly: '#d8d8e0', fin: '#2e2e44', food: [3, 0.2], cooks: 'cooked_fish_steak' },
};

const COOKED = { o: '#5a3418', r: '#b8743f' };
const cookedRows = [
  '................',
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '...oorrpprroo...',
  '..orrppwwpprro..',
  '.orrpwwwwwprrroo',
  '.orrppwwwpprrro.',
  '..orrppppprroo..',
  '...oorrrrroo....',
  '.....oooo.......',
  '................',
  '................',
  '................',
  '................',
];
const steakRows = [
  '................',
  '................',
  '................',
  '....oooooooo....',
  '...orrrrrrrro...',
  '..orpppwwpppro..',
  '..orppwwwwppro..',
  '..orppwwwwppro..',
  '..orpppwwpppro..',
  '..orrrrrrrrrro..',
  '...oooooooooo...',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const plate = (rows, palette) => pixelIcon(rows, { '.': null, ...palette });

export const items = [];

// The fish you catch (and that fish drop).
for (const [id, f] of Object.entries(FISH)) {
  items.push({
    id, name: f.name, category: 'nature', food: { nutrition: f.food[0], saturation: f.food[1] },
    icon: fishIcon(f.shape, f), tags: ['aquatic:raw_fish'], cooks: f.cooks, fish: true,
  });
}

items.push(
  { id: 'raw_fish_steak', name: 'Raw Fish Steak', category: 'nature', food: { nutrition: 3, saturation: 0.2 }, icon: plate(steakRows, { o: '#8a3a2a', r: '#d86a5a', p: '#f0a090', w: '#f8d0c0' }), tags: ['aquatic:raw_fish'], cooks: 'cooked_fish_steak' },
  { id: 'cooked_fish_steak', name: 'Cooked Fish Steak', category: 'nature', food: { nutrition: 8, saturation: 0.8 }, icon: plate(steakRows, { o: '#5a3418', r: '#b8743f', p: '#e0b080', w: '#f4e0c0' }) },
  { id: 'cooked_fish', name: 'Cooked White Fish', category: 'nature', food: { nutrition: 6, saturation: 0.6 }, icon: plate(cookedRows, { ...COOKED, w: '#faf2e0', p: '#e8c890' }) },
  { id: 'cooked_oily_fish', name: 'Cooked Oily Fish', category: 'nature', food: { nutrition: 6, saturation: 0.8 }, icon: plate(cookedRows, { ...COOKED, w: '#e8b878', p: '#c88848' }) },
  { id: 'smoked_herring', name: 'Smoked Herring', category: 'nature', food: { nutrition: 6, saturation: 0.9 }, icon: fishIcon('fish', { back: '#6a3a14', side: '#c8862a', belly: '#e8b050', fin: '#8a5020' }) },
  { id: 'fried_plaice', name: 'Fried Plaice', category: 'nature', food: { nutrition: 6, saturation: 0.7 }, icon: fishIcon('flat', { back: '#c8862a', side: '#c8862a', belly: '#c8862a', fin: '#8a5020', pattern: '#e0a850' }) },
  {
    id: 'fish_and_chips', name: 'Fish and Chips', category: 'nature', food: { nutrition: 10, saturation: 0.9 },
    icon: pixelIcon([
      '................',
      '................',
      '.......yy.y.....',
      '.....oooyyyy....',
      '....orrrryyyy...',
      '...orrppprryy...',
      '...orppppprry...',
      '..wwwwwwwwwwwww.',
      '..wkkkwwwwwkkkw.',
      '..wwwwwwwwwwwww.',
      '...wwwwwwwwwww..',
      '....wwwwwwwww...',
      '.....wwwwwww....',
      '................',
      '................',
      '................',
    ], { '.': null, o: '#7a4a1a', r: '#c8862a', p: '#e8b050', y: '#f4d060', w: '#f0eee6', k: '#4a6aa0' }),
  },
  {
    id: 'fish_soup', name: 'Fish Soup', category: 'nature', food: { nutrition: 10, saturation: 0.8 }, stack: 1, bowl: true,
    icon: pixelIcon([
      '................',
      '................',
      '................',
      '................',
      '................',
      '...oooooooooo...',
      '..owwcwwwwcwwo..',
      '..owwwwrwwwwwo..',
      '..obwcwwwwrwbo..',
      '...obbbbbbbbo...',
      '....obbbbbbo....',
      '.....oooooo.....',
      '................',
      '................',
      '................',
      '................',
    ], { '.': null, o: '#4a2e14', b: '#8a5a2a', w: '#f0e6c8', c: '#e8802a', r: '#d86a5a' }),
  },
  {
    id: 'sushi_roll', name: 'Sushi Roll', category: 'nature', food: { nutrition: 6, saturation: 0.6 },
    icon: pixelIcon([
      '................',
      '................',
      '................',
      '................',
      '.....kkkkkk.....',
      '....kwwwwwwk....',
      '...kwwrrrrwwk...',
      '...kwwrrrrwwk...',
      '...kwwwwwwwwk...',
      '....kwwwwwwk....',
      '.....kkkkkk.....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], { '.': null, k: '#1e3a1e', w: '#f6f4ee', r: '#f08a6a' }),
  },
  {
    id: 'stjerneskud', name: 'Stjerneskud', category: 'nature', food: { nutrition: 12, saturation: 1.0 },
    icon: pixelIcon([
      '................',
      '................',
      '................',
      '.......yy.......',
      '.....ywwy.......',
      '....rrppppgg....',
      '...rppppppppg...',
      '..oooooooooooo..',
      '..obbbbbbbbbbo..',
      '..obbbbbbbbbbo..',
      '..oooooooooooo..',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], { '.': null, o: '#5a3418', b: '#a8743a', p: '#e0a850', r: '#f08a6a', g: '#5a9a3a', y: '#f4d040', w: '#fafaf0' }),
  },
  {
    id: 'shark_tooth', name: 'Shark Tooth', category: 'items',
    icon: pixelIcon([
      '................',
      '................',
      '................',
      '.......w........',
      '......www.......',
      '......www.......',
      '.....wwwww......',
      '.....wwwgw......',
      '....wwwwwgw.....',
      '....wwwwwww.....',
      '...wwwwwwwww....',
      '...ggggggggg....',
      '................',
      '................',
      '................',
      '................',
    ], { '.': null, w: '#f6f2e4', g: '#c8c0a8' }),
  },
  {
    id: 'fish_guide', name: 'Fish Guide', category: 'equipment', stack: 1,
    icon: pixelIcon([
      '................',
      '..bbbbbbbbbbb...',
      '..byyyyyyyyyyb..',
      '..bybbbbbbbbyb..',
      '..bybwwwwwwbyb..',
      '..bybwwwwwwbyb..',
      '..bybwkkwwkbyb..',
      '..bybkkkkkkbyb..',
      '..bybwkkwwkbyb..',
      '..bybwwwwwwbyb..',
      '..bybbbbbbbbyb..',
      '..byyyyyyyyyyb..',
      '..bppppppppppb..',
      '..bbbbbbbbbbb...',
      '................',
      '................',
    ], { '.': null, b: '#0b4a6a', y: '#2a8fb8', w: '#e9e2c8', k: '#e8802a', p: '#f4ecd8' }),
  },
  {
    id: 'anglers_rod', name: 'Angler’s Rod', category: 'equipment', stack: 1, rod: true, durability: 128,
    icon: pixelIcon([
      '...........ss...',
      '..........ssl...',
      '.........ss.l...',
      '........ss..l...',
      '.......ss...l...',
      '......ss....l...',
      '.....ss.....l...',
      '....ss......l...',
      '...gs.......l...',
      '..ggi.......l...',
      '..gg........rr..',
      '.gg.........rw..',
      'gg..............',
      '................',
      '................',
      '................',
    ], { '.': null, s: '#8a5a2a', g: '#3a2a1a', l: '#e8e8e0', i: '#c8c8c8', r: '#d02020', w: '#f8f8f8' }),
  },
  {
    id: 'sea_rod', name: 'Sea Rod', category: 'equipment', stack: 1, rod: true, durability: 320,
    icon: pixelIcon([
      '...........ii...',
      '..........iil...',
      '.........ii.l...',
      '........ii..l...',
      '.......ii...l...',
      '......ii....l...',
      '.....ii.....l...',
      '....ii......l...',
      '...gic......l...',
      '..ggcc......l...',
      '..gg........rr..',
      '.gg.........rw..',
      'gg..............',
      '................',
      '................',
      '................',
    ], { '.': null, i: '#b8c0c8', g: '#1a1a1a', l: '#e8e8e0', c: '#c87a3a', r: '#2060d0', w: '#f8f8f8' }),
  },
);

// Small fish can be carried alive in a bucket (see scripts/buckets.js and the Java mod).
const BUCKET = [
  '................',
  '................',
  '...ooooooooo....',
  '..o.........o...',
  '..oiiiiiiiiio...',
  '..owwwwwwwwwo...',
  '..owwffffwwwo...',
  '..owffffeffwo...',
  '...owwwffwwo....',
  '...owwwwwwwo....',
  '...oiiiiiiio....',
  '....oiiiiio.....',
  '....ooooooo.....',
  '................',
  '................',
  '................',
];
export function bucketItems(animals) {
  return animals.filter((a) => a.bucket).map((a) => ({
    id: `${a.id}_bucket`, name: `Bucket of ${a.name}`, category: 'items', stack: 1, bucketOf: a.id,
    icon: pixelIcon(BUCKET, { '.': null, o: '#3a3a3a', i: '#c6c6c6', w: '#3f76e4', f: a.egg[0], e: a.egg[1] }),
  }));
}

/** Shaped/shapeless/furnace recipes (Bedrock format; tools/java.mjs converts them). */
export const recipes = [
  {
    'minecraft:recipe_shaped': {
      description: { identifier: 'aquatic:anglers_rod' },
      tags: ['crafting_table'],
      pattern: ['  S', ' SL', 'SIL'],
      key: { S: { item: 'minecraft:stick' }, L: { item: 'minecraft:string' }, I: { item: 'minecraft:iron_nugget' } },
      result: { item: 'aquatic:anglers_rod' },
      unlock: [{ item: 'minecraft:string' }],
    },
  },
  {
    'minecraft:recipe_shaped': {
      description: { identifier: 'aquatic:sea_rod' },
      tags: ['crafting_table'],
      pattern: ['  I', ' IL', 'CIL'],
      key: { I: { item: 'minecraft:iron_ingot' }, L: { item: 'minecraft:string' }, C: { item: 'minecraft:copper_ingot' } },
      result: { item: 'aquatic:sea_rod' },
      unlock: [{ item: 'minecraft:iron_ingot' }],
    },
  },
  {
    'minecraft:recipe_shapeless': {
      description: { identifier: 'aquatic:fish_guide' },
      tags: ['crafting_table'],
      ingredients: [{ item: 'minecraft:book' }, { item: 'minecraft:cod' }],
      result: { item: 'aquatic:fish_guide' },
      unlock: [{ item: 'minecraft:book' }],
    },
  },
  {
    'minecraft:recipe_shapeless': {
      description: { identifier: 'aquatic:fish_and_chips' },
      tags: ['crafting_table'],
      ingredients: [{ item: 'aquatic:cooked_fish' }, { item: 'minecraft:baked_potato' }, { item: 'minecraft:paper' }],
      result: { item: 'aquatic:fish_and_chips' },
      unlock: [{ item: 'aquatic:cooked_fish' }],
    },
  },
  {
    'minecraft:recipe_shapeless': {
      description: { identifier: 'aquatic:fish_soup' },
      tags: ['crafting_table'],
      ingredients: [{ item: 'minecraft:bowl' }, { tag: 'aquatic:raw_fish' }, { item: 'minecraft:carrot' }, { item: 'minecraft:potato' }],
      result: { item: 'aquatic:fish_soup' },
      unlock: [{ item: 'minecraft:bowl' }],
    },
  },
  {
    'minecraft:recipe_shapeless': {
      description: { identifier: 'aquatic:sushi_roll' },
      tags: ['crafting_table'],
      ingredients: [{ item: 'minecraft:dried_kelp' }, { tag: 'aquatic:raw_fish' }, { item: 'minecraft:wheat' }],
      result: { item: 'aquatic:sushi_roll', count: 2 },
      unlock: [{ item: 'minecraft:dried_kelp' }],
    },
  },
  {
    'minecraft:recipe_shapeless': {
      description: { identifier: 'aquatic:stjerneskud' },
      tags: ['crafting_table'],
      ingredients: [{ item: 'minecraft:bread' }, { item: 'aquatic:fried_plaice' }, { item: 'minecraft:egg' }],
      result: { item: 'aquatic:stjerneskud' },
      unlock: [{ item: 'aquatic:fried_plaice' }],
    },
  },
  {
    'minecraft:recipe_shapeless': {
      description: { identifier: 'aquatic:bone_meal_from_shark_tooth' },
      tags: ['crafting_table'],
      ingredients: [{ item: 'aquatic:shark_tooth' }],
      result: { item: 'minecraft:bone_meal', count: 3 },
      unlock: [{ item: 'aquatic:shark_tooth' }],
    },
  },
];

// Cooking: every raw fish has a cooked version; herring in a smoker becomes røget sild.
for (const item of items.filter((i) => i.cooks)) {
  const smokes = item.id === 'herring';
  recipes.push({
    'minecraft:recipe_furnace': {
      description: { identifier: `aquatic:${item.cooks}_from_${item.id}` },
      tags: smokes ? ['furnace', 'campfire', 'soul_campfire'] : ['furnace', 'smoker', 'campfire', 'soul_campfire'],
      input: `aquatic:${item.id}`,
      output: `aquatic:${item.cooks}`,
    },
  });
}
recipes.push({
  'minecraft:recipe_furnace': {
    description: { identifier: 'aquatic:smoked_herring' },
    tags: ['smoker'],
    input: 'aquatic:herring',
    output: 'aquatic:smoked_herring',
  },
});

export function buildItem(item) {
  const components = {
    'minecraft:icon': `aquatic_${item.id}`,
    'minecraft:display_name': { value: `item.aquatic:${item.id}.name` },
    'minecraft:max_stack_size': item.stack ?? 64,
  };
  if (item.food) {
    Object.assign(components, {
      'minecraft:food': { nutrition: item.food.nutrition, saturation_modifier: item.food.saturation, ...(item.bowl ? { using_converts_to: 'minecraft:bowl' } : {}) },
      'minecraft:use_animation': 'eat',
      'minecraft:use_modifiers': { use_duration: 1.6, movement_modifier: 0.35 },
    });
  }
  if (item.tags) components['minecraft:tags'] = { tags: item.tags };
  if (item.rod) {
    Object.assign(components, {
      'minecraft:hand_equipped': true,
      'minecraft:durability': { max_durability: item.durability },
      'minecraft:repairable': { repair_items: [{ items: ['minecraft:string'], repair_amount: 32 }] },
    });
  }
  Object.assign(components, item.components ?? {});
  return {
    format_version: '1.21.90',
    'minecraft:item': {
      description: { identifier: `aquatic:${item.id}`, menu_category: { category: item.category ?? 'items' } },
      components,
    },
  };
}
