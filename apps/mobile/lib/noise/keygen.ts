import { x25519 } from '@noble/curves/ed25519.js';
import { getRandomBytes } from 'expo-crypto';
import type { KeyPair } from './handshakeState';

// Deliberately its own file, kept out of primitives.ts/handshakeState.ts:
// this is the one place in lib/noise/ that needs a real platform RNG.
// Not @noble/hashes' own `randomBytes` -- that requires
// `globalThis.crypto.getRandomValues`, which isn't guaranteed present on
// React Native/Hermes without an extra polyfill. `expo-crypto` is backed by
// each platform's real native CSPRNG (SecRandomCopyBytes / SecureRandom) and
// needs no polyfill -- see CLAUDE.md's Security model, which specifies
// exactly this: app-side randomness seeded by expo-crypto.
export function generateKeyPair(): KeyPair {
  const privateKey = getRandomBytes(32);
  return { privateKey, publicKey: x25519.getPublicKey(privateKey) };
}
