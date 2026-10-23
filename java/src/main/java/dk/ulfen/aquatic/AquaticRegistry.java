package dk.ulfen.aquatic;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import dk.ulfen.aquatic.entity.AquaticAmphibian;
import dk.ulfen.aquatic.entity.AquaticSwimmer;
import dk.ulfen.aquatic.fishing.AnglerRodItem;
import dk.ulfen.aquatic.item.FishGuideItem;
import dk.ulfen.aquatic.species.Species;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import net.fabricmc.fabric.api.creativetab.v1.FabricCreativeModeTab;
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Registry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.resources.ResourceKey;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.tags.FluidTags;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.MobCategory;
import net.minecraft.world.entity.SpawnPlacementTypes;
import net.minecraft.world.entity.SpawnPlacements;
import net.minecraft.world.food.FoodProperties;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.MobBucketItem;
import net.minecraft.world.level.ServerLevelAccessor;
import net.minecraft.world.level.levelgen.Heightmap;
import net.minecraft.world.level.material.Fluids;

/** Everything the mod adds to the game registries. */
public final class AquaticRegistry {
	public static final Map<String, EntityType<? extends Mob>> ANIMALS = new LinkedHashMap<>();
	public static final Map<String, Item> SPAWN_EGGS = new LinkedHashMap<>();
	public static final Map<String, Item> ITEMS = new LinkedHashMap<>();
	public static final Map<String, Item> BUCKETS = new LinkedHashMap<>();

	public static Item FISH_GUIDE;

	/** One entry of data/aquatic/items.json (generated from src/items.mjs). */
	record ItemDef(String id, int stack, List<Double> food, boolean bowl, String rod, int durability, String bucketOf) {}

	private AquaticRegistry() {}

	public static Identifier id(String path) {
		return Identifier.fromNamespaceAndPath(SeaLife.MOD_ID, path);
	}

	static void register() {
		registerEntities();
		registerItems();
		registerCreativeTab();
	}

	// ---------------------------------------------------------------- entities

	private static <T extends net.minecraft.world.entity.Entity> EntityType<T> entity(String name, EntityType.Builder<T> builder) {
		ResourceKey<EntityType<?>> key = ResourceKey.create(Registries.ENTITY_TYPE, id(name));
		return Registry.register(BuiltInRegistries.ENTITY_TYPE, key, builder.build(key));
	}

	private static void registerEntities() {
		for (Species s : SpeciesRegistry.all()) {
			EntityType<? extends Mob> type;
			if (s.isSwimmer()) {
				EntityType<AquaticSwimmer> t = entity(s.id(), EntityType.Builder.<AquaticSwimmer>of(AquaticSwimmer::new, MobCategory.WATER_CREATURE)
					.sized(s.width(), s.height()).clientTrackingRange(s.isWhale() || s.scale() > 1.5F ? 16 : 8));
				FabricDefaultAttributeRegistry.register(t, AquaticSwimmer.createAttributes(s));
				SpawnPlacements.register(t, SpawnPlacementTypes.IN_WATER, Heightmap.Types.OCEAN_FLOOR, AquaticRegistry::checkWaterSpawn);
				type = t;
			} else {
				EntityType<AquaticAmphibian> t = entity(s.id(), EntityType.Builder.<AquaticAmphibian>of(AquaticAmphibian::new, MobCategory.CREATURE)
					.sized(s.width(), s.height()).clientTrackingRange(10));
				FabricDefaultAttributeRegistry.register(t, AquaticAmphibian.createAttributes(s));
				SpawnPlacements.register(t, SpawnPlacementTypes.ON_GROUND, Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, AquaticAmphibian::checkSpawn);
				type = t;
			}
			ANIMALS.put(s.id(), type);
		}
	}

	/** Swimmers spawn in water at the depths given in their spec. */
	static boolean checkWaterSpawn(EntityType<? extends Mob> type, ServerLevelAccessor level, EntitySpawnReason reason, BlockPos pos, RandomSource random) {
		if (!level.getFluidState(pos).is(FluidTags.WATER) || !level.getFluidState(pos.above()).is(FluidTags.WATER)) return false;
		if (reason != EntitySpawnReason.NATURAL && reason != EntitySpawnReason.CHUNK_GENERATION) return true;
		Species s = SpeciesRegistry.of(type);
		return s.spawns().stream().anyMatch(sp -> pos.getY() >= sp.minY() && pos.getY() <= sp.maxY());
	}

	// ---------------------------------------------------------------- items

	private static <T extends Item> T item(String name, Function<Item.Properties, T> factory, Item.Properties props) {
		ResourceKey<Item> key = ResourceKey.create(Registries.ITEM, id(name));
		return Registry.register(BuiltInRegistries.ITEM, key, factory.apply(props.setId(key)));
	}

	private static List<ItemDef> itemDefs() {
		try (InputStream in = AquaticRegistry.class.getResourceAsStream("/data/aquatic/items.json")) {
			if (in == null) throw new IllegalStateException("items.json missing from the mod jar (run `npm run build`)");
			return new Gson().fromJson(new InputStreamReader(in, StandardCharsets.UTF_8), new TypeToken<List<ItemDef>>() {}.getType());
		} catch (java.io.IOException e) {
			throw new IllegalStateException("Could not read items.json", e);
		}
	}

	private static void registerItems() {
		for (Species s : SpeciesRegistry.all()) {
			EntityType<? extends Mob> type = ANIMALS.get(s.id());
			SPAWN_EGGS.put(s.id(), item(s.id() + "_spawn_egg", net.minecraft.world.item.SpawnEggItem::new, new Item.Properties().spawnEgg(type)));
		}
		for (ItemDef d : itemDefs()) {
			Item.Properties p = new Item.Properties().stacksTo(d.stack());
			Item registered;
			if (d.rod() != null) {
				registered = item(d.id(), props -> new AnglerRodItem(d.rod(), props), new Item.Properties().durability(d.durability()).repairable(Items.STRING).enchantable(1));
			} else if (d.bucketOf() != null) {
				@SuppressWarnings("unchecked")
				EntityType<? extends Mob> fish = ANIMALS.get(d.bucketOf());
				registered = item(d.id(), props -> new MobBucketItem(fish, Fluids.WATER, SoundEvents.BUCKET_EMPTY_FISH, props), p.stacksTo(1));
				BUCKETS.put(d.bucketOf(), registered);
			} else if ("fish_guide".equals(d.id())) {
				registered = FISH_GUIDE = item(d.id(), FishGuideItem::new, p);
			} else if (d.food() != null) {
				FoodProperties food = new FoodProperties.Builder().nutrition(d.food().get(0).intValue()).saturationModifier(d.food().get(1).floatValue()).build();
				if (d.bowl()) p.usingConvertsTo(Items.BOWL);
				registered = item(d.id(), Item::new, p.food(food));
			} else {
				registered = item(d.id(), Item::new, p);
			}
			ITEMS.put(d.id(), registered);
		}
	}

	private static void registerCreativeTab() {
		CreativeModeTab tab = FabricCreativeModeTab.builder()
			.title(Component.translatable("itemGroup.aquatic"))
			.icon(() -> new ItemStack(ITEMS.get("anglers_rod")))
			.displayItems((params, out) -> {
				ITEMS.values().forEach(out::accept);
				SPAWN_EGGS.values().forEach(out::accept);
			})
			.build();
		Registry.register(BuiltInRegistries.CREATIVE_MODE_TAB, id("aquatic"), tab);
	}
}
