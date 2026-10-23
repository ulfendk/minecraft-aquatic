package dk.ulfen.aquatic.client;

import dk.ulfen.aquatic.AquaticRegistry;
import dk.ulfen.aquatic.entity.AquaticCreature;
import net.fabricmc.api.ClientModInitializer;
import net.minecraft.client.renderer.entity.EntityRenderers;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;

public class SeaLifeClient implements ClientModInitializer {
	@Override
	@SuppressWarnings("unchecked")
	public void onInitializeClient() {
		for (EntityType<? extends Mob> type : AquaticRegistry.ANIMALS.values()) {
			registerAnimal((EntityType<AquaticType>) (EntityType<?>) type);
		}
	}

	private static <T extends Mob & AquaticCreature> void registerAnimal(EntityType<T> type) {
		EntityRenderers.register(type, context -> new AquaticRenderer<>(context, type));
	}

	/** Type-only helper so the raw entity types can be passed to the generic registration. */
	private abstract static class AquaticType extends Mob implements AquaticCreature {
		private AquaticType() {
			super(null, null);
		}
	}
}
