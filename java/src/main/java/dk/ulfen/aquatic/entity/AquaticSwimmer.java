package dk.ulfen.aquatic.entity;

import java.util.List;

import com.geckolib.animatable.instance.AnimatableInstanceCache;
import com.geckolib.animatable.manager.AnimatableManager;
import com.geckolib.util.GeckoLibUtil;

import dk.ulfen.aquatic.AquaticRegistry;
import dk.ulfen.aquatic.species.Species;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.chat.Component;
import net.minecraft.network.syncher.EntityDataAccessor;
import net.minecraft.network.syncher.EntityDataSerializers;
import net.minecraft.network.syncher.SynchedEntityData;
import net.minecraft.resources.Identifier;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.tags.FluidTags;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.effect.MobEffectInstance;
import net.minecraft.world.effect.MobEffects;
import net.minecraft.world.entity.Bucketable;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityDimensions;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.control.SmoothSwimmingLookControl;
import net.minecraft.world.entity.ai.control.SmoothSwimmingMoveControl;
import net.minecraft.world.entity.ai.goal.BreathAirGoal;
import net.minecraft.world.entity.ai.goal.Goal;
import net.minecraft.world.entity.ai.goal.PanicGoal;
import net.minecraft.world.entity.ai.goal.RandomSwimmingGoal;
import net.minecraft.world.entity.ai.navigation.PathNavigation;
import net.minecraft.world.entity.ai.navigation.WaterBoundPathNavigation;
import net.minecraft.world.entity.animal.fish.WaterAnimal;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.storage.ValueInput;
import net.minecraft.world.level.storage.ValueOutput;
import net.minecraft.world.phys.Vec3;
import org.jspecify.annotations.Nullable;

/**
 * Fish, sharks, rays and whales. Fish can't leave the water (they flop about and suffocate on
 * land) and small ones fit in a bucket; whales breathe air, blow at the surface, and some can
 * be ridden by holding on to their fin.
 */
public class AquaticSwimmer extends WaterAnimal implements AquaticCreature, Bucketable {
	private static final EntityDataAccessor<Boolean> CARCASS = SynchedEntityData.defineId(AquaticSwimmer.class, EntityDataSerializers.BOOLEAN);
	private static final EntityDataAccessor<Boolean> FROM_BUCKET = SynchedEntityData.defineId(AquaticSwimmer.class, EntityDataSerializers.BOOLEAN);
	private final AnimatableInstanceCache geoCache = GeckoLibUtil.createInstanceCache(this);
	private int spoutCooldown;

	public AquaticSwimmer(EntityType<? extends AquaticSwimmer> type, Level level) {
		super(type, level);
		this.moveControl = new SmoothSwimmingMoveControl(this, 85, 10, 0.02F, 0.1F, true);
		this.lookControl = new SmoothSwimmingLookControl(this, 10);
		this.refreshDimensions(); // apply the species' size multiplier (scale attribute) to the hitbox
	}

	public static AttributeSupplier.Builder createAttributes(Species s) {
		AttributeSupplier.Builder b = WaterAnimal.createMobAttributes()
			.add(Attributes.MAX_HEALTH, s.health())
			.add(Attributes.MOVEMENT_SPEED, s.swimSpeed() * 8)
			.add(Attributes.FOLLOW_RANGE, Math.max(16, s.huntRange() + 6))
			.add(Attributes.KNOCKBACK_RESISTANCE, s.knockbackResistance())
			.add(Attributes.SCALE, s.scale());
		if (s.attacks()) b.add(Attributes.ATTACK_DAMAGE, s.attackDamage());
		return b;
	}

	@Override
	protected void defineSynchedData(SynchedEntityData.Builder builder) {
		super.defineSynchedData(builder);
		builder.define(CARCASS, false);
		builder.define(FROM_BUCKET, false);
	}

	@Override
	public Species species() {
		return SpeciesRegistry.of(this.getType());
	}

	@Override
	protected PathNavigation createNavigation(Level level) {
		return new WaterBoundPathNavigation(this, level);
	}

	@Override
	protected void registerGoals() {
		Species s = species();
		if (s.breathesAir()) this.goalSelector.addGoal(0, new BreathAirGoal(this));
		if (!s.attacks()) this.goalSelector.addGoal(1, new PanicGoal(this, s.panicSpeed()));
		if (s.breaches() > 0) this.goalSelector.addGoal(5, new BreachGoal(this, s.breaches()));
		if (s.school()) this.goalSelector.addGoal(5, new SchoolGoal(this));
		this.goalSelector.addGoal(6, new RandomSwimmingGoal(this, 1.0, s.bottom() ? 40 : 10));
		AquaticGoals.addCombat(this, s, this.goalSelector, this.targetSelector);
	}

