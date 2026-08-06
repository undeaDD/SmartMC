package com.smartmc.network;

/**
 * A vanilla handshake's second byte is always {@code 0x00} (or {@code 0xFE} for the
 * legacy server-list ping). This 4-byte prefix ("SMC" + a version byte) avoids both,
 * so {@link MagicBytePeekDecoder} can tell a SmartMC client apart from a real
 * Minecraft client from the very first bytes of a new connection. See CLAUDE.md's
 * "Security model / Layer 0" for the full design rationale. Not a secret -- this is
 * a protocol discriminator, not an auth mechanism (that's M2).
 */
public final class MultiplexConstants {

	public static final byte[] MAGIC_PREFIX = {0x53, 0x4D, 0x43, 0x01};

	/** Layer 1 transport encryption -- see CLAUDE.md's "Security model / Layer 1". */
	public static final String NOISE_PROTOCOL_NAME = "Noise_XX_25519_ChaChaPoly_SHA256";

	private MultiplexConstants() {
	}
}
