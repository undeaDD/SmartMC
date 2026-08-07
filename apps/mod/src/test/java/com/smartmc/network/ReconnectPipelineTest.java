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
import com.smartmc.protocol.ReconnectRequest;
import com.smartmc.protocol.ReconnectResponse;
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
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Drives a full pair-then-reconnect exchange through the real
 * {@link NoiseHandshakeHandler}/{@link SmartMcMessageHandler} pipeline via an
 * {@link EmbeddedChannel}, proving the sliding-window rotation actually
 * works end to end: reconnect issues a fresh token and moves the session row
 * to the new {@code jti} in place (not a second row), and the previously
 * issued token's session can no longer be found once rotated away.
 */
class ReconnectPipelineTest {

	@Test
	void pairThenReconnectRotatesTheToken(@TempDir Path tempDir) throws Exception {
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
		MessageContext context = new MessageContext(pairingCodes, tokens, sessions, noGroups, null /* devices unused by this test */, null /* server unused by this test */, Duration.ofDays(90), null /* gameDir unused by this test */);

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

		// Noise_XX handshake
		channel.writeInbound(frame(clientHandshake.writeMessage((byte[]) null)));
		clientHandshake.readMessage(readFramedMessage(channel));
		channel.writeInbound(frame(clientHandshake.writeMessage((byte[]) null)));
		assertTrue(clientHandshake.isDone());
		NoiseTransport transport = clientHandshake.toTransport();

		// pair
		PairRequest pairRequest = new PairRequest();
		pairRequest.setPairingCode(code);
		pairRequest.setDeviceName("Test Device");
		channel.writeInbound(frame(transport.writeMessage(
			MessageEnvelope.encode(gson, "pair", pairRequest).getBytes(StandardCharsets.UTF_8))));

		MessageEnvelope.Decoded pairEnvelope = MessageEnvelope.decode(gson,
			new String(transport.readMessage(readFramedMessage(channel)), StandardCharsets.UTF_8)).orElseThrow();
		assertEquals("pair", pairEnvelope.type());
		PairResponse pairResponse = gson.fromJson(pairEnvelope.payload(), PairResponse.class);
		assertTrue(pairResponse.getSuccess());
		String firstToken = pairResponse.getToken();
		assertNotNull(firstToken);

		// reconnect
		ReconnectRequest reconnectRequest = new ReconnectRequest();
		reconnectRequest.setToken(firstToken);
		channel.writeInbound(frame(transport.writeMessage(
			MessageEnvelope.encode(gson, "reconnect", reconnectRequest).getBytes(StandardCharsets.UTF_8))));

		MessageEnvelope.Decoded reconnectEnvelope = MessageEnvelope.decode(gson,
			new String(transport.readMessage(readFramedMessage(channel)), StandardCharsets.UTF_8)).orElseThrow();
		assertEquals("reconnect", reconnectEnvelope.type());
		ReconnectResponse reconnectResponse = gson.fromJson(reconnectEnvelope.payload(), ReconnectResponse.class);
		assertTrue(reconnectResponse.getSuccess());
		String secondToken = reconnectResponse.getToken();
		assertNotNull(secondToken);
		assertNotEquals(firstToken, secondToken);

		// the old token's signature/expiry still verify (it's immutable) --
		// revocation lives in the session store, not the token itself
		String oldJti = tokens.verify(firstToken).orElseThrow().jti();
		assertTrue(sessions.findByJti(oldJti).isEmpty(), "old jti should have been rotated away, not just marked revoked");

		String newJti = tokens.verify(secondToken).orElseThrow().jti();
		Optional<SessionRecord> newSession = sessions.findByJti(newJti);
		assertTrue(newSession.isPresent());
		assertFalse(newSession.get().revoked());

		// rotation updates the row in place -- still exactly one session for this device
		assertEquals(1, sessions.findByOwner(playerUuid).size());
	}

	private static ByteBuf frame(byte[] payload) {
		ByteBuf buf = Unpooled.buffer(4 + payload.length);
		buf.writeInt(payload.length);
		buf.writeBytes(payload);
		return buf;
	}

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

	/** Minimal in-memory {@link SessionStore} test double, including {@code rotate}. */
	private static class InMemorySessionStore implements SessionStore {
		private final Map<String, SessionRecord> records = new HashMap<>();

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
