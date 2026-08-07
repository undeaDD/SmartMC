/* eslint-disable */
/**
 * Generated from packages/protocol/schema/*.tsp via JSON Schema.
 * Do not edit by hand -- run `bun run protocol:generate`.
 */

/**
 * The mod's reply to a ServerIconRequest.
 */
export interface ServerIconResponse {
  success: boolean;
  /**
   * Present only when success is true AND the server has a `server-icon.png` -- base64-encoded PNG bytes, no data URI prefix. Absent (but still success) when the server simply hasn't set one; the app should fall back to a generic icon, not treat this as an error.
   */
  imageBase64?: string;
  /**
   * Present only when success is false (invalid/expired token, revoked session).
   */
  error?: string;
  [k: string]: unknown;
}
