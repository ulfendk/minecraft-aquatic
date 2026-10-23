package dk.ulfen.aquatic.world;

import java.util.function.Predicate;

import dk.ulfen.aquatic.AquaticRegistry;
import dk.ulfen.aquatic.species.Species;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectionContext;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.tag.convention.v2.ConventionalBiomeTags;
import net.minecraft.tags.BiomeTags;
import net.minecraft.world.entity.MobCategory;
import net.minecraft.world.level.biome.Biomes;

/** Natural spawns in rivers, lakes, seas and on the shores. */
public final class AquaticWorldgen {
	private AquaticWorldgen() {}

	/** Habitat names used in the shared specs -> biome selectors. */
	private static Predicate<BiomeSelectionContext> biomes(String name) {
		return switch (name) {
			case "river" -> BiomeSelectors.tag(BiomeTags.IS_RIVER);
			case "lakes" -> BiomeSelectors.tag(BiomeTags.IS_FOREST).or(BiomeSelectors.tag(BiomeTags.IS_TAIGA)).or(BiomeSelectors.tag(ConventionalBiomeTags.IS_PLAINS));
			case "swamp" -> BiomeSelectors.includeByKey(Biomes.SWAMP);
			case "mangrove" -> BiomeSelectors.includeByKey(Biomes.MANGROVE_SWAMP);
			case "ocean" -> BiomeSelectors.includeByKey(Biomes.OCEAN, Biomes.DEEP_OCEAN);
			case "deep_ocean" -> BiomeSelectors.tag(BiomeTags.IS_DEEP_OCEAN);
			case "warm_ocean" -> BiomeSelectors.includeByKey(Biomes.WARM_OCEAN);
			case "lukewarm_ocean" -> BiomeSelectors.includeByKey(Biomes.LUKEWARM_OCEAN, Biomes.DEEP_LUKEWARM_OCEAN);
			case "cold_ocean" -> BiomeSelectors.includeByKey(Biomes.COLD_OCEAN, Biomes.DEEP_COLD_OCEAN);
			case "frozen_ocean" -> BiomeSelectors.includeByKey(Biomes.FROZEN_OCEAN, Biomes.DEEP_FROZEN_OCEAN);
			case "beach" -> BiomeSelectors.includeByKey(Biomes.BEACH);
			case "stony_shore" -> BiomeSelectors.includeByKey(Biomes.STONY_SHORE);
			case "snowy_beach" -> BiomeSelectors.includeByKey(Biomes.SNOWY_BEACH);
			case "ice_spikes" -> BiomeSelectors.includeByKey(Biomes.ICE_SPIKES);
			default -> throw new IllegalArgumentException("Unknown habitat " + name);
		};
	}

	public static void register() {
		for (Species s : SpeciesRegistry.all()) {
			for (Species.Spawn spawn : s.spawns()) {
				Predicate<BiomeSelectionContext> selector = spawn.biomes().stream().map(AquaticWorldgen::biomes).reduce(Predicate::or).orElse(c -> false);
				MobCategory category = spawn.water() ? MobCategory.WATER_CREATURE : MobCategory.CREATURE;
				BiomeModifications.addSpawn(selector, category, AquaticRegistry.ANIMALS.get(s.id()), spawn.weight(), spawn.min(), spawn.max());
			}
		}
	}
}
