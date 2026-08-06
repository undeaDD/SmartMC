// Verifies the hand-rolled Noise_XX_25519_ChaChaPoly_SHA256 implementation
// (lib/noise/) against the official Noise Protocol "cacophony" test vector
// for this exact ciphersuite -- required per CLAUDE.md's Security model
// before this crypto path can be trusted. Drives BOTH the initiator and
// responder sides against fixed keys from the vector (production code only
// ever uses the initiator role; the mod is always the responder), checking
// that every handshake and transport ciphertext matches byte-for-byte.
//
// Vector source: noiseprotocol/noise-c's own "cacophony" vector set
// (tests/vector/cacophony.txt), filtered to the Noise_XX_25519_ChaChaPoly_SHA256
// entry, checked in at lib/noise/__tests__/noise-xx-25519-chachapoly-sha256.vector.json.
//
// Run with:
//   bun run apps/mobile/scripts/verify-noise.ts

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { x25519 } from '@noble/curves/ed25519.js';
import { hexToBytes } from '../lib/noise/primitives';
import { NoiseHandshakeState } from '../lib/noise/handshakeState';
import { NoiseTransport } from '../lib/noise/transport';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const vectorPath = join(scriptDir, '../lib/noise/__tests__/noise-xx-25519-chachapoly-sha256.vector.json');
const vector = JSON.parse(readFileSync(vectorPath, 'utf8'));

function hex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function assertEqual(actual: Uint8Array, expectedHex: string, label: string) {
  const actualHex = hex(actual);
  if (actualHex !== expectedHex) {
    console.error(`FAIL: ${label}`);
    console.error(`  expected: ${expectedHex}`);
    console.error(`  actual:   ${actualHex}`);
    process.exitCode = 1;
    throw new Error(`vector mismatch: ${label}`);
  }
  console.log(`ok: ${label}`);
}

const protocolName = `Noise_${vector.pattern}_${vector.dh}_${vector.cipher}_${vector.hash}`;

const initStatic = { privateKey: hexToBytes(vector.init_static), publicKey: new Uint8Array(0) };
const initEphemeral = { privateKey: hexToBytes(vector.init_ephemeral), publicKey: new Uint8Array(0) };
const respStatic = { privateKey: hexToBytes(vector.resp_static), publicKey: new Uint8Array(0) };
const respEphemeral = { privateKey: hexToBytes(vector.resp_ephemeral), publicKey: new Uint8Array(0) };

// Public keys aren't given directly in the vector -- derive them the same
// way generateKeyPair() would, via x25519.getPublicKey.
for (const kp of [initStatic, initEphemeral, respStatic, respEphemeral]) {
  kp.publicKey = x25519.getPublicKey(kp.privateKey);
}

const prologue = hexToBytes(vector.init_prologue);

const initiator = new NoiseHandshakeState(protocolName, 'initiator', initStatic, () => initEphemeral, prologue);
const responder = new NoiseHandshakeState(protocolName, 'responder', respStatic, () => respEphemeral, prologue);

const messages = vector.messages as { payload: string; ciphertext: string }[];

// Message 1: -> e
const msg0 = initiator.writeMessage(hexToBytes(messages[0].payload));
assertEqual(msg0, messages[0].ciphertext, 'message 1 (initiator -> responder)');
const msg0Payload = responder.readMessage(msg0);
assertEqual(msg0Payload, messages[0].payload, 'message 1 payload decrypted by responder');

// Message 2: <- e, ee, s, es
const msg1 = responder.writeMessage(hexToBytes(messages[1].payload));
assertEqual(msg1, messages[1].ciphertext, 'message 2 (responder -> initiator)');
const msg1Payload = initiator.readMessage(msg1);
assertEqual(msg1Payload, messages[1].payload, 'message 2 payload decrypted by initiator');

// Message 3: -> s, se (handshake completes for both sides after this)
const msg2 = initiator.writeMessage(hexToBytes(messages[2].payload));
assertEqual(msg2, messages[2].ciphertext, 'message 3 (initiator -> responder)');
const msg2Payload = responder.readMessage(msg2);
assertEqual(msg2Payload, messages[2].payload, 'message 3 payload decrypted by responder');

if (!initiator.isDone() || !responder.isDone()) {
  throw new Error('handshake did not complete on both sides');
}
console.log('ok: handshake complete on both sides');

const initiatorTransport = new NoiseTransport(...initiator.split());
const responderTransport = new NoiseTransport(...responder.split());

// Transport messages continue alternating by index parity: even = initiator
// -> responder, odd = responder -> initiator (the cacophony vector format's
// convention, independent of handshake-vs-transport phase).
const transportMessages = [
  { from: responderTransport, to: initiatorTransport, index: 3 },
  { from: initiatorTransport, to: responderTransport, index: 4 },
  { from: responderTransport, to: initiatorTransport, index: 5 },
];

for (const { from, to, index } of transportMessages) {
  const plaintext = hexToBytes(messages[index].payload);
  const ciphertext = from.writeMessage(plaintext);
  assertEqual(ciphertext, messages[index].ciphertext, `transport message ${index}`);
  const decrypted = to.readMessage(ciphertext);
  assertEqual(decrypted, messages[index].payload, `transport message ${index} decrypted`);
}

console.log('\nAll Noise_XX_25519_ChaChaPoly_SHA256 vector checks passed.');
