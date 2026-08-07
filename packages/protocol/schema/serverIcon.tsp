namespace SmartMc.Protocol;

/** Sent by the app to fetch the server's icon, for the paired-server list and detail view -- same `server-icon.png` vanilla itself shows in the multiplayer server list, not a SmartMC-specific asset. */
model ServerIconRequest {
  token: string;
}

/** The mod's reply to a ServerIconRequest. */
model ServerIconResponse {
  success: boolean;

  /** Present only when success is true AND the server has a `server-icon.png` -- base64-encoded PNG bytes, no data URI prefix. Absent (but still success) when the server simply hasn't set one; the app should fall back to a generic icon, not treat this as an error. */
  imageBase64?: string;

  /** Present only when success is false (invalid/expired token, revoked session). */
  error?: string;
}
