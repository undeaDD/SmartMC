package com.smartmc.network;

import com.smartmc.SmartMC;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

/**
 * M1 proof-of-concept only: echoes back whatever framed JSON string a matched
 * connection sends. No parsing, no auth, no real protocol -- just enough to prove
 * the multiplexed pipeline actually carries a message round-trip. Replaced by the
 * real protocol handling once M4 lands the TypeSpec-generated wire types.
 */
public class FramedJsonEchoHandler extends SimpleChannelInboundHandler<String> {

	@Override
	protected void channelRead0(ChannelHandlerContext ctx, String msg) {
		SmartMC.LOGGER.debug("smartmc echo from {}: {}", ctx.channel().remoteAddress(), msg);
		ctx.writeAndFlush(msg);
	}
}
