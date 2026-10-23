// Small fish in a bucket: use a water bucket on one to scoop it up, use the bucket on a block
// to pour it out again, water and all (like vanilla cod and tropical fish).
import { ItemStack, system, world } from '@minecraft/server';
import { SPECIES } from './data.js';
import { isCarcass, short } from './util.js';

const FACES = { Up: [0, 1, 0], Down: [0, -1, 0], North: [0, 0, -1], South: [0, 0, 1], East: [1, 0, 0], West: [-1, 0, 0] };

function setMainhand(player, stack) {
  player.getComponent('minecraft:equippable')?.setEquipment('Mainhand', stack);
}

export function setupBuckets() {
  world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;
    if (itemStack?.typeId !== 'minecraft:water_bucket' || !target.typeId.startsWith('aquatic:')) return;
    const id = short(target.typeId);
    if (!SPECIES[id]?.bucket || isCarcass(target)) return;
    event.cancel = true;
    system.run(() => {
      if (!target.isValid) return;
      const name = target.nameTag;
      target.remove();
      const bucket = new ItemStack(`aquatic:${id}_bucket`, 1);
      if (name) bucket.nameTag = name;
      setMainhand(player, bucket);
      player.dimension.playSound('bucket.fill_fish', player.location);
    });
  });

  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block, blockFace, itemStack, isFirstEvent } = event;
    if (!itemStack?.typeId.startsWith('aquatic:') || !itemStack.typeId.endsWith('_bucket')) return;
    event.cancel = true;
    if (!isFirstEvent) return;
    const id = itemStack.typeId.slice('aquatic:'.length, -'_bucket'.length);
    const name = itemStack.nameTag;
    system.run(() => {
      const water = block.typeId === 'minecraft:water' ? block : block.offset({ x: FACES[blockFace][0], y: FACES[blockFace][1], z: FACES[blockFace][2] });
      if (!water || !(water.isAir || water.typeId === 'minecraft:water')) return;
      water.setType('minecraft:water');
      const at = { x: water.location.x + 0.5, y: water.location.y + 0.2, z: water.location.z + 0.5 };
      try {
        const fish = player.dimension.spawnEntity(`aquatic:${id}`, at, { spawnEvent: 'aquatic:from_bucket' });
        if (name) fish.nameTag = name;
      } catch {}
      setMainhand(player, new ItemStack('minecraft:bucket', 1));
      player.dimension.playSound('bucket.empty_fish', at);
    });
  });
}
