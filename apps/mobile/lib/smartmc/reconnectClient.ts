import type { ReconnectRequest, ReconnectResponse } from '@smart-mc/protocol';
import { withSmartMcConnection } from './connection';

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
  const { host, port, token, expectedServerFingerprint, timeoutMs } = options;

  return withSmartMcConnection<ReconnectOutcome>(
    { host, port, expectedServerFingerprint, timeoutMs },
    async (session) => {
      const request: ReconnectRequest = { token };
      session.sendEnvelope('reconnect', request);

      const responseEnvelope = await session.nextEnvelope();
      if (responseEnvelope.type !== 'reconnect') {
        throw new Error(`Unexpected response type: ${responseEnvelope.type}`);
      }
      const response = responseEnvelope.payload as ReconnectResponse;

      if (!response.success) {
        return { success: false, error: response.error ?? 'Reconnect failed' };
      }
      return { ...response, success: true };
    },
  );
}
