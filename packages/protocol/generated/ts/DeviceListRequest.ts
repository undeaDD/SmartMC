/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * Sent by the app to list the devices it can see -- v1 scope is "devices
 * this player owns" only; group-shared visibility is a known follow-up gap,
 * not yet queryable server-side.
 */
export interface DeviceListRequest {
  token: string;
  [k: string]: unknown;
}
