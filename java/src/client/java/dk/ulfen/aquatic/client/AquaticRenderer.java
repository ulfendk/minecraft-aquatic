package dk.ulfen.aquatic.client;

import com.geckolib.model.DefaultedEntityGeoModel;
import com.geckolib.renderer.GeoEntityRenderer;

import dk.ulfen.aquatic.entity.AquaticCreature;
import dk.ulfen.aquatic.species.Species;
import dk.ulfen.aquatic.species.SpeciesRegistry;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.state.LivingEntityRenderState;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;

/** Renders any Sea Life creature from its GeckoLib model (the same geometry as on Bedrock). */
public class AquaticRenderer<T extends Mob & AquaticCreature> extends GeoEntityRenderer<T, LivingEntityRenderState> {
	public AquaticRenderer(EntityRendererProvider.Context context, EntityType<? extends T> type) {
		super(context, new DefaultedEntityGeoModel<>(BuiltInRegistries.ENTITY_TYPE.getKey(type)));
		Species species = SpeciesRegistry.of(type);
		this.shadowRadius = species.isSwimmer() ? 0.0F : Math.min(1.8F, species.width() * species.scale() * 0.5F);
	}
}
