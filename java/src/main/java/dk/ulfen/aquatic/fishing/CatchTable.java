package dk.ulfen.aquatic.fishing;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;

/**
 * What bites where, and how hard it fights: data/aquatic/fishing.json, generated from the
 * same table as the Bedrock add-on (src/fishing.mjs).
 */
public final class CatchTable {
	public record Catch(String id, List<String> biomes, List<Integer> depth, String time, List<Double> weight, int fight, int rarity) {}

	public record Rod(int maxFight, double reel, double strain, double junk, double treasure) {}

	public record Fight(int biteWindow, int waitMin, int waitMax, double base, double relax, double takeLine, double maxLine, double landAt,
		double burstChance, int burstMin, int burstMax, double stamina, double staminaPerFight, double drainReel, double drainIdle, double tiredPull) {}

	public record VanillaRod(String item, int weight) {}

	public record Data(List<Catch> catches, Map<String, Rod> rods, Fight fight, Map<String, List<String>> habitats, List<String> junk,
		List<String> treasure, List<VanillaRod> vanillaRod) {}

	private static Data data;

	private CatchTable() {}

	public static void load() {
		try (InputStream in = CatchTable.class.getResourceAsStream("/data/aquatic/fishing.json")) {
			if (in == null) throw new IllegalStateException("fishing.json missing from the mod jar (run `npm run build`)");
			data = new Gson().fromJson(new InputStreamReader(in, StandardCharsets.UTF_8), Data.class);
		} catch (java.io.IOException e) {
			throw new IllegalStateException("Could not read fishing.json", e);
		}
	}

	public static Data get() {
		return data;
	}

	public static Catch of(String itemId) {
		return data.catches().stream().filter(c -> c.id().equals(itemId)).findFirst().orElse(null);
	}
}
