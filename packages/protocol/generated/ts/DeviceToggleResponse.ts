/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * The mod's reply to a DeviceToggleRequest.
 */
export interface DeviceToggleResponse {
  success: boolean;
  /**
   * Present only when success is true -- the device's new output state.
   */
  powered?: boolean;
  /**
   * Present only when success is false. One of "UNAUTHORIZED" (also covers
   * "device doesn't exist", deliberately generic to prevent device-ID
   * enumeration -- see CLAUDE.md's Security model), "DEVICE_CHUNK_NOT_LOADED",
   * "STALE_REFERENCE" (chunk loaded, but the block itself is gone),
   * "UNSUPPORTED_DEVICE_TYPE", or "SERVER_ERROR".
   */
  errorCode?: string;
  /**
   * Present only when success is false -- a player-facing message.
   */
  error?: string;
  [k: string]: unknown;
}
