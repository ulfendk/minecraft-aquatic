package dk.ulfen.aquatic.item;

import dk.ulfen.aquatic.FishGuide;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.Level;

/** Shows the creatures you have spotted and caught (in chat; hover a name to read about it). */
public class FishGuideItem extends Item {
	public FishGuideItem(Item.Properties properties) {
		super(properties);
	}

	@Override
	public InteractionResult use(Level level, Player player, InteractionHand hand) {
		player.playSound(SoundEvents.BOOK_PAGE_TURN, 1.0F, 1.0F);
		if (player instanceof ServerPlayer sp) FishGuide.show(sp);
		return InteractionResult.SUCCESS;
	}
}
