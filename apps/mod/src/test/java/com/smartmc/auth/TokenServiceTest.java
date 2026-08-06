package com.smartmc.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenServiceTest {

	@Test
	void issuedTokenVerifiesWithTheSameClaims(@TempDir Path tempDir) {
		TokenService tokens = new TokenService(ServerIdentity.load(tempDir));
		UUID playerUuid = UUID.randomUUID();
		List<String> groups = List.of("group-a", "group-b");

		TokenService.IssuedToken issued = tokens.issue(playerUuid, groups, "device-1", Duration.ofDays(90));
		Optional<TokenService.TokenPayload> verified = tokens.verify(issued.token());

		assertTrue(verified.isPresent());
		assertEquals(playerUuid.toString(), verified.get().sub());
		assertEquals(groups, verified.get().groups());
		assertEquals("device-1", verified.get().deviceId());
		assertEquals(issued.jti(), verified.get().jti());
	}

	@Test
	void tamperedSignatureFailsVerification(@TempDir Path tempDir) {
		TokenService tokens = new TokenService(ServerIdentity.load(tempDir));
		TokenService.IssuedToken issued = tokens.issue(UUID.randomUUID(), List.of(), "device-1", Duration.ofDays(90));

		// Flip the first character of the signature segment (right after the
		// last '.'), not the last character of the token -- base64's final
		// character in a group can carry unused padding bits that decoding
		// ignores, so a flip there wouldn't reliably change the actual
		// signature bytes. The first character of a group always does.
		int sigStart = issued.token().lastIndexOf('.') + 1;
		char original = issued.token().charAt(sigStart);
		char flipped = original == 'A' ? 'B' : 'A';
		String tampered = issued.token().substring(0, sigStart) + flipped + issued.token().substring(sigStart + 1);

		assertFalse(tokens.verify(tampered).isPresent());
	}

	@Test
	void expiredTokenFailsVerification(@TempDir Path tempDir) {
		TokenService tokens = new TokenService(ServerIdentity.load(tempDir));
		TokenService.IssuedToken issued = tokens.issue(UUID.randomUUID(), List.of(), "device-1", Duration.ofSeconds(-1));

		assertFalse(tokens.verify(issued.token()).isPresent());
	}

	@Test
	void tokenSignedByADifferentServerIdentityFailsVerification(@TempDir Path tempDir) {
		TokenService issuer = new TokenService(ServerIdentity.load(tempDir.resolve("server-a")));
		TokenService verifier = new TokenService(ServerIdentity.load(tempDir.resolve("server-b")));

		TokenService.IssuedToken issued = issuer.issue(UUID.randomUUID(), List.of(), "device-1", Duration.ofDays(90));

		assertFalse(verifier.verify(issued.token()).isPresent());
	}
}
