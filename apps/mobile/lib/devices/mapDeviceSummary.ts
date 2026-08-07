import type { DeviceSummary } from '@smart-mc/protocol';
import type { Device } from './types';

/**
 * Maps the wire-level `DeviceSummary` (id/type/label/groupId/powered -- see
 * CLAUDE.md's Device/alarm model section) onto the app's local `Device`
 * union. `powered` (switch devices only) is the one piece of real live
 * state the list carries -- read from the actual in-world block by the mod,
 * absent when the device's chunk isn't loaded (state genuinely unknown, not
 * "off", so this defaults to `false` only for lack of a better placeholder
 * until the UI has a real "unknown" state to show). Alarm/value devices
 * still have no live state at all yet (no armed/triggered/value in the wire
 * schema), so those keep defaulting until a real status message exists.
 * `inventory_value`/`power_value` both collapse onto the local `'value'`
 * type -- the app doesn't distinguish them visually yet.
 */
export function mapDeviceSummary(summary: DeviceSummary): Device {
  switch (summary.type) {
    case 'alarm':
      return {
        id: summary.id,
        deviceType: 'alarm',
        label: summary.label,
        armed: false,
        triggered: false,
      };
    case 'inventory_value':
    case 'power_value':
      return {
        id: summary.id,
        deviceType: 'value',
        label: summary.label,
        value: 0,
        unit: '',
      };
    default:
      return {
        id: summary.id,
        deviceType: 'switch',
        label: summary.label,
        on: summary.powered ?? false,
      };
  }
}
