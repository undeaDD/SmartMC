import type { DeviceToggleRequest, DeviceToggleResponse } from '@smart-mc/protocol';
import { withSmartMcConnection } from './connection';

export type DeviceToggleOptions = {
  host: string;
  port: number;
  token: string;
  expectedServerFingerprint: string;
  deviceId: string;
  timeoutMs?: number;
};

export type DeviceToggleSuccess = DeviceToggleResponse & { success: true };

export type DeviceToggleFailure = {
  success: false;
  /** One of DeviceToggleResponse's errorCode values (e.g. "DEVICE_CHUNK_NOT_LOADED"), or absent for a connection-level failure. */
  errorCode?: string;
  error: string;
};

export type DeviceToggleOutcome = DeviceToggleSuccess | DeviceToggleFailure;

/**
 * Toggles a SWITCH-type device's redstone output. Same one-shot
 * connect/handshake/close shape as the other clients -- matches the mod's
 * `DeviceToggleMessageHandler`, including its errorCode values
 * (UNAUTHORIZED, DEVICE_CHUNK_NOT_LOADED, STALE_REFERENCE,
 * UNSUPPORTED_DEVICE_TYPE, SERVER_ERROR) passed through unchanged for the
 * caller to present however it wants -- this module does no UI/feedback of
 * its own on purpose.
 */
export function toggleDevice(options: DeviceToggleOptions): Promise<DeviceToggleOutcome> {
  const { host, port, token, expectedServerFingerprint, deviceId, timeoutMs } = options;

  return withSmartMcConnection<DeviceToggleOutcome>(
    { host, port, expectedServerFingerprint, timeoutMs },
    async (session) => {
      const request: DeviceToggleRequest = { token, deviceId };
      session.sendEnvelope('device_toggle', request);

      const responseEnvelope = await session.nextEnvelope();
      if (responseEnvelope.type !== 'device_toggle') {
        throw new Error(`Unexpected response type: ${responseEnvelope.type}`);
      }
      const response = responseEnvelope.payload as DeviceToggleResponse;

      if (!response.success) {
        return {
          success: false,
          errorCode: response.errorCode,
          error: response.error ?? 'Failed to toggle device',
        };
      }
      return { ...response, success: true };
    },
  );
}
