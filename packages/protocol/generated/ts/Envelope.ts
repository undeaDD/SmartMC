/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * Wraps every message exchanged over the post-handshake tunnel. `type`
 * selects which payload shape `payload` holds (e.g. "pair", "reconnect") --
 * see the mod's `com.smartmc.network.SmartMcMessageHandler` for the current
 * dispatch table. Adding a new message type means adding a new payload
 * model plus a new dispatch entry on each side; the envelope itself never
 * changes.
 */
export interface Envelope {
  type: string;
  payload: unknown;
  [k: string]: unknown;
}
