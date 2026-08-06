import { decrypt, encrypt } from './primitives';

// Noise spec section 5.1. `k` absent means "no key yet" -- EncryptWithAd and
// DecryptWithAd pass data through unchanged in that state (used before the
// handshake has mixed in any key material).
export class CipherState {
  private key: Uint8Array | undefined;
  private nonce = 0n;

  initializeKey(key: Uint8Array | undefined) {
    this.key = key;
    this.nonce = 0n;
  }

  hasKey(): boolean {
    return this.key !== undefined;
  }

  encryptWithAd(ad: Uint8Array, plaintext: Uint8Array): Uint8Array {
    if (!this.key) return plaintext;
    const ciphertext = encrypt(this.key, this.nonce, ad, plaintext);
    this.nonce += 1n;
    return ciphertext;
  }

  decryptWithAd(ad: Uint8Array, ciphertext: Uint8Array): Uint8Array {
    if (!this.key) return ciphertext;
    const plaintext = decrypt(this.key, this.nonce, ad, ciphertext);
    this.nonce += 1n;
    return plaintext;
  }
}
