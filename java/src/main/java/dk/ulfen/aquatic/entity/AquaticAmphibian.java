package dk.ulfen.aquatic.entity;

import java.util.EnumSet;
import java.util.List;

import com.geckolib.animatable.instance.AnimatableInstanceCache;
import com.geckolib.animatable.manager.AnimatableManager;
import com.geckolib.util.GeckoLibUtil;

import dk.ulfen.aquatic.species.Species;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.resources.Identifier;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.tags.BlockTags;
import net.minecraft.tags.FluidTags;
import net.minecraft.util.RandomSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.AgeableMob;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.TamableAnimal;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.goal.BreathAirGoal;
import net.minecraft.world.entity.ai.goal.BreedGoal;
import net.minecraft.world.entity.ai.goal.FollowParentGoal;
import net.minecraft.world.entity.ai.goal.Goal;
import net.minecraft.world.entity.ai.goal.LookAtPlayerGoal;
import net.minecraft.world.entity.ai.goal.PanicGoal;
import net.minecraft.world.entity.ai.goal.RandomLookAroundGoal;
import net.minecraft.world.entity.ai.goal.RandomSwimmingGoal;
import net.minecraft.world.entity.ai.goal.SitWhenOrderedToGoal;
import net.minecraft.world.entity.ai.goal.TemptGoal;
import net.minecraft.world.entity.ai.goal.WaterAvoidingRandomStrollGoal;
import net.minecraft.world.entity.ai.goal.target.OwnerHurtByTargetGoal;
import net.minecraft.world.entity.ai.goal.target.OwnerHurtTargetGoal;
import net.minecraft.world.entity.ai.navigation.AmphibiousPathNavigation;
import net.minecraft.world.entity.ai.navigation.PathNavigation;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.ServerLevelAccessor;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.Vec3;
import org.jspecify.annotations.Nullable;

/**
 * Seals, walruses and penguins: at home on land and in the water, but they breathe air. They
 * swim and hunt by day and haul out to sleep at night. Seals can be tamed with fish; penguins
 * toboggan across ice and huddle together at night.
 */
public class AquaticAmphibian extends TamableAnimal implements AquaticCreature, SleepGoal.Sleeper {
	private static final EntityDataAccessor<Boolean> RESTING = SynchedEntityData.defineId(AquaticAmphibian.class, EntityDataSerializers.BOOLEAN);
	private static final EntityDataAccessor<Boolean> SLIDING = SynchedEntityData.defineId(AquaticAmphibian.class, EntityDataSerializers.BOOLEAN);
	private final AnimatableInstanceCache geoCache = GeckoLibUtil.createInstanceCache(this);

	public AquaticAmphibian(EntityType<? extends AquaticAmphibian> type, Level level) {
		super(type, level);
		this.refreshDimensions();
	}

	public static AttributeSupplier.Builder createAttributes(Species s) {
		AttributeSupplier.Builder b = TamableAnimal.createAnimalAttributes()
			.add(Attributes.MAX_HEALTH, s.health())
			.add(Attributes.MOVEMENT_SPEED, s.speed() * 1.8)
			.add(Attributes.WATER_MOVEMENT_EFFICIENCY, 1.0)
			.add(Attributes.FOLLOW_RANGE, Math.max(16, s.huntRange() + 6))
			.add(Attributes.KNOCKBACK_RESISTANCE, s.knockbackResistance())
			.add(Attributes.SCALE, s.scale());
		b.add(Attributes.ATTACK_DAMAGE, Math.max(s.attackDamage(), s.tame() != null ? s.tame().damage() : 0));
		return b;
	}

	@Override
	public Species species() {
		return SpeciesRegistry.of(this.getType());
	}

	@Override
	protected void defineSynchedData(SynchedEntityData.Builder builder) {
		super.defineSynchedData(builder);
		builder.define(RESTING, false);
		builder.define(SLIDING, false);
	}

	@Override
	protected PathNavigation createNavigation(Level level) {
		return new AmphibiousPathNavigation(this, level);
	}

