package com.smartmc.network;

import com.google.gson.Gson;
import com.smartmc.SmartMC;
import com.smartmc.network.message.PairMessageHandler;
import com.smartmc.network.message.ReconnectMessageHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

import java.util.Map;

/**
 * Terminal handler installed by {@link NoiseHandshakeHandler} once the Noise
 * tunnel is up -- replaces M1's {@code FramedJsonEchoHandler} and slice 4's
 * pairing-only {@code PairingMessageHandler}, now that there's more than one
 * message type on the tunnel. Decodes the {@link MessageEnvelope}, dispatches
 * by {@code type} to the matching {@link MessageHandler}, and encodes its
 * reply back into a new envelope. Adding a new message type is one new
 * {@link MessageHandler} implementation plus one new entry in {@link #HANDLERS}
 * -- this class itself never changes.
 */
public class SmartMcMessageHandler extends SimpleChannelInboundHandler<String> {

	private static final Gson GSON = new Gson();

	private static final Map<String, MessageHandler> HANDLERS = Map.of(
		"pair", new PairMessageHandler(),
		"reconnect", new ReconnectMessageHandler()
	);

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
		MessageHandler handler = HANDLERS.get(decoded.type());
		if (handler == null) {
			SmartMC.LOGGER.warn("Unknown message type '{}' from {}, closing connection", decoded.type(), ctx.channel().remoteAddress());
			ctx.close();
			return;
		}

		OutgoingMessage response;
		try {
			response = handler.handle(decoded.payload(), context);
		} catch (RuntimeException e) {
			SmartMC.LOGGER.warn("Malformed '{}' message from {}, closing connection", decoded.type(), ctx.channel().remoteAddress());
			ctx.close();
			return;
		}

		if (response != null) {
			ctx.writeAndFlush(MessageEnvelope.encode(GSON, response.type(), response.payload()));
		}
	}
}
