package com.smartmc.platform.fabric;

//? fabric {

import com.smartmc.platform.Platform;
import net.fabricmc.loader.api.FabricLoader;

public class FabricPlatform implements Platform {

	@Override
	public boolean isModLoaded(String modId) {
		return FabricLoader.getInstance().isModLoaded(modId);
	}

	@Override
	public ModLoader loader() {
		// Quilt's built-in Fabric-compatibility layer runs this same jar
		// unmodified; "quilt_loader" is how a Fabric mod tells the two apart.
		return FabricLoader.getInstance().isModLoaded("quilt_loader") ? ModLoader.QUILT : ModLoader.FABRIC;
	}

	@Override
	public String mcVersion() {
		return FabricLoader.getInstance().getRawGameVersion();
	}

	@Override
	public boolean isDevelopmentEnvironment() {
		return FabricLoader.getInstance().isDevelopmentEnvironment();
	}
}
//?}
