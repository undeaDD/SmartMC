namespace SmartMc.Protocol;

/** Sent by the app to list the devices it can see -- v1 scope is "devices
 * this player owns" only; group-shared visibility is a known follow-up gap,
 * not yet queryable server-side. */
model DeviceListRequest {
  token: string;
}

/** One device, as much as the app needs to render it in a list -- not the
 * full server-side DeviceRecord (dimension/x/y/z stay server-side for now). */
model DeviceSummary {
  id: string;
  type: string;
  label: string;

  /** Present only when the device is shared with a group. */
  groupId?: string;
}

/** The mod's reply to a DeviceListRequest. */
model DeviceListResponse {
  success: boolean;

  /** Present only when success is true. */
  devices?: DeviceSummary[];

  /** Present only when success is false (invalid/expired token, revoked session). */
  error?: string;
}

/** Sent by the app to toggle a SWITCH-type device's redstone output. */
model DeviceToggleRequest {
  token: string;
  deviceId: string;
}

/** The mod's reply to a DeviceToggleRequest. */
model DeviceToggleResponse {
  success: boolean;

  /** Present only when success is true -- the device's new output state. */
  powered?: boolean;

  /** Present only when success is false. One of "UNAUTHORIZED" (also covers
   * "device doesn't exist", deliberately generic to prevent device-ID
   * enumeration -- see CLAUDE.md's Security model), "DEVICE_CHUNK_NOT_LOADED",
   * "STALE_REFERENCE" (chunk loaded, but the block itself is gone),
   * "UNSUPPORTED_DEVICE_TYPE", or "SERVER_ERROR". */
  errorCode?: string;

  /** Present only when success is false -- a player-facing message. */
  error?: string;
}
