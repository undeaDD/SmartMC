/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * The mod's reply to a DeviceListRequest.
 */
export interface DeviceListResponse {
  success: boolean;
  /**
   * Present only when success is true.
   */
  devices?: DeviceSummaryJson[];
  /**
   * Present only when success is false (invalid/expired token, revoked session).
   */
  error?: string;
  [k: string]: unknown;
}
/**
 * One device, as much as the app needs to render it in a list -- not the
 * full server-side DeviceRecord (dimension/x/y/z stay server-side for now).
 */
export interface DeviceSummaryJson {
  id: string;
  type: string;
  label: string;
  /**
   * Present only when the device is shared with a group.
   */
  groupId?: string;
  /**
   * Live on/off state for a "switch" device -- read from the actual
   * in-world block when the request is handled. Absent if the device's
   * chunk isn't currently loaded (state genuinely unknown, not "off") or
   * the device type doesn't have a powered state.
   */
  powered?: boolean;
  [k: string]: unknown;
}