	// ---------------------------------------------------------------- breathing

	/** Whales use up their air underwater and refill it at the surface; fish suffocate on land. */
	@Override
	protected void handleAirSupply(ServerLevel level, int preTickAirSupply) {
		if (!species().breathesAir()) {
			super.handleAirSupply(level, preTickAirSupply);
			return;
		}
		if (this.isInWater() && this.isEyeInFluid(FluidTags.WATER)) {
			this.setAirSupply(preTickAirSupply - 1);
			if (this.getAirSupply() <= -20) {
				this.setAirSupply(0);
				this.hurtServer(level, this.damageSources().drown(), 2.0F);
			}
		} else {
			// Surfacing: blow a spout.
			if (this.getAirSupply() < this.getMaxAirSupply() - 100 && this.spoutCooldown <= 0) {
				level.sendParticles(net.minecraft.core.particles.ParticleTypes.SPLASH, this.getX(), this.getY() + this.getBbHeight() + 0.5, this.getZ(), 40, 0.2, 0.8, 0.2, 0.3);
				level.sendParticles(net.minecraft.core.particles.ParticleTypes.CLOUD, this.getX(), this.getY() + this.getBbHeight() + 1.0, this.getZ(), 8, 0.2, 0.6, 0.2, 0.05);
				this.playSound(SoundEvents.DOLPHIN_SPLASH, 2.0F, 0.5F);
				this.spoutCooldown = 160;
			}
			this.setAirSupply(this.getMaxAirSupply());
		}
	}

	@Override
	public int getMaxAirSupply() {
		return species().breathesAir() ? species().breath() : super.getMaxAirSupply();
	}

	// ---------------------------------------------------------------- flopping

	@Override
	public void aiStep() {
		Species s = species();
		if (s.isFish() && !this.isInWater() && this.onGround() && this.verticalCollision && !isCarcass()) {
			this.setDeltaMovement(this.getDeltaMovement().add((this.random.nextFloat() * 2 - 1) * 0.05F, 0.4F, (this.random.nextFloat() * 2 - 1) * 0.05F));
			this.setOnGround(false);
			this.needsSync = true;
			this.playSound(SoundEvents.COD_FLOP, 0.6F, this.getVoicePitch());
		}
		if (this.spoutCooldown > 0) this.spoutCooldown--;
		super.aiStep();
	}

	// ---------------------------------------------------------------- riding a whale by its fin

	@Override
	protected InteractionResult mobInteract(Player player, InteractionHand hand) {
		Species s = species();
		if (s.bucket() && this.isAlive() && !isCarcass()) {
			var picked = Bucketable.bucketMobPickup(player, hand, this);
			if (picked.isPresent()) return picked.get();
		}
		if (s.rideable() && !this.isVehicle() && !player.isSecondaryUseActive() && player.getItemInHand(hand).isEmpty()) {
			if (!this.level().isClientSide()) {
				player.startRiding(this);
				player.sendOverlayMessage(Component.translatable("aquatic.whale.hold"));
			}
			return InteractionResult.SUCCESS;
		}
		return super.mobInteract(player, hand);
	}

	@Override
	protected boolean canAddPassenger(Entity passenger) {
		return species().rideable() && this.getPassengers().isEmpty() && passenger instanceof Player;
	}

	@Override
	protected Vec3 getPassengerAttachmentPoint(Entity passenger, EntityDimensions dimensions, float scale) {
		Species s = species();
		return new Vec3(0, s.rideHeight() * scale, -s.rideOffset() * scale);
	}

	@Override
	public void tick() {
		super.tick();
		if (this.level().isClientSide()) return;
		this.entityData.set(CARCASS, this.entityTags().contains(HUNTING_CARCASS));
		// The whale keeps swimming but leans the way its rider looks; the rider can breathe.
		if (this.getFirstPassenger() instanceof Player rider) {
			rider.addEffect(new MobEffectInstance(MobEffects.WATER_BREATHING, 60, 0, false, false));
			Vec3 look = rider.getLookAngle();
			this.setDeltaMovement(this.getDeltaMovement().add(look.x * 0.03, look.y * 0.025, look.z * 0.03));
			this.setYRot(this.getYRot() + net.minecraft.util.Mth.wrapDegrees(rider.getYRot() - this.getYRot()) * 0.08F);
		}
	}

	// ---------------------------------------------------------------- buckets

	@Override
	public boolean fromBucket() {
		return this.entityData.get(FROM_BUCKET);
	}

	@Override
	public void setFromBucket(boolean fromBucket) {
		this.entityData.set(FROM_BUCKET, fromBucket);
	}

	@Override
	public void saveToBucketTag(ItemStack stack) {
		Bucketable.saveDefaultDataToBucketTag(this, stack);
	}