	@Override
	protected void registerGoals() {
		Species s = species();
		this.goalSelector.addGoal(0, new BreathAirGoal(this));
		if (!s.attacks()) this.goalSelector.addGoal(1, new PanicGoal(this, s.panicSpeed()));
		this.goalSelector.addGoal(2, new SitWhenOrderedToGoal(this));
		this.goalSelector.addGoal(2, new BreedGoal(this, 1.0));
		this.goalSelector.addGoal(4, new TemptGoal(this, 1.1, this::isFood, false));
		if (s.tame() != null) this.goalSelector.addGoal(5, new FollowOwnerOnLandAndSeaGoal(this, 1.2, 8.0F, 3.0F));
		this.goalSelector.addGoal(5, new FollowParentGoal(this, 1.1));
		this.goalSelector.addGoal(6, new HaulOutGoal(this));
		this.goalSelector.addGoal(6, new SleepGoal<>(this));
		if (s.isPenguin()) this.goalSelector.addGoal(7, new HuddleGoal(this));
		this.goalSelector.addGoal(8, new RandomSwimmingGoal(this, 1.0, 40));
		this.goalSelector.addGoal(8, new WaterAvoidingRandomStrollGoal(this, 0.8));
		this.goalSelector.addGoal(9, new LookAtPlayerGoal(this, Player.class, 8.0F));
		this.goalSelector.addGoal(10, new RandomLookAroundGoal(this));
		if (s.tame() != null) {
			this.targetSelector.addGoal(1, new OwnerHurtByTargetGoal(this));
			this.targetSelector.addGoal(2, new OwnerHurtTargetGoal(this));
		}
		AquaticGoals.addCombat(this, s, this.goalSelector, this.targetSelector);
	}

	private static boolean matches(ItemStack stack, Iterable<String> ids) {
		String id = BuiltInRegistries.ITEM.getKey(stack.getItem()).toString();
		for (String s : ids) if (s.equals(id)) return true;
		return false;
	}

	@Override
	public boolean isFood(ItemStack stack) {
		return matches(stack, species().breed());
	}

	@Override
	public @Nullable AgeableMob getBreedOffspring(ServerLevel level, AgeableMob partner) {
		return (AgeableMob) this.getType().create(level, EntitySpawnReason.BREEDING);
	}

	// ---------------------------------------------------------------- taming

	@Override
	public InteractionResult mobInteract(Player player, InteractionHand hand) {
		ItemStack held = player.getItemInHand(hand);
		Species.Tame tame = species().tame();
		if (tame != null && !this.isTame() && matches(held, tame.items()) && !this.isBaby()) {
			if (!this.level().isClientSide()) {
				held.consume(1, player);
				if (this.random.nextFloat() < tame.chance()) {
					this.tame(player);
					this.navigation.stop();
					this.setTarget(null);
					this.setOrderedToSit(true);
					this.level().broadcastEntityEvent(this, (byte) 7);
				} else {
					this.level().broadcastEntityEvent(this, (byte) 6);
				}
			}
			return InteractionResult.SUCCESS;
		}
		if (this.isTame() && this.isOwnedBy(player) && !this.isFood(held)) {
			if (!this.level().isClientSide()) {
				this.setOrderedToSit(!this.isOrderedToSit());
				this.jumping = false;
				this.navigation.stop();
				this.setTarget(null);
			}
			return InteractionResult.SUCCESS;
		}
		return super.mobInteract(player, hand);
	}

	@Override
	public boolean isSitting() {
		return this.isInSittingPose();
	}

	// ---------------------------------------------------------------- breathing and swimming

	@Override
	public int getMaxAirSupply() {
		return species().breath();
	}

	@Override
	public boolean canBreatheUnderwater() {
		return false;
	}

	@Override
	public boolean isPushedByFluid() {
		return false;
	}

	@Override
	public void travel(Vec3 input) {
		// Faster and more agile in the water than the default amphibious swim.
		if (this.isInWater() && this.isEffectiveAi()) {
			this.moveRelative((float) (species().swimSpeed() * 0.5), input);
			this.move(net.minecraft.world.entity.MoverType.SELF, this.getDeltaMovement());
			this.setDeltaMovement(this.getDeltaMovement().scale(0.9));
		} else {
			super.travel(input);
		}
	}

