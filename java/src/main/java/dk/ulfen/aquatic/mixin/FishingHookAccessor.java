package dk.ulfen.aquatic.mixin;

import net.minecraft.world.entity.projectile.FishingHook;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.gen.Accessor;

/** Lets our rods tell whether a fish is biting (the hook's nibble timer) before reeling in. */
@Mixin(FishingHook.class)
public interface FishingHookAccessor {
	@Accessor("nibble")
	int aquatic$getNibble();
}
