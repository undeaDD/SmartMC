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
  [k: string]: unknown;
}
