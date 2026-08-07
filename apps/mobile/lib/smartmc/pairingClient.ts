import type { PairRequest, PairResponse } from '@smart-mc/protocol';
import { withSmartMcConnection } from './connection';

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
 * is separate, later work. No `expectedServerFingerprint` is passed to
 * {@link withSmartMcConnection} -- pairing is the one case where there's
 * nothing yet to compare the server's key against (TOFU).
 */
export function pairWithServer(options: PairOptions): Promise<PairOutcome> {
  const { host, port, pairingCode, deviceName, timeoutMs } = options;

  return withSmartMcConnection<PairOutcome>({ host, port, timeoutMs }, async (session) => {
    const request: PairRequest = { pairingCode, deviceName };
    session.sendEnvelope('pair', request);

    const responseEnvelope = await session.nextEnvelope();
    if (responseEnvelope.type !== 'pair') {
      throw new Error(`Unexpected response type: ${responseEnvelope.type}`);
    }
    const response = responseEnvelope.payload as PairResponse;

    if (!response.success) {
      return { success: false, error: response.error ?? 'Pairing failed' };
    }
    return { ...response, success: true, serverFingerprint: session.serverFingerprint };
  });
}
