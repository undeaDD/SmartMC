import type { PairRequest, PairResponse } from '@smart-mc/protocol';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import TcpSocket from 'react-native-tcp-socket';
import { generateKeyPair, NoiseHandshakeState, NoiseTransport } from '../noise';
import { MAGIC_PREFIX, NOISE_PROTOCOL_NAME } from './constants';
import { FrameReader, prependLength } from './framing';

export type PairOptions = {
  host: string;
  port: number;
  pairingCode: string;
  deviceName: string;
  /** Milliseconds to wait for the whole handshake + pairing exchange before giving up. */
  timeoutMs?: number;
};

export type PairSuccess = PairResponse & {
  success: true;
  /** SHA-256 fingerprint (hex) of the server's Noise static public key, for TOFU pinning. */
  serverFingerprint: string;
};

export type PairFailure = {
  success: false;
  error: string;
};

export type PairOutcome = PairSuccess | PairFailure;

/**
 * Connects to a SmartMC server, runs the Noise_XX_25519_ChaChaPoly_SHA256
 * handshake as the initiator (the mod is always the responder), then submits
 * an in-game pairing code over the resulting encrypted tunnel. One-shot: the
 * connection is closed once a response arrives (or the attempt fails) --
 * this is not the persistent live connection used for device control, which
 * is separate, later work.
 */
export function pairWithServer(options: PairOptions): Promise<PairOutcome> {
  const { host, port, pairingCode, deviceName, timeoutMs = 10_000 } = options;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: PairOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(outcome);
    };

    const timer = setTimeout(() => finish({ success: false, error: 'Timed out connecting to server' }), timeoutMs);

    const reader = new FrameReader();
    const framePending: Uint8Array[] = [];
    let frameWaiter: ((frame: Uint8Array) => void) | undefined;

    const nextFrame = (): Promise<Uint8Array> => {
      const queued = framePending.shift();
      if (queued) return Promise.resolve(queued);
      return new Promise((resolveFrame) => {
        frameWaiter = resolveFrame;
      });
    };

    const socket = TcpSocket.createConnection({ port, host }, () => {
      runHandshake().catch((error: unknown) => {
        finish({ success: false, error: error instanceof Error ? error.message : 'Pairing failed' });
      });
    });

    socket.on('data', (data) => {
      const chunk = data instanceof Uint8Array ? data : new Uint8Array(Buffer.from(data, 'utf8'));
      for (const frame of reader.push(chunk)) {
        if (frameWaiter) {
          const waiter = frameWaiter;
          frameWaiter = undefined;
          waiter(frame);
        } else {
          framePending.push(frame);
        }
      }
    });

    socket.on('error', (error) => finish({ success: false, error: error.message }));
    socket.on('close', () => finish({ success: false, error: 'Connection closed unexpectedly' }));

    async function runHandshake() {
      socket.write(MAGIC_PREFIX);

      const clientStatic = generateKeyPair();
      const handshake = new NoiseHandshakeState(NOISE_PROTOCOL_NAME, 'initiator', clientStatic, generateKeyPair);

      socket.write(prependLength(handshake.writeMessage()));
      handshake.readMessage(await nextFrame());
      socket.write(prependLength(handshake.writeMessage()));

      const serverStaticKey = handshake.getRemoteStaticKey();
      if (!handshake.isDone() || !serverStaticKey) {
        throw new Error('Noise handshake did not complete');
      }
      const serverFingerprint = bytesToHex(sha256(serverStaticKey));
      const transport = new NoiseTransport(...handshake.split());

      const request: PairRequest = { pairingCode, deviceName };
      const envelope = { type: 'pair', payload: request };
      const plaintext = new TextEncoder().encode(JSON.stringify(envelope));
      socket.write(prependLength(transport.writeMessage(plaintext)));

      const responseFrame = await nextFrame();
      const responsePlaintext = transport.readMessage(responseFrame);
      const responseEnvelope = JSON.parse(new TextDecoder().decode(responsePlaintext));

      if (responseEnvelope.type !== 'pair') {
        throw new Error(`Unexpected response type: ${responseEnvelope.type}`);
      }
      const response = responseEnvelope.payload as PairResponse;

      if (!response.success) {
        finish({ success: false, error: response.error ?? 'Pairing failed' });
        return;
      }
      finish({ ...response, success: true, serverFingerprint });
    }
  });
}
