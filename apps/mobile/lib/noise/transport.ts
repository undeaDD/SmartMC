import type { CipherState } from './cipherState';

const NO_AD = new Uint8Array(0);

// Post-handshake message encryption, mirroring the mod's NoiseTransport:
// transport messages use EncryptWithAd/DecryptWithAd with empty associated
// data (Noise spec section 5.2). One instance per connection -- the wrapped
// CipherStates are stateful (rolling AEAD nonces) and must not be reused.
export class NoiseTransport {
  constructor(
    private readonly sendCipher: CipherState,
    private readonly receiveCipher: CipherState,
  ) {}

  writeMessage(plaintext: Uint8Array): Uint8Array {
    return this.sendCipher.encryptWithAd(NO_AD, plaintext);
  }

  readMessage(ciphertext: Uint8Array): Uint8Array {
    return this.receiveCipher.decryptWithAd(NO_AD, ciphertext);
  }
}
