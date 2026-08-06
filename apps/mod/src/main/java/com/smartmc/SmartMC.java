package com.smartmc;

import com.smartmc.auth.NoiseStaticKeys;
import com.smartmc.auth.ServerIdentity;
import com.smartmc.config.SmartMcConfig;
import com.smartmc.platform.Platform;
import com.smartmc.storage.Database;
import com.smartmc.storage.DeviceStore;
import com.smartmc.storage.GroupStore;
import com.smartmc.storage.SessionStore;

import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.MinecraftServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;

//? fabric {
import com.smartmc.platform.fabric.FabricPlatform;
//?} else {
/*import com.smartmc.platform.neoforge.NeoforgePlatform;
 *///?}

@SuppressWarnings("LoggingSimilarMessage")
public class SmartMC {

	public static final String MOD_ID = /*$ mod_id*/ "smartmc";
	public static final String MOD_VERSION = /*$ mod_version*/ "0.1.0";
	public static final String MOD_FRIENDLY_NAME = /*$ mod_name*/ "SmartMC";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	private static final Platform PLATFORM = createPlatformInstance();

	private static SmartMcConfig config;
	private static ServerIdentity identity;
	private static NoiseStaticKeys noiseKeys;
	private static Database database;
	private static DeviceStore devices;
	private static GroupStore groups;
	private static SessionStore sessions;

	public static void onInitialize() {
		LOGGER.info("Initializing {} on {}", MOD_ID, SmartMC.xplat().loader());
		LOGGER.debug("{}: { version: {}; friendly_name: {} }", MOD_ID, MOD_VERSION, MOD_FRIENDLY_NAME);
	}

	public static void onInitializeClient() {
		LOGGER.info("Initializing {} Client on {}", MOD_ID, SmartMC.xplat().loader());
		LOGGER.debug("{}: { version: {}; friendly_name: {} }", MOD_ID, MOD_VERSION, MOD_FRIENDLY_NAME);
	}

	/**
	 * Loads config/identity/storage for this server instance. Called from
	 * each loader's server-starting hook -- see {@code platform/fabric} and
	 * {@code platform/neoforge}'s entrypoints.
	 */
	public static void onServerStarting(MinecraftServer server) {
		var configDir = xplat().configDir();
		config = SmartMcConfig.load(configDir);
		identity = ServerIdentity.load(configDir);
		noiseKeys = NoiseStaticKeys.load(configDir);

		try {
			database = Database.open(configDir);
		} catch (SQLException e) {
			LOGGER.error("Failed to open SmartMC's database at {} -- the mod will not function this session", configDir, e);
			return;
		}
		devices = new DeviceStore(database);
		groups = new GroupStore(database);
		sessions = new SessionStore(database);

		LOGGER.info("SmartMC ready -- enabled: {}, identity fingerprint: {}", config.enabled, identity.fingerprint());
	}

	public static void onServerStopping() {
		if (database != null) {
			try {
				database.close();
			} catch (SQLException e) {
				LOGGER.error("Failed to close SmartMC's database cleanly", e);
			}
			database = null;
			devices = null;
			groups = null;
			sessions = null;
		}
	}

	public static SmartMcConfig config() {
		return config;
	}

	public static ServerIdentity identity() {
		return identity;
	}

	public static NoiseStaticKeys noiseKeys() {
		return noiseKeys;
	}

	public static DeviceStore devices() {
		return devices;
	}

	public static GroupStore groups() {
		return groups;
	}

	public static SessionStore sessions() {
		return sessions;
	}

	static Platform xplat() {
		return PLATFORM;
	}

	private static Platform createPlatformInstance() {
		//? fabric {
		return new FabricPlatform();
		//?} else {
		/*return new NeoforgePlatform();
		 *///?}
	}

	private static ResourceLocation id(String path) {
		//? > 1.19.2 {
		return ResourceLocation.fromNamespaceAndPath(MOD_ID, path);
		 //?} <= 1.19.2 {
		/*return new ResourceLocation(MOD_ID, path);
		*///?}
	}

	private static ResourceLocation id(String namespace, String path) {
		//? > 1.19.2 {
		return ResourceLocation.fromNamespaceAndPath(namespace, path);
		 //?} <= 1.19.2 {
		/*return new ResourceLocation(namespace, path);
		*///?}
	}
}
