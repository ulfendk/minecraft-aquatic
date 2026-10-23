package dk.ulfen.aquatic.fishing;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import dk.ulfen.aquatic.AquaticRegistry;
import dk.ulfen.aquatic.FishGuide;
import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.core.component.DataComponents;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.network.chat.MutableComponent;
import net.minecraft.resources.Identifier;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.tags.FluidTags;
import net.minecraft.util.RandomSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.entity.projectile.FishingHook;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.component.ItemLore;
import net.minecraft.world.phys.Vec3;

/**
 * The fight after the strike, the same as on Bedrock (scripts/fishing.js): the fish pulls, harder
 * in bursts; holding sneak reels in but strains the line, letting go eases the tension while the
 * fish takes line. Too much tension snaps the line, too much line lost and it gets away.
 */
public final class Fights {
	private static final Map<UUID, Fight> FIGHTS = new HashMap<>();

	private Fights() {}

	static final class Fight {
		final ServerPlayer player;
		final FishingHook hook;
		final String rod;
		final InteractionHand hand;
		final CatchTable.Catch fish;
		final String item;
		double tension = 20, line, stamina;
		int burst;

		Fight(ServerPlayer player, FishingHook hook, String rod, InteractionHand hand, CatchTable.Catch fish, String item) {
			this.player = player;
			this.hook = hook;
			this.rod = rod;
			this.hand = hand;
			this.fish = fish;
			this.item = item;
			this.line = player.position().distanceTo(hook.position());
			CatchTable.Fight f = CatchTable.get().fight();
			this.stamina = f.stamina() + f.staminaPerFight() * fish.fight();
		}
	}

	public static boolean isFighting(ServerPlayer player) {
		return FIGHTS.containsKey(player.getUUID());
	}

	// ---------------------------------------------------------------- what bites

	/** Habitat keys for the water at a position (biome first, then "lakes" for any other water). */
	static List<String> habitatsAt(ServerLevel level, BlockPos pos) {
		String biome = level.getBiome(pos).unwrapKey().map(k -> k.identifier().toString()).orElse("");
		List<String> out = new ArrayList<>();
		for (var e : CatchTable.get().habitats().entrySet()) if (e.getValue().contains(biome)) out.add(e.getKey());
		if (out.isEmpty()) out.add("lakes");
		return out;
	}

	static int depthAt(ServerLevel level, BlockPos pos) {
		int depth = 0;
		for (int y = 0; y < 64; y++) {
			if (level.getFluidState(pos.below(y)).is(FluidTags.WATER)) depth++;
			else if (depth > 0) break;
		}
		return depth;
	}

	static String timeOfDay(ServerLevel level) {
		long t = level.getDefaultClockTime() % 24000;
		if (t >= 1000 && t < 11500) return "day";
		if (t >= 13500 && t < 22500) return "night";
		return "dusk";
	}

	/** Pick a fish for this spot, or null when nothing in the catch table lives here. */
	public static CatchTable.Catch pick(ServerLevel level, BlockPos pos, RandomSource random) {
		List<String> habitats = habitatsAt(level, pos);
		int depth = depthAt(level, pos);
		String now = timeOfDay(level);
		List<CatchTable.Catch> options = new ArrayList<>();
		List<Double> weights = new ArrayList<>();
		double total = 0;
		for (CatchTable.Catch c : CatchTable.get().catches()) {
			if (c.biomes().stream().noneMatch(habitats::contains) || depth < c.depth().get(0) || depth > c.depth().get(1)) continue;
			double w = c.rarity() * ("any".equals(c.time()) ? 1 : c.time().equals(now) ? 2 : 0.5) * (level.isRaining() ? 1.2 : 1);
			options.add(c);
			weights.add(w);
			total += w;
		}
		if (options.isEmpty()) return null;
		double roll = random.nextDouble() * total;
		for (int i = 0; i < options.size(); i++) if ((roll -= weights.get(i)) <= 0) return options.get(i);
		return options.get(options.size() - 1);
	}

	// ---------------------------------------------------------------- strike

