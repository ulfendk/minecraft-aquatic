package dk.ulfen.aquatic.entity;

import com.geckolib.animatable.GeoEntity;
import com.geckolib.animatable.manager.AnimatableManager;
import com.geckolib.animation.AnimationController;
import com.geckolib.animation.RawAnimation;
import com.geckolib.animation.object.PlayState;
import com.geckolib.constant.DataTickets;

import dk.ulfen.aquatic.species.Species;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.phys.Vec3;

/** Shared by every Sea Life creature, whether it lives in the water or comes ashore. */
public interface AquaticCreature extends GeoEntity {
	/** One-shot animations the server can trigger. */
	String[] ACTIONS = {"attack"};

	/**
	 * Entity tag Realistic Hunting puts on a fish it has brought down (a carcass that floats
	 * until it's field dressed). It then turns belly up; see {@link #isCarcass()}.
	 */
	String HUNTING_CARCASS = "hunting.carcass";

	Species species();

	boolean isResting();

	/** Synced from the {@link #HUNTING_CARCASS} tag (tags aren't sent to clients). */
	boolean isCarcass();

	default boolean isSliding() {
		return false;
	}

	default boolean isSitting() {
		return false;
	}

	/** Play a one-shot animation on all clients, if this species has it. */
	default void playAction(String name) {
		if (species().hasAnimation(name)) triggerAnim("action", name);
	}

	/** Movement/posture animations plus a channel for triggered one-shots. */
	static <T extends Mob & AquaticCreature> void registerControllers(T creature, AnimatableManager.ControllerRegistrar controllers) {
		Species s = creature.species();
		controllers.add(new AnimationController<T>("move", 4, state -> {
			T e = state.animatable();
			Vec3 v = state.getDataOrDefault(DataTickets.VELOCITY, Vec3.ZERO);
			double speed = Math.sqrt(v.x * v.x + v.z * v.z) * 20;
			String anim = pickMove(e, s, speed);
			if (anim == null) return PlayState.STOP;
			if (anim.equals("dead")) return state.setAndContinue(RawAnimation.begin().thenPlayAndHold(s.animation(anim)));
			return state.setAndContinue(RawAnimation.begin().thenLoop(s.animation(anim)));
		}));
		AnimationController<T> action = new AnimationController<>("action", 2, state -> PlayState.STOP);
		for (String name : ACTIONS) {
			if (s.hasAnimation(name)) action.triggerableAnim(name, RawAnimation.begin().thenPlay(s.animation(name)));
		}
		controllers.add(action);
	}

	private static String pickMove(Mob e, Species s, double speed) {
		AquaticCreature c = (AquaticCreature) e;
		if (c.isCarcass() && s.hasAnimation("dead")) return "dead";
		if (s.isFish() && !e.isInWater() && s.hasAnimation("flop")) return "flop";
		if (c.isResting() && s.hasAnimation("sleep")) return "sleep";
		if (c.isSitting() && s.hasAnimation("sit")) return "sit";
		if (c.isSliding() && s.hasAnimation("slide")) return "slide";
		if (e.isInWater() && s.hasAnimation("swim")) return "swim";
		if (speed > s.runSpeed() && s.hasAnimation("run")) return "run";
		if (speed > 0.4 && s.hasAnimation("walk")) return "walk";
		return s.hasAnimation("idle") ? "idle" : null;
	}
}
