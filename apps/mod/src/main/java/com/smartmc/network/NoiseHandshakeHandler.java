package com.smartmc.network;

import com.eatthepath.noise.NoiseHandshake;
import com.eatthepath.noise.NoiseHandshakeBuilder;
import com.eatthepath.noise.NoiseTransport;
import com.smartmc.SmartMC;
import com.smartmc.auth.PairingCodeManager;
import com.smartmc.auth.TokenService;
import com.smartmc.storage.SessionStore;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;

import javax.crypto.AEADBadTagException;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;

/**
 * Drives the responder side of a Noise_XX_25519_ChaChaPoly_SHA256 handshake
 * for a single connection. Installed by {@link MagicBytePeekDecoder} right
 * after the length-based frame codecs, replacing M1's plaintext echo
 * pipeline. Each incoming frame is fed to the handshake state machine; a
 * response frame is written back whenever the handshake expects one. Once
 * {@link NoiseHandshake#isDone()}, this handler removes itself and installs
 * {@link NoiseTransportCodec} (plus the plaintext string codec and
 * {@link PairingMessageHandler}) in its place, using the same addAfter-chaining
 * technique {@link MagicBytePeekDecoder} already established -- addLast would
 * land these handlers after vanilla's own, which already sit ahead of us in
 * the pipeline by the time any of this runs.
 */
public class NoiseHandshakeHandler extends SimpleChannelInboundHandler<ByteBuf> {

	private final NoiseHandshake handshake;
	private final PairingCodeManager pairingCodes;
	private final TokenService tokens;
	private final SessionStore sessions;
	private final Duration tokenValidity;

	/**
	 * The pairing/token/session dependencies are taken here, not read from
	 * {@link SmartMC}'s statics internally, so this class (and the
	 * {@link PairingMessageHandler} it installs on completion) stay
	 * constructible in isolation for tests -- {@link MagicBytePeekDecoder}
	 * is the sole place that reaches into {@code SmartMC} to wire these up.
	 */
	public NoiseHandshakeHandler(KeyPair localStaticKeyPair, PairingCodeManager pairingCodes, TokenService tokens,
								  SessionStore sessions, Duration tokenValidity) {
		try {
			this.handshake = NoiseHandshakeBuilder.forXXResponder(localStaticKeyPair)
				.setComponentsFromProtocolName(MultiplexConstants.NOISE_PROTOCOL_NAME)
				.build();
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(MultiplexConstants.NOISE_PROTOCOL_NAME + " components unavailable", e);
		}
		this.pairingCodes = pairingCodes;
		this.tokens = tokens;
		this.sessions = sessions;
		this.tokenValidity = tokenValidity;
	}

	@Override
	protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) {
		byte[] message = new byte[msg.readableBytes()];
		msg.readBytes(message);

		try {
			handshake.readMessage(message);
		} catch (AEADBadTagException | IllegalArgumentException | IllegalStateException e) {
			SmartMC.LOGGER.warn("Noise handshake failed for {}, closing connection", ctx.channel().remoteAddress(), e);
			ctx.close();
			return;
		}

		if (handshake.isExpectingWrite()) {
			ctx.writeAndFlush(Unpooled.wrappedBuffer(handshake.writeMessage((byte[]) null)));
		}

		if (handshake.isDone()) {
			SmartMC.LOGGER.info("Noise handshake complete for {}", ctx.channel().remoteAddress());
			NoiseTransport transport = handshake.toTransport();
			ChannelPipeline pipeline = ctx.pipeline();
			pipeline.addAfter(ctx.name(), "smartmc_noise_transport", new NoiseTransportCodec(transport));
			pipeline.addAfter("smartmc_noise_transport", "smartmc_string_decoder", new StringDecoder(StandardCharsets.UTF_8));
			pipeline.addAfter("smartmc_string_decoder", "smartmc_string_encoder", new StringEncoder(StandardCharsets.UTF_8));
			pipeline.addAfter("smartmc_string_encoder", "smartmc_pairing",
				new PairingMessageHandler(pairingCodes, tokens, sessions, tokenValidity));
			pipeline.remove(ctx.name());
		}
	}
}
