import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { ReconnectRequest, ReconnectResponse } from '@smart-mc/protocol';
import TcpSocket from 'react-native-tcp-socket';
import { generateKeyPair, NoiseHandshakeState, NoiseTransport } from '../noise';
import { MAGIC_PREFIX, NOISE_PROTOCOL_NAME } from './constants';
import { FrameReader, prependLength } from './framing';

export type ReconnectOptions = {
  host: string;
  port: number;
  token: string;
  /** Fingerprint pinned at pairing time -- reconnect fails closed if the server now presents a different key. */
  expectedServerFingerprint: string;
  timeoutMs?: number;
};

export type ReconnectSuccess = ReconnectResponse & { success: true };

export type ReconnectFailure = {
  success: false;
  error: string;
};

export type ReconnectOutcome = ReconnectSuccess | ReconnectFailure;

/**
 * Connects to a SmartMC server, runs the Noise_XX initiator handshake, then
 * presents a previously-issued token instead of a pairing code. One-shot,
 * same as pairWithServer -- this is not yet the persistent live connection
 * used for device control, which is separate, later work. On success the
 * mod always rotates the token (sliding-window renewal); callers must
 * persist the returned token in place of the one they sent.
 */
export function reconnectToServer(options: ReconnectOptions): Promise<ReconnectOutcome> {
  const { host, port, token, expectedServerFingerprint, timeoutMs = 10_000 } = options;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: ReconnectOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(outcome);
    };

    const timer = setTimeout(
      () => finish({ success: false, error: 'Timed out connecting to server' }),
      timeoutMs,
    );

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
        finish({
          success: false,
          error: error instanceof Error ? error.message : 'Reconnect failed',
        });
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
      const handshake = new NoiseHandshakeState(
        NOISE_PROTOCOL_NAME,
        'initiator',
        clientStatic,
        generateKeyPair,
      );

      socket.write(prependLength(handshake.writeMessage()));
      handshake.readMessage(await nextFrame());
      socket.write(prependLength(handshake.writeMessage()));

      const serverStaticKey = handshake.getRemoteStaticKey();
      if (!handshake.isDone() || !serverStaticKey) {
        throw new Error('Noise handshake did not complete');
      }

      const serverFingerprint = bytesToHex(sha256(serverStaticKey));
      if (serverFingerprint !== expectedServerFingerprint) {
        finish({
          success: false,
          error:
            'Server identity changed since pairing -- refusing to connect. Re-pair if this server was reinstalled.',
        });
        return;
      }

      const transport = new NoiseTransport(...handshake.split());

      const request: ReconnectRequest = { token };
      const envelope = { type: 'reconnect', payload: request };
      const plaintext = new TextEncoder().encode(JSON.stringify(envelope));
      socket.write(prependLength(transport.writeMessage(plaintext)));

      const responseFrame = await nextFrame();
      const responsePlaintext = transport.readMessage(responseFrame);
      const responseEnvelope = JSON.parse(new TextDecoder().decode(responsePlaintext));

      if (responseEnvelope.type !== 'reconnect') {
        throw new Error(`Unexpected response type: ${responseEnvelope.type}`);
      }
      const response = responseEnvelope.payload as ReconnectResponse;

      if (!response.success) {
        finish({ success: false, error: response.error ?? 'Reconnect failed' });
        return;
      }
      finish({ ...response, success: true });
    }
  });
}