	static void strike(ServerPlayer player, FishingHook hook, String rodId, InteractionHand hand) {
		ServerLevel level = (ServerLevel) player.level();
		CatchTable.Rod rod = CatchTable.get().rods().get(rodId);
		RandomSource random = player.getRandom();
		double r = random.nextDouble();
		if (r < rod.treasure() + rod.junk()) {
			List<String> list = r < rod.treasure() ? CatchTable.get().treasure() : CatchTable.get().junk();
			give(player, new ItemStack(item(list.get(random.nextInt(list.size())))));
			player.sendOverlayMessage(Component.translatable(r < rod.treasure() ? "aquatic.fishing.treasure" : "aquatic.fishing.junk"));
			end(player, hook, hand, 1);
			return;
		}
		CatchTable.Catch fish = pick(level, hook.blockPosition(), random);
		if (fish == null) {
			give(player, new ItemStack(Items.KELP));
			player.sendOverlayMessage(Component.translatable("aquatic.fishing.junk"));
			end(player, hook, hand, 1);
			return;
		}
		if (fish.fight() > rod.maxFight()) {
			player.sendOverlayMessage(Component.translatable("aquatic.fishing.too_strong").withStyle(ChatFormatting.RED));
			level.playSound(null, player.blockPosition(), SoundEvents.ITEM_BREAK.value(), SoundSource.PLAYERS, 1.0F, 1.0F);
			end(player, hook, hand, 2);
			return;
		}
		FIGHTS.put(player.getUUID(), new Fight(player, hook, rodId, hand, fish, fish.id()));
		player.sendOverlayMessage(Component.translatable("aquatic.fishing.hooked").withStyle(ChatFormatting.GREEN));
		level.playSound(null, hook.blockPosition(), SoundEvents.FISHING_BOBBER_SPLASH, SoundSource.NEUTRAL, 1.0F, 0.8F);
	}

	// ---------------------------------------------------------------- every tick

	public static void tick(MinecraftServer server) {
		if (FIGHTS.isEmpty()) return;
		CatchTable.Fight f = CatchTable.get().fight();
		for (Fight fight : new ArrayList<>(FIGHTS.values())) {
			ServerPlayer player = fight.player;
			FishingHook hook = fight.hook;
			if (player.isRemoved() || hook.isRemoved() || player.fishing != hook || !(player.getItemInHand(fight.hand).getItem() instanceof AnglerRodItem)) {
				if (!player.isRemoved() && hook.isRemoved()) player.sendOverlayMessage(Component.translatable("aquatic.fishing.escaped"));
				FIGHTS.remove(player.getUUID());
				continue;
			}
			CatchTable.Rod rod = CatchTable.get().rods().get(fight.rod);
			RandomSource random = player.getRandom();
			int strength = fight.fish.fight();
			if (fight.burst > 0) fight.burst--;
			else if (random.nextDouble() < f.burstChance() * strength && fight.stamina > 0) fight.burst = f.burstMin() + random.nextInt(f.burstMax() - f.burstMin());
			boolean tired = fight.stamina <= 0;
			double pull = tired ? f.tiredPull() * strength : strength * (0.6 + random.nextDouble()) * (fight.burst > 0 ? 2 : 1);
			if (player.isShiftKeyDown()) {
				fight.tension += f.base() + pull * rod.strain();
				fight.line -= rod.reel();
				fight.stamina -= f.drainReel();
			} else {
				fight.tension = Math.max(0, fight.tension - f.relax());
				fight.line += pull * f.takeLine();
				fight.stamina -= f.drainIdle();
			}
			// The bobber follows the fish along the line.
			Vec3 from = player.position();
			Vec3 dir = new Vec3(hook.getX() - from.x, 0, hook.getZ() - from.z);
			if (dir.lengthSqr() > 1.0E-4) {
				dir = dir.normalize().scale(Math.max(0.5, fight.line));
				hook.setPos(from.x + dir.x, hook.getY(), from.z + dir.z);
			}
			if (server.getTickCount() % 4 == 0) player.sendOverlayMessage(hud(fight));
			if (fight.burst > 0 && server.getTickCount() % 8 == 0) {
				((ServerLevel) player.level()).playSound(null, hook.blockPosition(), SoundEvents.GENERIC_SPLASH, SoundSource.NEUTRAL, 0.5F, 1.4F);
			}
			if (fight.tension >= 100) {
				player.sendOverlayMessage(Component.translatable("aquatic.fishing.snapped").withStyle(ChatFormatting.RED));
				player.level().playSound(null, player.blockPosition(), SoundEvents.ITEM_BREAK.value(), SoundSource.PLAYERS, 1.0F, 1.0F);
				FIGHTS.remove(player.getUUID());
				end(player, hook, fight.hand, 2);
			} else if (fight.line >= Math.min(f.maxLine(), 30)) {
				player.sendOverlayMessage(Component.translatable("aquatic.fishing.escaped").withStyle(ChatFormatting.RED));
				FIGHTS.remove(player.getUUID());
				end(player, hook, fight.hand, 0);
			} else if (fight.line <= f.landAt()) {
				FIGHTS.remove(player.getUUID());
				land(fight);
			}
		}
	}

