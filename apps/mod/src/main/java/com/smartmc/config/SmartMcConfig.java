package com.smartmc.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.smartmc.SmartMC;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Plain Gson POJO, loaded from (or defaulted and written to)
 * {@code config/smartmc/smartmc.json}. See CLAUDE.md's "Mod configuration"
 * section for the meaning of each field -- this class only owns defaults
 * and load/save, not validation of values a server owner might hand-edit in.
 */
public class SmartMcConfig {

	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
	private static final String FILE_NAME = "smartmc.json";

	/** Kill switch for the whole multiplex/pairing subsystem. */
	public boolean enabled = true;

	public int pairingCodeTtlSeconds = 300;

	/** 90 days, in seconds. */
	public long tokenExpirySeconds = 90L * 24 * 60 * 60;

	public int maxDevicesPerPlayer = 10;

	/** DoS cap on connections that haven't completed the multiplex handshake yet. */
	public int maxPendingUnauthenticatedConnections = 50;

	/** Deferred out of v1 (see CLAUDE.md's "Push notifications" section) -- off by default. */
	public boolean pushEnabled = false;

	public String expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

	/** Opt-out, not opt-in: ships on, operators/players can turn it off. */
	public boolean singleplayerWarningEnabled = true;

	public String logLevel = "INFO";

	/** "native" (SmartMC's own DB-backed groups) or "ftbteams" (delegate to FTB Teams, if installed). */
	public String groupProvider = "native";

	public static SmartMcConfig load(Path configDir) {
		Path file = configDir.resolve(FILE_NAME);
		if (Files.exists(file)) {
			try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
				SmartMcConfig config = GSON.fromJson(reader, SmartMcConfig.class);
				if (config != null) {
					return config;
				}
				SmartMC.LOGGER.warn("{} was empty or invalid, falling back to defaults", file);
			} catch (IOException e) {
				SmartMC.LOGGER.warn("Failed to read {}, falling back to defaults", file, e);
			}
		}

		SmartMcConfig defaults = new SmartMcConfig();
		defaults.save(configDir);
		return defaults;
	}

	public void save(Path configDir) {
		Path file = configDir.resolve(FILE_NAME);
		try {
			Files.createDirectories(configDir);
			Path tmp = configDir.resolve(FILE_NAME + ".tmp");
			Files.writeString(tmp, GSON.toJson(this), StandardCharsets.UTF_8);
			Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
		} catch (IOException e) {
			SmartMC.LOGGER.error("Failed to write {}", file, e);
		}
	}
}
