package com.smartmc.network;

import com.eatthepath.noise.NoiseTransport;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToMessageCodec;

import javax.crypto.AEADBadTagException;
import java.util.List;

/**
 * Wraps a completed {@link NoiseTransport}'s ongoing encrypt/decrypt for
 * every frame after the handshake ({@link NoiseHandshakeHandler}) finishes.
 * Sits between the length-based frame codecs and the plaintext string codec,
 * so downstream handlers only ever see decrypted bytes, and upstream writes
 * only ever produce ciphertext. One instance per connection -- the wrapped
 * transport is stateful (rolling AEAD nonces) and must not be shared or
 * reused across connections.
 */
public class NoiseTransportCodec extends MessageToMessageCodec<ByteBuf, ByteBuf> {

	private final NoiseTransport transport;

	public NoiseTransportCodec(NoiseTransport transport) {
		this.transport = transport;
	}

	@Override
	protected void decode(ChannelHandlerContext ctx, ByteBuf msg, List<Object> out) throws AEADBadTagException {
		byte[] ciphertext = new byte[msg.readableBytes()];
		msg.readBytes(ciphertext);
		out.add(Unpooled.wrappedBuffer(transport.readMessage(ciphertext)));
	}

	@Override
	protected void encode(ChannelHandlerContext ctx, ByteBuf msg, List<Object> out) {
		byte[] plaintext = new byte[msg.readableBytes()];
		msg.readBytes(plaintext);
		out.add(Unpooled.wrappedBuffer(transport.writeMessage(plaintext)));
	}
}
