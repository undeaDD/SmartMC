/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * One device, as much as the app needs to render it in a list -- not the
 * full server-side DeviceRecord (dimension/x/y/z stay server-side for now).
 */
export interface DeviceSummary {
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
