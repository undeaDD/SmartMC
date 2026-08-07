package com.smartmc.network;

import com.smartmc.auth.PairingCodeManager;
import com.smartmc.auth.TokenService;
import com.smartmc.group.GroupProvider;
import com.smartmc.storage.DeviceStore;
import com.smartmc.storage.SessionStore;

import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.Executor;

/**
 * Everything a {@link MessageHandler} might need, bundled so adding a new
 * dependency means changing this one record, not every constructor between
 * {@link MagicBytePeekDecoder} (the sole place that reaches into
 * {@code SmartMC}'s statics to build this) and the handler that actually
 * uses it. {@code server} exists specifically so handlers that need actual
 * world/block access can hop onto the main thread via {@code server.execute(...)}
 * -- see {@link MessageHandler#handleAsync}.
 *
 * <p>Typed as the plain JDK {@link Executor} (which {@code MinecraftServer}
 * implements, transitively via {@code BlockableEventLoop}), not
 * {@code MinecraftServer} directly -- NeoForge/legacy Forge's ModDevGradle
 * test source sets don't have Minecraft's classes on the classpath at all
 * (a real, known gap; see NeoForge's own {@code unitTest{}} feature for the
 * proper fix, not worth adopting just to type-check a {@code null} in two
 * pipeline tests that never actually need a real server). Handlers that need
 * more than {@code execute(Runnable)} cast back to {@code MinecraftServer}
 * inside their own (always Minecraft-classpath-having) main-thread callback.
 */
public record MessageContext(
	PairingCodeManager pairingCodes,
	TokenService tokens,
	SessionStore sessions,
	GroupProvider groupProvider,
	DeviceStore devices,
	Executor server,
	Duration tokenValidity,
	Path gameDir
) {
}