	@Override
	public void loadFromBucketTag(CompoundTag tag) {
		Bucketable.loadDefaultDataFromBucketTag(this, tag);
	}

	@Override
	public ItemStack getBucketItemStack() {
		return new ItemStack(AquaticRegistry.BUCKETS.get(species().id()));
	}

	@Override
	public SoundEvent getPickupSound() {
		return SoundEvents.BUCKET_FILL_FISH;
	}

	@Override
	public boolean requiresCustomPersistence() {
		return super.requiresCustomPersistence() || this.fromBucket() || this.isVehicle();
	}

	@Override
	public boolean removeWhenFarAway(double distance) {
		return !this.fromBucket() && !this.hasCustomName() && !this.isVehicle();
	}

	@Override
	protected void addAdditionalSaveData(ValueOutput output) {
		super.addAdditionalSaveData(output);
		output.putBoolean("FromBucket", this.fromBucket());
	}

	@Override
	protected void readAdditionalSaveData(ValueInput input) {
		super.readAdditionalSaveData(input);
		this.setFromBucket(input.getBooleanOr("FromBucket", false));
	}

	// ---------------------------------------------------------------- combat and defences

	@Override
	public boolean hurtServer(ServerLevel level, DamageSource source, float damage) {
		boolean hurt = super.hurtServer(level, source, damage);
		// Lionfish spines: whatever hits one is poisoned.
		if (hurt && species().poisonous() && source.isDirect() && source.getDirectEntity() instanceof LivingEntity attacker && attacker != this) {
			attacker.addEffect(new MobEffectInstance(MobEffects.POISON, 120, 1));
		}
		return hurt;
	}

	@Override
	public boolean doHurtTarget(ServerLevel level, Entity target) {
		playAction("attack");
		return super.doHurtTarget(level, target);
	}

	// ---------------------------------------------------------------- state

	@Override
	public boolean isCarcass() {
		return this.entityData.get(CARCASS);
	}

	@Override
	public boolean isResting() {
		return false;
	}

	// ---------------------------------------------------------------- sounds

	private static @Nullable SoundEvent sound(@Nullable String id) {
		return id == null ? null : BuiltInRegistries.SOUND_EVENT.getValue(Identifier.parse(id));
	}

	@Override
	protected @Nullable SoundEvent getAmbientSound() {
		return sound(species().sounds().ambient());
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
		return s.pitchMin() + this.random.nextFloat() * (s.pitchMax() - s.pitchMin());
	}

	@Override
	public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
		AquaticCreature.registerControllers(this, controllers);
	}

	@Override
	public AnimatableInstanceCache getAnimatableInstanceCache() {
		return this.geoCache;
	}

	/** Keeps a school of fish together: drift towards the others when straying. */
	static class SchoolGoal extends Goal {
		private final AquaticSwimmer fish;
		private int cooldown;

		SchoolGoal(AquaticSwimmer fish) {
			this.fish = fish;
		}

		@Override
		public boolean canUse() {
			if (--this.cooldown > 0 || this.fish.getTarget() != null) return false;
			this.cooldown = reducedTickDelay(40);
			return true;
		}

		@Override
		public void start() {
			List<AquaticSwimmer> school = this.fish.level().getEntitiesOfClass(AquaticSwimmer.class, this.fish.getBoundingBox().inflate(10),
				o -> o != this.fish && o.getType() == this.fish.getType());
			if (school.isEmpty()) return;
			Vec3 centre = school.stream().map(Entity::position).reduce(Vec3.ZERO, Vec3::add).scale(1.0 / school.size());
			if (centre.distanceTo(this.fish.position()) > 3) this.fish.getNavigation().moveTo(centre.x, centre.y, centre.z, 1.1);
		}

		@Override
		public boolean canContinueToUse() {
			return false;
		}
	}

	/** Humpbacks and porpoises now and then leap clear of the water. */
	static class BreachGoal extends Goal {
		private final AquaticSwimmer whale;
		private final int interval;

		BreachGoal(AquaticSwimmer whale, int interval) {
			this.whale = whale;
			this.interval = interval;
		}

		@Override
		public boolean canUse() {
			if (!this.whale.isInWater() || this.whale.isVehicle() || this.whale.getRandom().nextInt(reducedTickDelay(this.interval * 20)) != 0) return false;
			return this.whale.level().getFluidState(this.whale.blockPosition().above(2)).isEmpty();
		}

		@Override
		public void start() {
			Vec3 look = this.whale.getLookAngle();
			this.whale.setDeltaMovement(look.x * 0.6, 1.0, look.z * 0.6);
			this.whale.playSound(SoundEvents.DOLPHIN_JUMP, 2.0F, 0.5F);
		}

		@Override
		public boolean canContinueToUse() {
			return false;
		}
	}
}
