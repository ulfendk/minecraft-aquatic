package dk.ulfen.aquatic.fishing;

import dk.ulfen.aquatic.mixin.FishingHookAccessor;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.FishingRodItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.Level;

/**
 * The Angler's Rod and the Sea Rod. They cast like a vanilla fishing rod, but when a fish bites
 * and you strike, you get one of our fish from the catch table and have to fight it in
 * ({@link Fights}). Nothing biting yet: using the rod reels the line in as usual.
 */
public class AnglerRodItem extends FishingRodItem {
	private final String rod;

	public AnglerRodItem(String rod, Item.Properties properties) {
		super(properties);
		this.rod = rod;
	}

	public String rod() {
		return this.rod;
	}

	@Override
	public InteractionResult use(Level level, Player player, InteractionHand hand) {
		if (player.fishing != null && player instanceof ServerPlayer sp) {
			if (Fights.isFighting(sp)) return InteractionResult.SUCCESS;
			if (((FishingHookAccessor) player.fishing).aquatic$getNibble() > 0) {
				Fights.strike(sp, player.fishing, this.rod, hand);
				return InteractionResult.SUCCESS;
			}
		}
		return super.use(level, player, hand);
	}
}
