package dk.ulfen.aquatic.species;

import java.util.List;
import java.util.Set;

/**
 * One creature's settings, generated from the shared specs into data/aquatic/species.json
 * by tools/java.mjs. Field names match the JSON.
 */
public record Species(
	String id,
	String kind,
	String group,
	float width,
	float height,
	double health,
	double speed,
	double swimSpeed,
	double attackDamage,
	double attackSpeed,
	double knockbackResistance,
	boolean alertsPack,
	List<String> hunts,
	int huntInterval,
	double huntRange,
	List<String> fleesFrom,
	float fleeDistance,
	double fleeSpeed,
	double panicSpeed,
	Hostile hostile,
	String sleeps,
	String movement,
	boolean school,
	boolean bottom,
	boolean bucket,
	boolean poisonous,
	boolean huntable,
	int breath,
	int breaches,
	boolean followsSwimmers,
	boolean babies,
	float babyScale,
	float scale,
	int roam,
	List<String> breed,
	List<String> tempt,
	Tame tame,
	double rideHeight,
	double rideOffset,
	Sounds sounds,
	Set<String> animations,
	double runSpeed,
	List<Spawn> spawns,
	List<String> egg
) {
	public record Hostile(double range, String when) {}

	public record Tame(List<String> items, float chance, double damage) {}

	public record Sounds(String ambient, String hurt, String death, float pitchMin, float pitchMax, int interval) {}

	public record Spawn(List<String> biomes, int weight, int min, int max, boolean water, int minY, int maxY) {}

	public boolean isSwimmer() {
		return "swimmer".equals(kind);
	}

	/** Fish and sharks: gills, can't leave the water. */
	public boolean isFish() {
		return "swim".equals(movement);
	}

	/** Whales, seals and penguins breathe air. */
	public boolean breathesAir() {
		return !isFish();
	}

	public boolean isWhale() {
		return "cetacean".equals(movement);
	}

	public boolean isPenguin() {
		return "penguin".equals(movement);
	}

	public boolean rideable() {
		return rideHeight > 0;
	}

	public boolean waterOnly() {
		return !spawns.isEmpty() && spawns.stream().allMatch(Spawn::water);
	}

	public boolean attacks() {
		return attackDamage > 0;
	}

	public boolean hasAnimation(String name) {
		return animations.contains(name);
	}

	/** Full GeckoLib animation name, e.g. animation.aquatic.orca.swim. */
	public String animation(String name) {
		return "animation.aquatic." + id + "." + name;
	}
}
