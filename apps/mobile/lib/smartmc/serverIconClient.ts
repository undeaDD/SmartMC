import type { ServerIconRequest, ServerIconResponse } from '@smart-mc/protocol';
import { withSmartMcConnection } from './connection';

export type ServerIconOptions = {
  host: string;
  port: number;
  token: string;
  expectedServerFingerprint: string;
  timeoutMs?: number;
};

export type ServerIconOutcome =
  | { success: true; imageBase64?: string }
  | { success: false; error: string };

/**
 * Fetches the server's `server-icon.png` (the same file vanilla itself
 * shows in the multiplayer server list), for the paired-server list and
 * detail view. Same one-shot connect/handshake/close shape as the other
 * one-shot clients (pairing, reconnect, device list/toggle). A server with
 * no icon set is a normal outcome (`success: true`, `imageBase64` absent),
 * not a failure -- only a real connection/auth problem is `success: false`.
 */
export function fetchServerIcon(options: ServerIconOptions): Promise<ServerIconOutcome> {
  const { host, port, token, expectedServerFingerprint, timeoutMs } = options;

  return withSmartMcConnection<ServerIconOutcome>(
    { host, port, expectedServerFingerprint, timeoutMs },
    async (session) => {
      const request: ServerIconRequest = { token };
      session.sendEnvelope('server_icon', request);

      const responseEnvelope = await session.nextEnvelope();
      if (responseEnvelope.type !== 'server_icon') {
        throw new Error(`Unexpected response type: ${responseEnvelope.type}`);
      }
      const response = responseEnvelope.payload as ServerIconResponse;

      if (!response.success) {
        return { success: false, error: response.error ?? 'Failed to fetch server icon' };
      }
      return { success: true, imageBase64: response.imageBase64 };
    },
  );
}
