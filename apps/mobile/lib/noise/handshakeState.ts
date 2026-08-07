import type { CipherState } from './cipherState';
import { concatBytes, DHLEN, dh } from './primitives';
import { SymmetricState } from './symmetricState';

export type NoiseRole = 'initiator' | 'responder';

export type KeyPair = { privateKey: Uint8Array; publicKey: Uint8Array };

// Drives one side of a Noise_XX handshake. XX's three message patterns
// (spec section 7.5) are hardcoded here rather than interpreted generically
// from a pattern table -- this project only ever speaks Noise_XX, so a
// general multi-pattern engine would be unused complexity.
//
//   -> e
//   <- e, ee, s, es
//   -> s, se
export class NoiseHandshakeState {
  private readonly symmetric: SymmetricState;
  private readonly role: NoiseRole;
  private readonly staticKeyPair: KeyPair;
  private ephemeralKeyPair: KeyPair | undefined;
  private remoteEphemeral: Uint8Array | undefined;
  private remoteStatic: Uint8Array | undefined;
  private messageIndex = 0;
  private splitResult: [CipherState, CipherState] | undefined;

  constructor(
    protocolName: string,
    role: NoiseRole,
    staticKeyPair: KeyPair,
    // Injected rather than imported directly so this file (and the rest of
    // lib/noise/) stays free of any platform-specific RNG dependency --
    // production callers pass the real generateKeyPair (backed by
    // expo-crypto's native CSPRNG), while the Noise test-vector script
    // passes a closure returning the vector's fixed ephemeral key.
    private readonly generateEphemeral: () => KeyPair,
    prologue: Uint8Array = new Uint8Array(0),
  ) {
    this.symmetric = new SymmetricState(protocolName);
    this.symmetric.mixHash(prologue);
    this.role = role;
    this.staticKeyPair = staticKeyPair;
  }

  isDone(): boolean {
    return this.splitResult !== undefined;
  }

  // XX's fixed 3-message sequence guarantees these fields are populated by
  // the time each step reads them, but that's a protocol-level invariant
  // TypeScript can't see across separate writeMessage/readMessage calls (it
  // narrows local `const`s from control flow, not `this` fields). A clear
  // thrown error on violation is strictly better than a non-null assertion's
  // generic crash if that invariant is ever actually broken by a caller.
  private requireField<T>(value: T | undefined, name: string): T {
    if (value === undefined)
      throw new Error(`Noise handshake: ${name} not yet available at this step`);
    return value;
  }

  /** Only valid once {@link isDone} is true. [sendCipher, receiveCipher] from this side's perspective. */
  split(): [CipherState, CipherState] {
    if (!this.splitResult) throw new Error('handshake not complete');
    const [c1, c2] = this.splitResult;
    return this.role === 'initiator' ? [c1, c2] : [c2, c1];
  }

  writeMessage(payload: Uint8Array = new Uint8Array(0)): Uint8Array {
    const step = this.messageIndex++;
    const isInitiatorMessage = step % 2 === 0;
    if ((this.role === 'initiator') !== isInitiatorMessage) {
      throw new Error(`not this party's turn to write (step ${step})`);
    }

    const parts: Uint8Array[] = [];

    if (step === 0) {
      this.ephemeralKeyPair = this.generateEphemeral();
      parts.push(this.ephemeralKeyPair.publicKey);
      this.symmetric.mixHash(this.ephemeralKeyPair.publicKey);
    } else if (step === 1) {
      const remoteEphemeral = this.requireField(this.remoteEphemeral, 'remoteEphemeral');
      this.ephemeralKeyPair = this.generateEphemeral();
      parts.push(this.ephemeralKeyPair.publicKey);
      this.symmetric.mixHash(this.ephemeralKeyPair.publicKey);
      this.symmetric.mixKey(dh(this.ephemeralKeyPair.privateKey, remoteEphemeral));
      parts.push(this.symmetric.encryptAndHash(this.staticKeyPair.publicKey));
      this.symmetric.mixKey(dh(this.staticKeyPair.privateKey, remoteEphemeral));
    } else if (step === 2) {
      const remoteEphemeral = this.requireField(this.remoteEphemeral, 'remoteEphemeral');
      parts.push(this.symmetric.encryptAndHash(this.staticKeyPair.publicKey));
      this.symmetric.mixKey(dh(this.staticKeyPair.privateKey, remoteEphemeral));
    } else {
      throw new Error('XX handshake only has 3 messages');
    }

    parts.push(this.symmetric.encryptAndHash(payload));

    if (step === 2) {
      this.splitResult = this.symmetric.split();
    }

    return concatBytes(...parts);
  }

  readMessage(message: Uint8Array): Uint8Array {
    const step = this.messageIndex++;
    const isInitiatorMessage = step % 2 === 0;
    if ((this.role === 'initiator') === isInitiatorMessage) {
      throw new Error(`not this party's turn to read (step ${step})`);
    }

    let offset = 0;
    const readBytes = (n: number) => {
      const slice = message.subarray(offset, offset + n);
      offset += n;
      return slice;
    };

    if (step === 0) {
      this.remoteEphemeral = readBytes(DHLEN);
      this.symmetric.mixHash(this.remoteEphemeral);
    } else if (step === 1) {
      const ephemeralKeyPair = this.requireField(this.ephemeralKeyPair, 'ephemeralKeyPair');
      const remoteEphemeral = readBytes(DHLEN);
      this.remoteEphemeral = remoteEphemeral;
      this.symmetric.mixHash(remoteEphemeral);
      this.symmetric.mixKey(dh(ephemeralKeyPair.privateKey, remoteEphemeral));
      const encryptedStatic = readBytes(DHLEN + 16);
      const remoteStatic = this.symmetric.decryptAndHash(encryptedStatic);
      this.remoteStatic = remoteStatic;
      this.symmetric.mixKey(dh(ephemeralKeyPair.privateKey, remoteStatic));
    } else if (step === 2) {
      const ephemeralKeyPair = this.requireField(this.ephemeralKeyPair, 'ephemeralKeyPair');
      const encryptedStatic = readBytes(DHLEN + 16);
      const remoteStatic = this.symmetric.decryptAndHash(encryptedStatic);
      this.remoteStatic = remoteStatic;
      this.symmetric.mixKey(dh(ephemeralKeyPair.privateKey, remoteStatic));
    } else {
      throw new Error('XX handshake only has 3 messages');
    }

    const payload = this.symmetric.decryptAndHash(message.subarray(offset));

    if (step === 2) {
      this.splitResult = this.symmetric.split();
    }

    return payload;
  }

  getRemoteStaticKey(): Uint8Array | undefined {
    return this.remoteStatic;
  }
}
