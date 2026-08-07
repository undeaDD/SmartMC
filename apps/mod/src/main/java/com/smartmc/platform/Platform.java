package com.smartmc.platform;

import java.nio.file.Path;

public interface Platform {
	boolean isModLoaded(String modId);

	ModLoader loader();

	String mcVersion();

	boolean isDevelopmentEnvironment();

	/** This loader's config directory, e.g. {@code config/smartmc/}. */
	Path configDir();

	default boolean isDebug() {
		return isDevelopmentEnvironment();
	}

	enum ModLoader {
		FABRIC, NEOFORGE, QUILT, FORGE
	}
}
