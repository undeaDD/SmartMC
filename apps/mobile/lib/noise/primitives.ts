// Primitive building blocks for Noise_XX_25519_ChaChaPoly_SHA256, matching
// the exact algorithm names in MultiplexConstants.NOISE_PROTOCOL_NAME on the
// mod side. No general-purpose Noise engine here on purpose -- this project
// only ever speaks this one handshake pattern/ciphersuite, so there's no
// pattern interpreter or cipher-suite negotiation to build.

import { x25519 } from '@noble/curves/ed25519.js';
import { chacha20poly1305 } from '@noble/ciphers/chacha.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf as hkdfExpand } from '@noble/hashes/hkdf.js';
import { concatBytes } from '@noble/hashes/utils.js';

export const DHLEN = 32;
export const HASHLEN = 32;

// Key generation deliberately lives in ./keygen.ts, not here -- it needs a
// real RNG source (expo-crypto, a native module), while everything in this
// file is pure JS with no platform dependency, so lib/noise/ as a whole
// (and this verify-noise.ts test) stays runnable outside the app runtime.

export function dh(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x25519.getSharedSecret(privateKey, publicKey);
}

export function hash(data: Uint8Array): Uint8Array {
  return sha256(data);
}

// Noise's HKDF (spec section 4.3) is RFC 5869 HKDF with an empty `info` and
// output length `32 * numOutputs`, split into HASHLEN-sized chunks -- not a
// bespoke construction, just a specific parameterization of the standard one.
export function hkdf(chainingKey: Uint8Array, inputKeyMaterial: Uint8Array, numOutputs: 2 | 3): Uint8Array[] {
  const output = hkdfExpand(sha256, inputKeyMaterial, chainingKey, new Uint8Array(0), HASHLEN * numOutputs);
  const outputs: Uint8Array[] = [];
  for (let i = 0; i < numOutputs; i++) {
    outputs.push(output.subarray(i * HASHLEN, (i + 1) * HASHLEN));
  }
  return outputs;
}

// Noise's nonce encoding for ChaChaPoly: 4 zero bytes followed by the 8-byte
// little-endian counter (spec section 5.1) -- NOT the same as @noble/ciphers'
// own default nonce format, which is why this can't just be `randomBytes(12)`.
function encodeNonce(n: bigint): Uint8Array {
  const nonce = new Uint8Array(12);
  const view = new DataView(nonce.buffer);
  view.setBigUint64(4, n, true);
  return nonce;
}

export function encrypt(key: Uint8Array, n: bigint, ad: Uint8Array, plaintext: Uint8Array): Uint8Array {
  return chacha20poly1305(key, encodeNonce(n), ad).encrypt(plaintext);
}

export function decrypt(key: Uint8Array, n: bigint, ad: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  return chacha20poly1305(key, encodeNonce(n), ad).decrypt(ciphertext);
}

export { concatBytes };
export { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
