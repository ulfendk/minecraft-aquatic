package dk.ulfen.aquatic.fishing;

import net.fabricmc.fabric.api.loot.v3.LootTableEvents;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.Identifier;
import net.minecraft.world.level.storage.loot.BuiltInLootTables;
import net.minecraft.world.level.storage.loot.entries.LootItem;

/** The ordinary fishing rod catches some of our fish too: they join vanilla's fish pool. */
public final class VanillaRodLoot {
	private VanillaRodLoot() {}

	public static void register() {
		LootTableEvents.MODIFY.register((key, table, source, registries) -> {
			if (!key.equals(BuiltInLootTables.FISHING_FISH) || !source.isBuiltin()) return;
			table.modifyPools(pool -> {
				for (CatchTable.VanillaRod v : CatchTable.get().vanillaRod()) {
					pool.add(LootItem.lootTableItem(BuiltInRegistries.ITEM.getValue(Identifier.parse(v.item()))).setWeight(v.weight()).build());
				}
			});
		});
	}
}
