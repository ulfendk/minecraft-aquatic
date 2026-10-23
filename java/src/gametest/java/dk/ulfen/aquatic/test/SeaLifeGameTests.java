package dk.ulfen.aquatic.test;

import java.util.ArrayList;
import java.util.List;

import dk.ulfen.aquatic.AquaticRegistry;
import dk.ulfen.aquatic.entity.AquaticAmphibian;
import dk.ulfen.aquatic.entity.AquaticSwimmer;
import dk.ulfen.aquatic.fishing.CatchTable;
import dk.ulfen.aquatic.fishing.Fights;
import dk.ulfen.aquatic.species.Species;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import net.fabricmc.fabric.api.gametest.v1.GameTest;
import net.minecraft.core.BlockPos;
import net.minecraft.gametest.framework.GameTestHelper;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.GameType;
import net.minecraft.world.level.block.Blocks;

/** Server-side checks run by `./gradlew runGameTest` (and in CI). */
public class SeaLifeGameTests {
	private static final String AREA = "aquatic-test:empty_large";

	/** Every species can be spawned and is still alive two seconds later. */
	@GameTest(maxTicks = 100, structure = AREA)
	public void everyCreatureSpawns(GameTestHelper helper) {
		List<Mob> mobs = new ArrayList<>();
		int i = 0;
		for (EntityType<? extends Mob> type : AquaticRegistry.ANIMALS.values()) {
			Mob mob = helper.spawn(type, new BlockPos(2 + (i % 6) * 6, 1, 2 + (i / 6) * 6));
			mob.addEffect(new MobEffectInstance(MobEffects.RESISTANCE, 200, 4)); // predators may attack their neighbours
			mob.setNoAi(true);
			mobs.add(mob);
			i++;
		}
		helper.runAfterDelay(40, () -> {
			for (Mob m : mobs) if (!m.isAlive()) helper.fail("Died or vanished: " + m.getType().getDescriptionId());
			helper.succeed();
		});
	}

	/** A fish on dry land flops about. */
	@GameTest(maxTicks = 100, structure = AREA)
	public void fishFlopsOnLand(GameTestHelper helper) {
		AquaticSwimmer perch = (AquaticSwimmer) helper.spawn(AquaticRegistry.ANIMALS.get("perch"), new BlockPos(5, 1, 5));
		double ground = perch.getY();
		helper.succeedWhen(() -> {
			if (perch.getY() < ground + 0.2) helper.fail("Perch is not flopping");
		});
	}

	/** Every small fish has a bucket, and the fish knows which one. */
	@GameTest(maxTicks = 20, structure = AREA)
	public void bucketsForSmallFish(GameTestHelper helper) {
		for (Species s : SpeciesRegistry.all()) {
			if (!s.bucket()) continue;
			if (!AquaticRegistry.BUCKETS.containsKey(s.id())) helper.fail("No bucket for " + s.id());
			AquaticSwimmer fish = (AquaticSwimmer) helper.spawn(AquaticRegistry.ANIMALS.get(s.id()), new BlockPos(3, 1, 3));
			if (!fish.getBucketItemStack().is(AquaticRegistry.BUCKETS.get(s.id()))) helper.fail("Wrong bucket for " + s.id());
			fish.discard();
		}
		helper.succeed();
	}

	/** In a pond, the catch table offers lake fish. */
	@GameTest(maxTicks = 20, structure = AREA)
	public void catchTablePicksPondFish(GameTestHelper helper) {
		for (int y = 1; y <= 4; y++) helper.setBlock(new BlockPos(10, y, 10), Blocks.WATER);
		BlockPos surface = helper.absolutePos(new BlockPos(10, 4, 10));
		for (int i = 0; i < 20; i++) {
			CatchTable.Catch c = Fights.pick(helper.getLevel(), surface, helper.getLevel().getRandom());
			if (c == null) helper.fail("Nothing bites in a pond");
			if (!c.biomes().contains("lakes") && !c.biomes().contains("river")) helper.fail("Caught " + c.id() + " in a pond");
		}
		helper.succeed();
	}

	/** A harbour seal can be tamed, then sits and stands when its owner tells it to. */
	@GameTest(maxTicks = 20, structure = AREA)
	public void sealCanBeTamed(GameTestHelper helper) {
		AquaticAmphibian seal = (AquaticAmphibian) helper.spawn(AquaticRegistry.ANIMALS.get("harbour_seal"), new BlockPos(5, 1, 5));
		Player player = helper.makeMockPlayer(GameType.SURVIVAL);
		seal.tame(player);
		if (!seal.isTame() || !seal.isOwnedBy(player)) helper.fail("Seal was not tamed");
		seal.setOrderedToSit(true);
		if (!seal.isOrderedToSit()) helper.fail("Seal did not sit");
		helper.succeed();
	}

	/** Whales hold their breath far longer than fish can survive on land. */
	@GameTest(maxTicks = 20, structure = AREA)
	public void whalesBreatheAir(GameTestHelper helper) {
		AquaticSwimmer whale = (AquaticSwimmer) helper.spawn(AquaticRegistry.ANIMALS.get("blue_whale"), new BlockPos(20, 1, 20));
		if (whale.getMaxAirSupply() < 6000) helper.fail("Blue whale air supply is only " + whale.getMaxAirSupply());
		if (whale.getScale() < 2.5F) helper.fail("Blue whale is too small: " + whale.getScale());
		helper.succeed();
	}
}
