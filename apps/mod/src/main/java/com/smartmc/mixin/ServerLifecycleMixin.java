package com.smartmc.mixin;

import com.smartmc.SmartMC;
import dev.kikugie.fletching_table.annotation.MixinEnvironment;
import net.minecraft.server.MinecraftServer;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * M0 sanity check that Mixin injection works end to end across every
 * loader/version target -- direct groundwork for the real port-multiplexing
 * Mixin landing in M1.
 */
@Mixin(MinecraftServer.class)
@MixinEnvironment(type = MixinEnvironment.Env.MAIN)
public class ServerLifecycleMixin {

	@Inject(method = "loadLevel", at = @At("RETURN"))
	private void afterLoadLevel(CallbackInfo ci) {
		SmartMC.LOGGER.info("World loaded -- Mixin injection is working.");
	}

}
