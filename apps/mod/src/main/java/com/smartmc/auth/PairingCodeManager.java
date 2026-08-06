package com.smartmc.auth;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory, single-use, TTL-bound pairing codes -- never persisted (see
 * CLAUDE.md's "Replay {@literal &} revocation"). A player runs {@code
 * /smartmc pair} in-game to get a code (see {@code com.smartmc.command.SmartMcCommand}),
 * then types it into the app, which submits it as a {@code PairRequest} over
 * the Noise-encrypted tunnel (see {@code com.smartmc.network.PairingMessageHandler}).
 */
public class PairingCodeManager {

	private static final SecureRandom RANDOM = new SecureRandom();

	private final Map<String, PendingCode> codes = new ConcurrentHashMap<>();

	/** Generates a fresh 6-digit code for {@code playerUuid}, valid for {@code ttl}. */
	public String generate(UUID playerUuid, Duration ttl) {
		sweepExpired();
		String code = String.format("%06d", RANDOM.nextInt(1_000_000));
		codes.put(code, new PendingCode(playerUuid, Instant.now().plus(ttl)));
		return code;
	}

	/**
	 * Consumes {@code code} if it exists and hasn't expired, returning the
	 * player it was issued to. Single-use: removed from the pending set
	 * regardless of whether it was still valid, so a stale/expired code can't
	 * be retried.
	 */
	public Optional<UUID> consume(String code) {
		PendingCode pending = codes.remove(code);
		if (pending == null || Instant.now().isAfter(pending.expiresAt())) {
			return Optional.empty();
		}
		return Optional.of(pending.playerUuid());
	}

	private void sweepExpired() {
		Instant now = Instant.now();
		codes.values().removeIf(pending -> now.isAfter(pending.expiresAt()));
	}

	private record PendingCode(UUID playerUuid, Instant expiresAt) {
	}
}
