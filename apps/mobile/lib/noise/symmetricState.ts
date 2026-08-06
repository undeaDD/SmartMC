import { CipherState } from './cipherState';
import { concatBytes, HASHLEN, hash, hkdf } from './primitives';

// Noise spec section 5.2.
export class SymmetricState {
  private chainingKey: Uint8Array;
  private h: Uint8Array;
  private readonly cipherState = new CipherState();

  constructor(protocolName: string) {
    const nameBytes = new TextEncoder().encode(protocolName);
    this.h = nameBytes.length <= HASHLEN ? padTo(nameBytes, HASHLEN) : hash(nameBytes);
    this.chainingKey = this.h;
  }

  mixKey(inputKeyMaterial: Uint8Array) {
    const [ck, tempK] = hkdf(this.chainingKey, inputKeyMaterial, 2);
    this.chainingKey = ck;
    this.cipherState.initializeKey(tempK);
  }

  mixHash(data: Uint8Array) {
    this.h = hash(concatBytes(this.h, data));
  }

  encryptAndHash(plaintext: Uint8Array): Uint8Array {
    const ciphertext = this.cipherState.encryptWithAd(this.h, plaintext);
    this.mixHash(ciphertext);
    return ciphertext;
  }

  decryptAndHash(ciphertext: Uint8Array): Uint8Array {
    const plaintext = this.cipherState.decryptWithAd(this.h, ciphertext);
    this.mixHash(ciphertext);
    return plaintext;
  }

  split(): [CipherState, CipherState] {
    const [tempK1, tempK2] = hkdf(this.chainingKey, new Uint8Array(0), 2);
    const c1 = new CipherState();
    c1.initializeKey(tempK1);
    const c2 = new CipherState();
    c2.initializeKey(tempK2);
    return [c1, c2];
  }
}

function padTo(data: Uint8Array, length: number): Uint8Array {
  const out = new Uint8Array(length);
  out.set(data);
  return out;
}
