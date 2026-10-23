package dk.ulfen.aquatic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.mojang.serialization.Codec;

import dk.ulfen.aquatic.entity.AquaticCreature;
import dk.ulfen.aquatic.fishing.CatchTable;
import dk.ulfen.aquatic.species.Species;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import net.fabricmc.fabric.api.attachment.v1.AttachmentRegistry;
import net.fabricmc.fabric.api.attachment.v1.AttachmentType;
import net.minecraft.ChatFormatting;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.network.chat.HoverEvent;
import net.minecraft.network.chat.MutableComponent;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.item.ItemStack;

/** Tracks which creatures each player has spotted and their biggest catches, and shows them in chat. */
public final class FishGuide {
	private static final AttachmentType<List<String>> SEEN = AttachmentRegistry.<List<String>>builder()
		.persistent(Codec.STRING.listOf())
		.copyOnDeath()
		.initializer(ArrayList::new)
		.buildAndRegister(AquaticRegistry.id("seen"));
	private static final AttachmentType<Map<String, Float>> CAUGHT = AttachmentRegistry.<Map<String, Float>>builder()
		.persistent(Codec.unboundedMap(Codec.STRING, Codec.FLOAT))
		.copyOnDeath()
		.initializer(HashMap::new)
		.buildAndRegister(AquaticRegistry.id("caught"));
	private static final AttachmentType<Boolean> GIVEN = AttachmentRegistry.<Boolean>builder()
		.persistent(Codec.BOOL)
		.copyOnDeath()
		.initializer(() -> false)
		.buildAndRegister(AquaticRegistry.id("fish_guide_given"));
	private static final List<String> GROUPS = List.of("freshwater", "sea", "tropical", "shark", "seal", "whale", "penguin");

	private FishGuide() {}

	static void init() {}

	private static boolean spot(ServerPlayer player, List<String> seen, String id) {
		if (seen.contains(id)) return false;
		seen.add(id);
		player.sendOverlayMessage(Component.translatable("aquatic.guide.spotted", Component.translatable("entity.aquatic." + id)));
		player.level().playSound(null, player.blockPosition(), SoundEvents.EXPERIENCE_ORB_PICKUP, SoundSource.PLAYERS, 0.6F, 1.4F);
		if (seen.size() == AquaticRegistry.ANIMALS.size()) player.level().playSound(null, player.blockPosition(), SoundEvents.PLAYER_LEVELUP, SoundSource.PLAYERS, 1.0F, 1.0F);
		return true;
	}

	/** Every 2 seconds: record creatures near each player (whales from further away). */
	static void tick(MinecraftServer server) {
		if (server.getTickCount() % 40 != 0) return;
		for (ServerPlayer player : server.getPlayerList().getPlayers()) {
			List<String> seen = new ArrayList<>(player.getAttachedOrCreate(SEEN));
			boolean changed = false;
			for (Mob mob : player.level().getEntitiesOfClass(Mob.class, player.getBoundingBox().inflate(24), m -> m instanceof AquaticCreature)) {
				Species s = ((AquaticCreature) mob).species();
				if (mob.distanceTo(player) > (s.isWhale() ? 24 : 12)) continue;
				changed |= spot(player, seen, BuiltInRegistries.ENTITY_TYPE.getKey(mob.getType()).getPath());
			}
			if (changed) player.setAttached(SEEN, seen);
		}
	}

	/** Remember a catch; true when it beats the player's previous best of that species. */
	public static boolean recordCatch(ServerPlayer player, String id, double kg) {
		List<String> seen = new ArrayList<>(player.getAttachedOrCreate(SEEN));
		if (spot(player, seen, id)) player.setAttached(SEEN, seen);
		Map<String, Float> caught = new HashMap<>(player.getAttachedOrCreate(CAUGHT));
		Float best = caught.get(id);
		if (best != null && best >= kg) return false;
		caught.put(id, (float) (Math.round(kg * 100) / 100.0));
		player.setAttached(CAUGHT, caught);
		return best != null;
	}

	/** Everyone gets a Fish Guide the first time they join. */
	static void onJoin(ServerPlayer player) {
		if (player.getAttachedOrCreate(GIVEN)) return;
		player.setAttached(GIVEN, true);
		player.getInventory().add(new ItemStack(AquaticRegistry.FISH_GUIDE));
		player.sendSystemMessage(Component.translatable("aquatic.guide.welcome"));
	}

	public static void show(ServerPlayer player) {
		List<String> seen = player.getAttachedOrCreate(SEEN);
		player.sendSystemMessage(Component.translatable("aquatic.guide.title").withStyle(ChatFormatting.AQUA, ChatFormatting.BOLD)
			.append(Component.literal(" (" + seen.size() + "/" + AquaticRegistry.ANIMALS.size() + ")").withStyle(ChatFormatting.GRAY)));
		if (seen.isEmpty()) {
			player.sendSystemMessage(Component.translatable("aquatic.guide.intro").withStyle(ChatFormatting.GRAY));
			return;
		}
		Map<String, Float> caught = player.getAttachedOrCreate(CAUGHT);
		for (String group : GROUPS) {
			MutableComponent line = Component.translatable("aquatic.group." + group).withStyle(ChatFormatting.DARK_AQUA).append(": ");
			boolean any = false;
			for (Species s : SpeciesRegistry.all()) {
				if (!s.group().equals(group) || !seen.contains(s.id())) continue;
				if (any) line.append(Component.literal(", ").withStyle(ChatFormatting.GRAY));
				any = true;
				line.append(Component.translatable("entity.aquatic." + s.id()).withStyle(style -> style
					.withColor(caught.containsKey(s.id()) ? ChatFormatting.GOLD : ChatFormatting.GREEN)
					.withHoverEvent(new HoverEvent.ShowText(entry(s, caught.get(s.id()))))));
			}
			if (any) player.sendSystemMessage(line);
		}
	}

	private static Component entry(Species s, Float best) {
		MutableComponent c = Component.translatable("entity.aquatic." + s.id()).withStyle(ChatFormatting.GOLD)
			.append("\n").append(Component.translatable("aquatic.guide.entry." + s.id()).withStyle(ChatFormatting.WHITE));
		List<String> biomes = s.spawns().stream().flatMap(sp -> sp.biomes().stream()).distinct().toList();
		if (!biomes.isEmpty()) {
			c.append("\n").append(Component.translatable("aquatic.guide.lives_in").withStyle(ChatFormatting.DARK_AQUA)).append(" ");
			for (int i = 0; i < biomes.size(); i++) {
				if (i > 0) c.append(", ");
				c.append(Component.translatable("aquatic.habitat." + biomes.get(i)));
			}
		}
		CatchTable.Catch fish = CatchTable.of("aquatic:" + s.id());
		if (fish != null) {
			c.append("\n").append(Component.translatable("aquatic.guide.bites").withStyle(ChatFormatting.DARK_AQUA)).append(" ")
				.append(Component.translatable("aquatic.time." + fish.time()));
			c.append("\n").append(Component.translatable("aquatic.guide.rod").withStyle(ChatFormatting.DARK_AQUA)).append(" ")
				.append(Component.translatable(fish.fight() >= 4 ? "item.aquatic.sea_rod" : "item.aquatic.anglers_rod"));
			c.append("\n").append(Component.translatable("aquatic.guide.best").withStyle(ChatFormatting.DARK_AQUA)).append(" ")
				.append(best != null ? Component.translatable("aquatic.catch.weight", String.valueOf(best)) : Component.translatable("aquatic.guide.not_caught"));
		}
		return c;
	}
}