	// ---------------------------------------------------------------- state

	@Override
	public boolean isCarcass() {
		return false;
	}

	@Override
	public boolean isResting() {
		return this.entityData.get(RESTING);
	}

	@Override
	public void setResting(boolean resting) {
		this.entityData.set(RESTING, resting);
	}

	@Override
	public boolean isSliding() {
		return this.entityData.get(SLIDING);
	}

	@Override
	public void aiStep() {
		super.aiStep();
		if (this.isResting()) this.getNavigation().stop();
		if (!this.level().isClientSide() && species().isPenguin()) {
			// Tobogganing: on ice or snow and moving, a penguin drops onto its belly and speeds up.
			Vec3 v = this.getDeltaMovement();
			boolean slide = !this.isInWater() && this.onGround() && v.horizontalDistance() > 0.06 && isSlippery(this.getBlockStateOn());
			if (slide != isSliding()) this.entityData.set(SLIDING, slide);
			if (slide) this.setDeltaMovement(v.x * 1.25, v.y, v.z * 1.25);
		}
	}

	private static boolean isSlippery(BlockState state) {
		return state.is(BlockTags.ICE) || state.is(BlockTags.SNOW) || state.is(net.minecraft.world.level.block.Blocks.SNOW);
	}

	@Override
	public boolean hurtServer(ServerLevel level, DamageSource source, float damage) {
		setResting(false);
		if (this.isOrderedToSit() && !this.level().isClientSide()) this.setOrderedToSit(false);
		return super.hurtServer(level, source, damage);
	}

	@Override
	public boolean doHurtTarget(ServerLevel level, Entity target) {
		playAction("attack");
		return super.doHurtTarget(level, target);
	}

	// ---------------------------------------------------------------- sounds

	private static @Nullable SoundEvent sound(@Nullable String id) {
		return id == null ? null : BuiltInRegistries.SOUND_EVENT.getValue(Identifier.parse(id));
	}

	@Override
	protected @Nullable SoundEvent getAmbientSound() {
		return isResting() ? null : sound(species().sounds().ambient());
	}

	@Override
	protected @Nullable SoundEvent getHurtSound(DamageSource source) {
		return sound(species().sounds().hurt());
	}

	@Override
	protected @Nullable SoundEvent getDeathSound() {
		return sound(species().sounds().death());
	}

	@Override
	public int getAmbientSoundInterval() {
		return species().sounds().interval() * 20;
	}

	@Override
	public float getVoicePitch() {
		Species.Sounds s = species().sounds();
		float pitch = s.pitchMin() + this.random.nextFloat() * (s.pitchMax() - s.pitchMin());
		return this.isBaby() ? pitch * 1.3F : pitch;
	}

