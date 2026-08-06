package com.smartmc.network;

import com.eatthepath.noise.NoiseHandshake;
import com.eatthepath.noise.NoiseHandshakeBuilder;
import com.eatthepath.noise.NoiseTransport;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Drives a real, in-process Noise_XX_25519_ChaChaPoly_SHA256 handshake using
 * java-noise directly on both sides (no Netty, no mod code) -- proves our
 * configuration (protocol name, key types, message sequencing) is correct on
 * top of the library's own already-vetted internals. See
 * {@link NoisePipelineTest} for the version of this that exercises the actual
 * Netty pipeline wiring.
 */
class NoiseHandshakeTest {

	@Test
	void xxHandshakeAndTransportRoundTrip() throws Exception {
		KeyPair initiatorStatic = generateX25519();
		KeyPair responderStatic = generateX25519();

		NoiseHandshake initiator = NoiseHandshakeBuilder.forXXInitiator(initiatorStatic)
			.setComponentsFromProtocolName(MultiplexConstants.NOISE_PROTOCOL_NAME)
			.build();
		NoiseHandshake responder = NoiseHandshakeBuilder.forXXResponder(responderStatic)
			.setComponentsFromProtocolName(MultiplexConstants.NOISE_PROTOCOL_NAME)
			.build();

		// -> e
		responder.readMessage(initiator.writeMessage((byte[]) null));
		// <- e, ee, s, es
		initiator.readMessage(responder.writeMessage((byte[]) null));
		// -> s, se
		responder.readMessage(initiator.writeMessage((byte[]) null));

		assertTrue(initiator.isDone());
		assertTrue(responder.isDone());

		NoiseTransport initiatorTransport = initiator.toTransport();
		NoiseTransport responderTransport = responder.toTransport();

		byte[] request = "hello smartmc".getBytes(StandardCharsets.UTF_8);
		byte[] decryptedRequest = responderTransport.readMessage(initiatorTransport.writeMessage(request));
		assertArrayEquals(request, decryptedRequest);

		byte[] reply = "ack".getBytes(StandardCharsets.UTF_8);
		byte[] decryptedReply = initiatorTransport.readMessage(responderTransport.writeMessage(reply));
		assertArrayEquals(reply, decryptedReply);
	}

	private static KeyPair generateX25519() throws Exception {
		return KeyPairGenerator.getInstance("X25519").generateKeyPair();
	}
}
