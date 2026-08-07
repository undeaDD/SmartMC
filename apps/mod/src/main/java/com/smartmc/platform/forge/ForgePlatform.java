package com.smartmc.platform.forge;

//? forge {

/*import com.smartmc.platform.Platform;
import net.minecraftforge.fml.ModList;
import net.minecraftforge.fml.loading.FMLLoader;
import net.minecraftforge.fml.loading.FMLPaths;

import java.nio.file.Path;

public class ForgePlatform implements Platform {

	@Override
	public boolean isModLoaded(String modId) {
		return ModList.get().isLoaded(modId);
	}

	@Override
	public ModLoader loader() {
		return ModLoader.FORGE;
	}

	@Override
	public String mcVersion() {
		return "";
	}

	@Override
	public boolean isDevelopmentEnvironment() {
		return !FMLLoader.isProduction();
	}

	@Override
	public Path configDir() {
		return FMLPaths.CONFIGDIR.get().resolve("smartmc");
	}

	@Override
	public Path gameDir() {
		return FMLPaths.GAMEDIR.get();
	}
}
*///?}
