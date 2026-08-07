package com.smartmc.network;

import com.eatthepath.noise.NoiseHandshake;
import com.eatthepath.noise.NoiseHandshakeBuilder;
import com.eatthepath.noise.NoiseTransport;
import com.google.gson.Gson;
import com.smartmc.auth.PairingCodeManager;
import com.smartmc.auth.ServerIdentity;
import com.smartmc.auth.TokenService;
import com.smartmc.group.GroupInfo;
import com.smartmc.group.GroupProvider;
import com.smartmc.protocol.PairRequest;
import com.smartmc.protocol.PairResponse;
import com.smartmc.storage.SessionRecord;
import com.smartmc.storage.SessionStore;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.embedded.EmbeddedChannel;
import io.netty.handler.codec.LengthFieldBasedFrameDecoder;
import io.netty.handler.codec.LengthFieldPrepender;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.sql.SQLException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exercises the real {@link NoiseHandshakeHandler}/{@link NoiseTransportCodec}/
 * {@link SmartMcMessageHandler} pipeline via a Netty {@link EmbeddedChannel}
 * -- no real socket needed. A java-noise initiator stands in for the app on
 * "the other side," feeding length-framed bytes into the channel and reading
 * length-framed bytes back out, exactly as a real TCP peer would see them.
 * This is what actually proves the pipeline wiring (handler-swap timing on
 * handshake completion, frame boundaries) works, not just the library or the
 * pairing logic in isolation -- see {@link NoiseHandshakeTest} for the former.
 */
class NoisePipelineTest {

	@Test
	void handshakeCompletesAndPairingRoundTripsOverEncryptedTransport(@TempDir Path tempDir) throws Exception {
		Gson gson = new Gson();
		UUID playerUuid = UUID.randomUUID();

		PairingCodeManager pairingCodes = new PairingCodeManager();
		String code = pairingCodes.generate(playerUuid, Duration.ofMinutes(5));
		TokenService tokens = new TokenService(ServerIdentity.load(tempDir));
		InMemorySessionStore sessions = new InMemorySessionStore();
		GroupProvider noGroups = new GroupProvider() {
			@Override
			public List<GroupInfo> findGroupsForPlayer(UUID playerUuid) {
				return List.of();
			}

			@Override
			public Optional<GroupInfo> findGroupById(String id) {
				return Optional.empty();
			}
		};
		MessageContext context = new MessageContext(pairingCodes, tokens, sessions, noGroups, null /* devices unused by this test */, null /* server unused by this test */, Duration.ofDays(90));

		KeyPair serverStatic = generateX25519();
		KeyPair clientStatic = generateX25519();

		NoiseHandshake clientHandshake = NoiseHandshakeBuilder.forXXInitiator(clientStatic)
			.setComponentsFromProtocolName(MultiplexConstants.NOISE_PROTOCOL_NAME)
			.build();

		EmbeddedChannel channel = new EmbeddedChannel(
			new LengthFieldBasedFrameDecoder(1 << 20, 0, 4, 0, 4),
			new LengthFieldPrepender(4),
			new NoiseHandshakeHandler(serverStatic, context)
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

		PairRequest request = new PairRequest();
		request.setPairingCode(code);
		request.setDeviceName("Test Device");
		byte[] requestBytes = MessageEnvelope.encode(gson, "pair", request).getBytes(StandardCharsets.UTF_8);
		channel.writeInbound(frame(clientTransport.writeMessage(requestBytes)));

		byte[] responseBytes = clientTransport.readMessage(readFramedMessage(channel));
		MessageEnvelope.Decoded responseEnvelope = MessageEnvelope.decode(gson,
			new String(responseBytes, StandardCharsets.UTF_8)).orElseThrow();
		assertEquals("pair", responseEnvelope.type());
		PairResponse response = gson.fromJson(responseEnvelope.payload(), PairResponse.class);

		assertTrue(response.getSuccess());
		assertEquals(playerUuid.toString(), response.getPlayerUuid());
		assertNotNull(response.getToken());
		assertTrue(tokens.verify(response.getToken()).isPresent());
		assertEquals(1, sessions.records.size());
		assertEquals("Test Device", sessions.records.values().iterator().next().deviceName());
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

	/** Minimal in-memory {@link SessionStore} test double -- no H2/file IO needed for this test. */
	private static class InMemorySessionStore implements SessionStore {
		final Map<String, SessionRecord> records = new HashMap<>();

		@Override
		public void insert(SessionRecord session) {
			records.put(session.jti(), session);
		}

		@Override
		public Optional<SessionRecord> findByJti(String jti) {
			return Optional.ofNullable(records.get(jti));
		}

		@Override
		public boolean isRevoked(String jti) {
			return findByJti(jti).map(SessionRecord::revoked).orElse(true);
		}

		@Override
		public void revoke(String jti) {
			records.computeIfPresent(jti, (jtiKey, record) -> new SessionRecord(
				record.jti(), record.ownerUuid(), record.deviceId(), record.deviceName(), record.issuedAt(), true));
		}

		@Override
		public void rotate(String oldJti, String newJti, long newIssuedAt) {
			SessionRecord existing = records.remove(oldJti);
			if (existing != null) {
				records.put(newJti, new SessionRecord(
					newJti, existing.ownerUuid(), existing.deviceId(), existing.deviceName(), newIssuedAt, existing.revoked()));
			}
		}

		@Override
		public List<SessionRecord> findByOwner(UUID ownerUuid) {
			List<SessionRecord> result = new ArrayList<>();
			for (SessionRecord record : records.values()) {
				if (record.ownerUuid().equals(ownerUuid)) {
					result.add(record);
				}
			}
			return result;
		}
	}
}
