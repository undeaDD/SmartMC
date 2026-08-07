import type { DeviceListRequest, DeviceListResponse } from '@smart-mc/protocol';
import { withSmartMcConnection } from './connection';

export type DeviceListOptions = {
  host: string;
  port: number;
  token: string;
  expectedServerFingerprint: string;
  timeoutMs?: number;
};

export type DeviceListSuccess = DeviceListResponse & { success: true };

export type DeviceListFailure = {
  success: false;
  error: string;
};

export type DeviceListOutcome = DeviceListSuccess | DeviceListFailure;

/**
 * Fetches the devices this player owns from a paired server. Same one-shot
 * connect/handshake/close shape as pairing/reconnect -- v1 scope is owned
 * devices only, matching the mod's own `DeviceListMessageHandler` (no
 * group-shared visibility yet, see CLAUDE.md's Device/alarm model section).
 */
export function fetchDeviceList(options: DeviceListOptions): Promise<DeviceListOutcome> {
  const { host, port, token, expectedServerFingerprint, timeoutMs } = options;

  return withSmartMcConnection<DeviceListOutcome>(
    { host, port, expectedServerFingerprint, timeoutMs },
    async (session) => {
      const request: DeviceListRequest = { token };
      session.sendEnvelope('devices', request);

      const responseEnvelope = await session.nextEnvelope();
      if (responseEnvelope.type !== 'devices') {
        throw new Error(`Unexpected response type: ${responseEnvelope.type}`);
      }
      const response = responseEnvelope.payload as DeviceListResponse;

      if (!response.success) {
        return { success: false, error: response.error ?? 'Failed to list devices' };
      }
      return { ...response, success: true };
    },
  );
}
