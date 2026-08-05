package com.smartmc.network;

import com.smartmc.SmartMC;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.ByteToMessageDecoder;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;
import io.netty.handler.codec.LengthFieldPrepender;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Installed at the front of every brand-new connection's pipeline (see
 * {@code com.smartmc.mixin.ServerConnectionListenerMixin}). Peeks -- never
 * consumes -- the first {@link MultiplexConstants#MAGIC_PREFIX}.length bytes once
 * they're buffered. On a match, consumes the prefix and swaps in the ad hoc
 * framed-JSON pipeline (replaced by the real wire protocol in M4); on a mismatch,
 * removes itself immediately so the untouched bytes flow into vanilla's own
 * decoders exactly as if this handler had never existed. Runs once per new
 * connection, never on the hot path of an already-established session.
 */
public class MagicBytePeekDecoder extends ByteToMessageDecoder {

	@Override
	protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) {
		int prefixLen = MultiplexConstants.MAGIC_PREFIX.length;
		if (in.readableBytes() < prefixLen) {
			return; // not enough bytes yet; we'll be called again once more arrive
		}

		boolean match = true;
		for (int i = 0; i < prefixLen; i++) {
			if (in.getByte(in.readerIndex() + i) != MultiplexConstants.MAGIC_PREFIX[i]) {
				match = false;
				break;
			}
		}

		if (match) {
			in.skipBytes(prefixLen);
			SmartMC.LOGGER.info("smartmc handshake matched from {}, swapping pipeline", ctx.channel().remoteAddress());
			// addAfter, not addLast: by the time decode() runs, initChannel has
			// already added vanilla's ReadTimeoutHandler/LegacyQueryHandler/packet
			// codec/Connection ahead of us in the pipeline (we're only first
			// because the Mixin used addFirst before any of that ran). addLast
			// would install our echo pipeline AFTER all of vanilla's handlers,
			// so vanilla's own packet decoder would see our raw framed bytes
			// first, fail to parse them as a Minecraft packet, and close the
			// connection -- addAfter(ctx.name(), ...), chained forward, inserts
			// each handler immediately behind the previous one, ending up right
			// where this decoder currently sits, ahead of everything vanilla.
			ChannelPipeline pipeline = ctx.pipeline();
			pipeline.addAfter(ctx.name(), "smartmc_frame_decoder", new LengthFieldBasedFrameDecoder(1 << 20, 0, 4, 0, 4));
			pipeline.addAfter("smartmc_frame_decoder", "smartmc_frame_encoder", new LengthFieldPrepender(4));
			pipeline.addAfter("smartmc_frame_encoder", "smartmc_string_decoder", new StringDecoder(StandardCharsets.UTF_8));
			pipeline.addAfter("smartmc_string_decoder", "smartmc_string_encoder", new StringEncoder(StandardCharsets.UTF_8));
			pipeline.addAfter("smartmc_string_encoder", "smartmc_echo", new FramedJsonEchoHandler());
		}
		// Either path: get out of the way. Removing a ByteToMessageDecoder from
		// inside its own decode() defers the actual removal until this call
		// returns, then Netty flushes anything left in its cumulation buffer to
		// the next handler -- vanilla's own decoders on the no-match path, or the
		// framing handlers just installed above on the match path.
		ctx.pipeline().remove(this);
	}
}
