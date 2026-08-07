import type { DeviceSummary } from '@smart-mc/protocol';
import type { Device } from './types';

/**
 * Maps the wire-level `DeviceSummary` (id/type/label/groupId -- see
 * CLAUDE.md's Device/alarm model section) onto the app's local `Device`
 * union. The wire list is deliberately minimal and carries no live state
 * (no armed/triggered/on/value yet -- `DeviceListResponse` was scoped to
 * "enough to render a list", not full status), so every mapped device
 * starts at a default/unknown-looking state until a real status message
 * exists to refine it. `inventory_value`/`power_value` both collapse onto
 * the local `'value'` type -- the app doesn't distinguish them visually yet.
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
        on: false,
      };
  }
}
