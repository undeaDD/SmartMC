// Mirrors com.smartmc.network.MultiplexConstants on the mod side exactly --
// see that file for the full design rationale (CLAUDE.md's Security model,
// Layer 0/Layer 1).
export const MAGIC_PREFIX = new Uint8Array([0x53, 0x4d, 0x43, 0x01]);
export const NOISE_PROTOCOL_NAME = 'Noise_XX_25519_ChaChaPoly_SHA256';
