package com.smartmc.network;

import com.google.gson.Gson;
import com.smartmc.SmartMC;
import com.smartmc.network.message.DeviceListMessageHandler;
import com.smartmc.network.message.DeviceToggleMessageHandler;
import com.smartmc.network.message.PairMessageHandler;
import com.smartmc.network.message.ReconnectMessageHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

/**
 * Terminal handler installed by {@link NoiseHandshakeHandler} once the Noise
 * tunnel is up -- replaces M1's {@code FramedJsonEchoHandler} and slice 4's
 * pairing-only {@code PairingMessageHandler}, now that there's more than one
 * message type on the tunnel. Decodes the {@link MessageEnvelope}, dispatches
 * by {@code type} to the matching {@link MessageHandler}, and encodes its
 * reply back into a new envelope. Adding a new message type is one new
 * {@link MessageHandler} implementation plus one new {@code case} in
 * {@link #handlerFor} -- this class itself never otherwise changes.
 *
 * <p>{@link #handlerFor} is a {@code switch}, deliberately not a pre-built
 * {@code Map<String, MessageHandler>} constructed once in a static field --
 * a handler class is only loaded the moment its own {@code case} branch
 * actually runs. This matters concretely: {@code DeviceToggleMessageHandler}
 * references real Minecraft classes (BlockPos, ServerLevel, ...) that
 * NeoForge's and legacy Forge's ModDevGradle test source sets don't have on
 * their classpath at all (a real, known gap -- see {@code MessageContext}'s
 * javadoc). An eagerly-built map would classload every handler, including
 * that one, the instant any test touches this class at all -- which
 * {@code NoisePipelineTest}/{@code ReconnectPipelineTest} do, for message
 * types that have nothing to do with device toggling.
 */
public class SmartMcMessageHandler extends SimpleChannelInboundHandler<String> {

	private static final Gson GSON = new Gson();

	private static MessageHandler handlerFor(String type) {
		return switch (type) {
			case "pair" -> new PairMessageHandler();
			case "reconnect" -> new ReconnectMessageHandler();
			case "devices" -> new DeviceListMessageHandler();
			case "device_toggle" -> new DeviceToggleMessageHandler();
			default -> null;
		};
	}

	private final MessageContext context;

	public SmartMcMessageHandler(MessageContext context) {
		this.context = context;
	}

	@Override
	protected void channelRead0(ChannelHandlerContext ctx, String msg) {
		MessageEnvelope.decode(GSON, msg).ifPresentOrElse(
			decoded -> dispatch(ctx, decoded),
			() -> {
				SmartMC.LOGGER.warn("Malformed message from {}, closing connection", ctx.channel().remoteAddress());
				ctx.close();
			}
		);
	}

	private void dispatch(ChannelHandlerContext ctx, MessageEnvelope.Decoded decoded) {
		MessageHandler handler = handlerFor(decoded.type());
		if (handler == null) {
			SmartMC.LOGGER.warn("Unknown message type '{}' from {}, closing connection", decoded.type(), ctx.channel().remoteAddress());
			ctx.close();
			return;
		}

		try {
			// Channel.writeAndFlush is safe to call from any thread (Netty
			// hops to the channel's own event loop internally) -- handlers
			// that complete this future from the server's main thread (see
			// MessageHandler#handleAsync) don't need to hop back themselves.
			handler.handleAsync(decoded.payload(), context).whenComplete((response, error) -> {
				if (error != null) {
					SmartMC.LOGGER.warn("Malformed '{}' message from {}, closing connection", decoded.type(), ctx.channel().remoteAddress());
					ctx.close();
					return;
				}
				if (response != null) {
					ctx.writeAndFlush(MessageEnvelope.encode(GSON, response.type(), response.payload()));
				}
			});
		} catch (RuntimeException e) {
			SmartMC.LOGGER.warn("Malformed '{}' message from {}, closing connection", decoded.type(), ctx.channel().remoteAddress());
			ctx.close();
		}
	}
}
