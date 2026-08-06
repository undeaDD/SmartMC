package com.smartmc.auth;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PairingCodeManagerTest {

	@Test
	void generatedCodeConsumesToTheIssuingPlayer() {
		PairingCodeManager manager = new PairingCodeManager();
		UUID playerUuid = UUID.randomUUID();

		String code = manager.generate(playerUuid, Duration.ofMinutes(5));

		assertEquals(Optional.of(playerUuid), manager.consume(code));
	}

	@Test
	void consumeIsSingleUse() {
		PairingCodeManager manager = new PairingCodeManager();
		String code = manager.generate(UUID.randomUUID(), Duration.ofMinutes(5));

		assertTrue(manager.consume(code).isPresent());
		assertEquals(Optional.empty(), manager.consume(code));
	}

	@Test
	void expiredCodeFailsToConsume() {
		PairingCodeManager manager = new PairingCodeManager();
		String code = manager.generate(UUID.randomUUID(), Duration.ofSeconds(-1));

		assertEquals(Optional.empty(), manager.consume(code));
	}

	@Test
	void unknownCodeFailsToConsume() {
		PairingCodeManager manager = new PairingCodeManager();

		assertEquals(Optional.empty(), manager.consume("000000"));
	}
}
