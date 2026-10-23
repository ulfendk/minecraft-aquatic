package dk.ulfen.aquatic;

import dk.ulfen.aquatic.fishing.CatchTable;
import dk.ulfen.aquatic.fishing.Fights;
import dk.ulfen.aquatic.fishing.VanillaRodLoot;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import dk.ulfen.aquatic.world.AquaticWorldgen;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;

public class SeaLife implements ModInitializer {
	public static final String MOD_ID = "aquatic";

	@Override
	public void onInitialize() {
		SpeciesRegistry.load();
		CatchTable.load();
		AquaticRegistry.register();
		AquaticWorldgen.register();
		VanillaRodLoot.register();
		FishGuide.init();

		ServerTickEvents.END_SERVER_TICK.register(server -> {
			FishGuide.tick(server);
			Fights.tick(server);
		});
		ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> FishGuide.onJoin(handler.getPlayer()));
	}
}
