import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import TcpSocket from 'react-native-tcp-socket';
import { generateKeyPair, NoiseHandshakeState, NoiseTransport } from '../noise';
import { MAGIC_PREFIX, NOISE_PROTOCOL_NAME } from './constants';
import { FrameReader, prependLength } from './framing';

export type ConnectionFailure = { success: false; error: string };

export type SmartMcSession = {
  serverFingerprint: string;
  /** Sends one envelope and JSON-encodes+encrypts it over the transport. */
  sendEnvelope(type: string, payload: unknown): void;
  /** Waits for and decrypts the next framed message, parsed as `{ type, payload }`. */
  nextEnvelope(): Promise<{ type: string; payload: unknown }>;
};

export type ConnectOptions = {
  host: string;
  port: number;
  /**
   * If set, the connection fails closed unless the server's Noise
   * static-key fingerprint matches exactly (TOFU re-verification for
   * anything after first-ever pairing). Omit only when pairing for the
   * first time, when there's nothing yet to compare against.
   */
  expectedServerFingerprint?: string;
  timeoutMs?: number;
};

/**
 * Connects, runs the Noise_XX initiator handshake, and (unless this is a
 * first-ever pairing) re-verifies the server's static-key fingerprint
 * against what was pinned earlier. Shared by every one-shot SmartMC client
 * (pairing, reconnect, device list, device toggle) -- extracted once a
 * third and fourth near-identical copy of this exact plumbing were about to
 * be pasted in, matching this project's own established rule-of-three
 * convention (see the `admin list`/`sessionsRevoke` refactor on the mod
 * side for the same rule applied there).
 *
 * `run` gets a session scoped to one connection; the connection is always
 * closed once `run`'s promise settles, one way or another -- this stays a
 * one-shot client helper, not the persistent live connection for device
 * control, which is separate, later work.
 */
export function withSmartMcConnection<T>(
  options: ConnectOptions,
  run: (session: SmartMcSession) => Promise<T>,
): Promise<T | ConnectionFailure> {
  const { host, port, expectedServerFingerprint, timeoutMs = 10_000 } = options;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: T | ConnectionFailure) => {
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
      handshakeThenRun().catch((error: unknown) => {
        finish({
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed',
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

    async function handshakeThenRun() {
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
      if (expectedServerFingerprint && serverFingerprint !== expectedServerFingerprint) {
        finish({
          success: false,
          error:
            'Server identity changed since pairing -- refusing to connect. Re-pair if this server was reinstalled.',
        });
        return;
      }

      const transport = new NoiseTransport(...handshake.split());

      const session: SmartMcSession = {
        serverFingerprint,
        sendEnvelope(type, payload) {
          const envelope = { type, payload };
          const plaintext = new TextEncoder().encode(JSON.stringify(envelope));
          socket.write(prependLength(transport.writeMessage(plaintext)));
        },
        async nextEnvelope() {
          const frame = await nextFrame();
          const plaintext = transport.readMessage(frame);
          return JSON.parse(new TextDecoder().decode(plaintext));
        },
      };

      const result = await run(session);
      finish(result);
    }
  });
}
