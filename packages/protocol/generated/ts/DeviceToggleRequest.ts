/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * Sent by the app to toggle a SWITCH-type device's redstone output.
 */
export interface DeviceToggleRequest {
  token: string;
  deviceId: string;
  [k: string]: unknown;
}
