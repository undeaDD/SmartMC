package com.smartmc.platform;

import java.nio.file.Path;

public interface Platform {
	boolean isModLoaded(String modId);

	ModLoader loader();

	String mcVersion();

	boolean isDevelopmentEnvironment();

	/** This loader's config directory, e.g. {@code config/smartmc/}. */
	Path configDir();

	/** The server's root/game directory -- where {@code server-icon.png}, {@code server.properties}, etc. live, one level up from {@code configDir()}'s parent. */
	Path gameDir();

	default boolean isDebug() {
		return isDevelopmentEnvironment();
	}

	enum ModLoader {
		FABRIC, NEOFORGE, QUILT, FORGE
	}
}
