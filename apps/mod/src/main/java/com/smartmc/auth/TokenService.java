package com.smartmc.auth;

import com.google.gson.Gson;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and verifies the opaque, Ed25519-signed auth token described in
 * CLAUDE.md's Security model:
 * {@code v1.smc.<base64url(payload)>.<base64url(sig)>}, signed over
 * {@code "v1.smc." + base64url(payload)}. Uses the server's own identity
 * keypair ({@link ServerIdentity}) -- never the Noise static keypair, per the
 * same section. The app treats the returned string as fully opaque: it only
 * stores and re-presents it, never parses {@link TokenPayload} itself, which
 * is why this type lives here rather than in the shared {@code packages/protocol}
 * schema.
 */
public class TokenService {

	private static final String PREFIX = "v1.smc.";
	private static final String ALGORITHM = "Ed25519";
	private static final Gson GSON = new Gson();
	private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
	private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

	private final ServerIdentity identity;

	public TokenService(ServerIdentity identity) {
		this.identity = identity;
	}

	public record TokenPayload(String sub, List<String> groups, String deviceId, String jti, long iat, long exp) {
	}

	/** @param token the opaque token string; @param jti the token's own jti, for the caller's session record */
	public record IssuedToken(String token, String jti) {
	}

	public IssuedToken issue(UUID playerUuid, List<String> groupIds, String deviceId, Duration validity) {
		long now = Instant.now().getEpochSecond();
		String jti = UUID.randomUUID().toString();
		TokenPayload payload = new TokenPayload(playerUuid.toString(), groupIds, deviceId, jti, now, now + validity.toSeconds());

		String payloadB64 = ENCODER.encodeToString(GSON.toJson(payload).getBytes(StandardCharsets.UTF_8));
		String signingInput = PREFIX + payloadB64;
		String sigB64 = ENCODER.encodeToString(sign(identity.privateKey(), signingInput));
		return new IssuedToken(signingInput + "." + sigB64, jti);
	}

	/** Returns the payload iff the token's signature is valid and it hasn't expired. */
	public Optional<TokenPayload> verify(String token) {
		if (!token.startsWith(PREFIX)) {
			return Optional.empty();
		}
		String rest = token.substring(PREFIX.length());
		int dot = rest.lastIndexOf('.');
		if (dot < 0) {
			return Optional.empty();
		}
		String payloadB64 = rest.substring(0, dot);
		String sigB64 = rest.substring(dot + 1);
		String signingInput = PREFIX + payloadB64;

		try {
			if (!verifySignature(identity.publicKey(), signingInput, DECODER.decode(sigB64))) {
				return Optional.empty();
			}
			TokenPayload payload = GSON.fromJson(
				new String(DECODER.decode(payloadB64), StandardCharsets.UTF_8), TokenPayload.class);
			if (payload == null || Instant.now().getEpochSecond() > payload.exp()) {
				return Optional.empty();
			}
			return Optional.of(payload);
		} catch (RuntimeException e) {
			// Malformed base64/JSON from an untrusted client -- not a bug, just an invalid token.
			return Optional.empty();
		}
	}

	private static byte[] sign(PrivateKey key, String data) {
		try {
			Signature signature = Signature.getInstance(ALGORITHM);
			signature.initSign(key);
			signature.update(data.getBytes(StandardCharsets.UTF_8));
			return signature.sign();
		} catch (Exception e) {
			throw new IllegalStateException(ALGORITHM + " signing failed", e);
		}
	}

	private static boolean verifySignature(PublicKey key, String data, byte[] sig) {
		try {
			Signature signature = Signature.getInstance(ALGORITHM);
			signature.initVerify(key);
			signature.update(data.getBytes(StandardCharsets.UTF_8));
			return signature.verify(sig);
		} catch (InvalidKeyException | SignatureException e) {
			return false;
		} catch (Exception e) {
			throw new IllegalStateException(ALGORITHM + " unavailable -- requires JDK 15+", e);
		}
	}
}
