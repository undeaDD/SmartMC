package com.smartmc.network;

import com.eatthepath.noise.NoiseHandshake;
import com.eatthepath.noise.NoiseHandshakeBuilder;
import com.eatthepath.noise.NoiseTransport;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.embedded.EmbeddedChannel;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;
import io.netty.handler.codec.LengthFieldPrepender;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exercises the real {@link NoiseHandshakeHandler}/{@link NoiseTransportCodec}
 * pipeline via a Netty {@link EmbeddedChannel} -- no real socket needed. A
 * java-noise initiator stands in for the app on "the other side," feeding
 * length-framed bytes into the channel and reading length-framed bytes back
 * out, exactly as a real TCP peer would see them. This is what actually
 * proves the pipeline wiring (handler-swap timing on handshake completion,
 * frame boundaries) works, not just the library in isolation -- see
 * {@link NoiseHandshakeTest} for that half.
 */
class NoisePipelineTest {

	@Test
	void handshakeCompletesAndEchoRoundTripsOverEncryptedTransport() throws Exception {
		KeyPair serverStatic = generateX25519();
		KeyPair clientStatic = generateX25519();

		NoiseHandshake clientHandshake = NoiseHandshakeBuilder.forXXInitiator(clientStatic)
			.setComponentsFromProtocolName(MultiplexConstants.NOISE_PROTOCOL_NAME)
			.build();

		EmbeddedChannel channel = new EmbeddedChannel(
			new LengthFieldBasedFrameDecoder(1 << 20, 0, 4, 0, 4),
			new LengthFieldPrepender(4),
			new NoiseHandshakeHandler(serverStatic)
		);

		// -> e
		channel.writeInbound(frame(clientHandshake.writeMessage((byte[]) null)));
		// <- e, ee, s, es
		clientHandshake.readMessage(readFramedMessage(channel));
		// -> s, se
		channel.writeInbound(frame(clientHandshake.writeMessage((byte[]) null)));

		assertTrue(clientHandshake.isDone());
		assertNoFurtherHandshakeOutput(channel);

		NoiseTransport clientTransport = clientHandshake.toTransport();

		byte[] request = "{\"ping\":true}".getBytes(StandardCharsets.UTF_8);
		channel.writeInbound(frame(clientTransport.writeMessage(request)));

		byte[] response = clientTransport.readMessage(readFramedMessage(channel));
		assertEquals(new String(request, StandardCharsets.UTF_8), new String(response, StandardCharsets.UTF_8));
	}

	private static void assertNoFurtherHandshakeOutput(EmbeddedChannel channel) {
		ByteBuf leftover = channel.readOutbound();
		if (leftover != null) {
			leftover.release();
			throw new AssertionError("Expected no further handshake output once the client's final message is sent");
		}
	}

	private static ByteBuf frame(byte[] payload) {
		ByteBuf buf = Unpooled.buffer(4 + payload.length);
		buf.writeInt(payload.length);
		buf.writeBytes(payload);
		return buf;
	}

	/**
	 * {@link LengthFieldPrepender} is a {@code MessageToMessageEncoder}: it
	 * queues the 4-byte length header and the original payload as two
	 * separate outbound messages (Netty coalesces these into one write on a
	 * real socket, but {@link EmbeddedChannel}'s outbound queue keeps them
	 * distinct), so reading a full outgoing frame back out takes two
	 * {@code readOutbound()} calls, not one.
	 */
	private static byte[] readFramedMessage(EmbeddedChannel channel) {
		ByteBuf header = channel.readOutbound();
		int length = header.readInt();
		header.release();

		ByteBuf payload = channel.readOutbound();
		byte[] bytes = new byte[length];
		payload.readBytes(bytes);
		payload.release();
		return bytes;
	}

	private static KeyPair generateX25519() throws Exception {
		return KeyPairGenerator.getInstance("X25519").generateKeyPair();
	}
}
