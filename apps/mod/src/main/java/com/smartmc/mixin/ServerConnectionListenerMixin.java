package com.smartmc.mixin;

import com.smartmc.SmartMC;
import com.smartmc.network.MagicBytePeekDecoder;
import dev.kikugie.fletching_table.annotation.MixinEnvironment;
import io.netty.channel.Channel;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Targets ServerConnectionListener's real-TCP ChannelInitializer -- the anonymous
 * {@code $1} class, not {@code $2} (that one backs {@code startMemoryChannel()},
 * the loopback/singleplayer channel, and must not be touched). Confirmed via
 * javap against the official-mappings jar: only {@code $1}'s initChannel
 * references LegacyQueryHandler, which only applies to real sockets.
 *
 * <p>Installs the magic-byte peek/dispatch handler at the very front of every new
 * connection's pipeline. See CLAUDE.md's "Security model / Layer 0".
 */
@Mixin(targets = "net.minecraft.server.network.ServerConnectionListener$1")
@MixinEnvironment(type = MixinEnvironment.Env.MAIN)
public class ServerConnectionListenerMixin {

	@Inject(method = "initChannel", at = @At("HEAD"))
	private void smartmc$installMultiplexPeek(Channel channel, CallbackInfo ci) {
		channel.pipeline().addFirst("smartmc_peek", new MagicBytePeekDecoder());
		// debug, not info -- this fires once per connection, including every
		// vanilla player, and was flooding real server consoles at info level
		// (was bumped up temporarily for M1's own hand-verification, per this
		// comment's own original note that it should drop back once verified).
		SmartMC.LOGGER.debug("Installed multiplex peek handler for {}", channel.remoteAddress());
	}
}