	@Override
	public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
		AquaticCreature.registerControllers(this, controllers);
	}

	@Override
	public AnimatableInstanceCache getAnimatableInstanceCache() {
		return this.geoCache;
	}

	/** Spawn rule: on the shore (sand, gravel, stone, snow or ice), in daylight. */
	public static boolean checkSpawn(EntityType<? extends Mob> type, ServerLevelAccessor level, EntitySpawnReason reason, BlockPos pos, RandomSource random) {
		BlockPos below = pos.below();
		return level.getBlockState(below).isFaceSturdy(level, below, Direction.UP) && level.getRawBrightness(pos, 0) > 8;
	}

	/** At night seals and penguins leave the water to sleep on the shore. */
	static class HaulOutGoal extends Goal {
		private final AquaticAmphibian mob;
		private @Nullable BlockPos target;

		HaulOutGoal(AquaticAmphibian mob) {
			this.mob = mob;
			this.setFlags(EnumSet.of(Goal.Flag.MOVE));
		}

		@Override
		public boolean canUse() {
			if (!this.mob.isInWater() || this.mob.isTame() || !SleepGoal.isRestingTime(this.mob, this.mob.species().sleeps())) return false;
			if (this.mob.getRandom().nextInt(reducedTickDelay(40)) != 0) return false;
			this.target = findShore();
			return this.target != null;
		}

		private @Nullable BlockPos findShore() {
			BlockPos here = this.mob.blockPosition();
			for (int i = 0; i < 30; i++) {
				BlockPos p = here.offset(this.mob.getRandom().nextInt(25) - 12, this.mob.getRandom().nextInt(7) - 3, this.mob.getRandom().nextInt(25) - 12);
				if (this.mob.level().getFluidState(p).is(FluidTags.WATER) || !this.mob.level().getBlockState(p).isAir()) continue;
				if (this.mob.level().getBlockState(p.below()).isFaceSturdy(this.mob.level(), p.below(), Direction.UP)) return p;
			}
			return null;
		}

		@Override
		public void start() {
			if (this.target != null) this.mob.getNavigation().moveTo(this.target.getX() + 0.5, this.target.getY(), this.target.getZ() + 0.5, 1.0);
		}

		@Override
		public boolean canContinueToUse() {
			return this.mob.isInWater() && !this.mob.getNavigation().isDone();
		}
	}

	/**
	 * Follows its owner on land and in the water (vanilla FollowOwnerGoal only works for walkers
	 * and fliers). Teleports to the owner when left far behind.
	 */
	static class FollowOwnerOnLandAndSeaGoal extends Goal {
		private final AquaticAmphibian seal;
		private final double speed;
		private final float start, stop;
		private @Nullable LivingEntity owner;
		private int recalc;

		FollowOwnerOnLandAndSeaGoal(AquaticAmphibian seal, double speed, float start, float stop) {
			this.seal = seal;
			this.speed = speed;
			this.start = start;
			this.stop = stop;
			this.setFlags(EnumSet.of(Goal.Flag.MOVE, Goal.Flag.LOOK));
		}

		@Override
		public boolean canUse() {
			LivingEntity o = this.seal.getOwner();
			if (o == null || o.isSpectator() || this.seal.isOrderedToSit() || this.seal.isResting() || this.seal.distanceTo(o) < this.start) return false;
			this.owner = o;
			return true;
		}

		@Override
		public boolean canContinueToUse() {
			return this.owner != null && !this.seal.isOrderedToSit() && this.seal.distanceTo(this.owner) > this.stop;
		}

		@Override
		public void start() {
			this.recalc = 0;
		}

		@Override
		public void stop() {
			this.owner = null;
			this.seal.getNavigation().stop();
		}

		@Override
		public void tick() {
			if (this.owner == null) return;
			this.seal.getLookControl().setLookAt(this.owner, 10.0F, this.seal.getMaxHeadXRot());
			if (--this.recalc > 0) return;
			this.recalc = adjustedTickDelay(10);
			if (this.seal.shouldTryTeleportToOwner()) this.seal.tryToTeleportToOwner();
			else this.seal.getNavigation().moveTo(this.owner, this.speed);
		}
	}

	/** Penguins huddle together through the night. */
	static class HuddleGoal extends Goal {
		private final AquaticAmphibian penguin;
		private int cooldown;

		HuddleGoal(AquaticAmphibian penguin) {
			this.penguin = penguin;
		}

		@Override
		public boolean canUse() {
			if (--this.cooldown > 0 || this.penguin.isInWater() || !this.penguin.level().isDarkOutside()) return false;
			this.cooldown = reducedTickDelay(60);
			return true;
		}

		@Override
		public void start() {
			List<AquaticAmphibian> colony = this.penguin.level().getEntitiesOfClass(AquaticAmphibian.class, this.penguin.getBoundingBox().inflate(12),
				o -> o != this.penguin && o.species().isPenguin());
			if (colony.isEmpty()) return;
			Vec3 centre = colony.stream().map(Entity::position).reduce(Vec3.ZERO, Vec3::add).scale(1.0 / colony.size());
			if (centre.distanceTo(this.penguin.position()) > 1.5) this.penguin.getNavigation().moveTo(centre.x, centre.y, centre.z, 0.8);
		}

		@Override
		public boolean canContinueToUse() {
			return false;
		}
	}
}
