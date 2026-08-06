// Local-only UI model for pinned dashboard devices. Deliberately not part of
// @smart-mc/protocol yet -- the real wire-level device model (SmartDevice,
// generic key-value/discriminated-union payload) is M5 work per CLAUDE.md's
// "Device/alarm model" section and doesn't exist server-side yet. This type
// exists purely to drive the Home grid's UI now; a real device list synced
// from a paired server will replace local state as its source later without
// needing this shape to change much, since it already mirrors the planned
// discriminated-union design.

export type AlarmDevice = {
  id: string;
  deviceType: 'alarm';
  label: string;
  armed: boolean;
  triggered: boolean;
};

export type ValueDevice = {
  id: string;
  deviceType: 'value';
  label: string;
  value: number;
  unit: string;
};

export type SwitchDevice = {
  id: string;
  deviceType: 'switch';
  label: string;
  on: boolean;
};

export type Device = AlarmDevice | ValueDevice | SwitchDevice;