	private static Component hud(Fight fight) {
		int n = (int) Math.round(Math.max(0, Math.min(100, fight.tension)) / 10);
		ChatFormatting colour = fight.tension > 80 ? ChatFormatting.RED : fight.tension > 55 ? ChatFormatting.GOLD : ChatFormatting.GREEN;
		return Component.translatable("aquatic.fishing.tension").append(" ")
			.append(Component.literal("|".repeat(n)).withStyle(colour))
			.append(Component.literal("|".repeat(10 - n)).withStyle(ChatFormatting.DARK_GRAY))
			.append("  ").append(Component.translatable("aquatic.fishing.distance", Math.max(0, Math.round(fight.line))));
	}

	// ---------------------------------------------------------------- landing

	private static void land(Fight fight) {
		ServerPlayer player = fight.player;
		RandomSource random = player.getRandom();
		double min = fight.fish.weight().get(0), max = fight.fish.weight().get(1);
		double kg = min + (max - min) * Math.pow(random.nextDouble(), 2);
		String text = kg < 1 ? String.format(java.util.Locale.ROOT, "%.2f", kg) : String.format(java.util.Locale.ROOT, "%.1f", kg);
		Identifier id = Identifier.parse(fight.item);
		Item item = BuiltInRegistries.ITEM.getValue(id);
		boolean ours = id.getNamespace().equals("aquatic");
		String species = id.getPath();
		// Small fish go straight into a water bucket in the off hand.
		ItemStack off = player.getOffhandItem();
		if (ours && AquaticRegistry.BUCKETS.containsKey(species) && off.is(Items.WATER_BUCKET)) {
			player.setItemInHand(InteractionHand.OFF_HAND, new ItemStack(AquaticRegistry.BUCKETS.get(species)));
			player.level().playSound(null, player.blockPosition(), SoundEvents.BUCKET_FILL_FISH, SoundSource.PLAYERS, 1.0F, 1.0F);
		} else {
			ItemStack stack = new ItemStack(item);
			stack.set(DataComponents.LORE, new ItemLore(List.of(Component.translatable("aquatic.catch.weight", text).withStyle(ChatFormatting.GRAY))));
			give(player, stack);
		}
		MutableComponent name = ours ? Component.translatable("entity.aquatic." + species) : Component.translatable(item.getDescriptionId());
		player.sendOverlayMessage(Component.translatable("aquatic.fishing.caught", name, text).withStyle(ChatFormatting.GREEN));
		player.level().playSound(null, player.blockPosition(), SoundEvents.EXPERIENCE_ORB_PICKUP, SoundSource.PLAYERS, 0.8F, 1.2F);
		if (ours && FishGuide.recordCatch(player, species, kg)) {
			player.sendSystemMessage(Component.translatable("aquatic.fishing.record").withStyle(ChatFormatting.GOLD));
		}
		end(player, fight.hook, fight.hand, 1);
	}

	private static void end(ServerPlayer player, FishingHook hook, InteractionHand hand, int wear) {
		hook.discard();
		player.fishing = null;
		if (wear > 0) player.getItemInHand(hand).hurtAndBreak(wear, player, hand);
	}

	private static Item item(String id) {
		return BuiltInRegistries.ITEM.getValue(Identifier.parse(id));
	}

	private static void give(ServerPlayer player, ItemStack stack) {
		if (!player.getInventory().add(stack)) player.spawnAtLocation((ServerLevel) player.level(), stack);
	}
}
