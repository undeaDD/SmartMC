import { memo, useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ContextMenu, type MenuAction } from '@/components/ContextMenu';
import { GlassSurface } from '@/components/GlassSurface';
import type { Device } from '@/lib/devices/types';
import { toggleDevice } from '@/lib/smartmc/deviceToggleClient';
import { pinDevice, unpinDevice } from '@/lib/smartmc/pinnedDevices';
import type { PairedServer } from '@/lib/smartmc/storage';
import type { CustomTheme } from '@/providers/ExtendedThemeProvider';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

const DEVICE_TYPE_ICONS = {
  switch: require('@/assets/icons/illustrations/switch.png'),
  alarm: require('@/assets/icons/illustrations/alarm.png'),
} as const;

type DeviceCellProps = {
  device: Device;
  /** Only required for switch-type devices (toggle) and whenever pinning is offered -- pin identity is `server.id` + `device.id`. */
  server?: PairedServer;
  /** Whether this device is currently pinned to the dashboard. Omit entirely to hide the pin menu (neither screen does today, but keeps the component safe by default). */
  pinned?: boolean;
  /** Devices tab only -- lets the menu offer "Pin" when not yet pinned. Home never passes this: every cell it renders is already pinned by definition, so there's nothing to offer besides "Unpin". */
  allowPinning?: boolean;
  /** Called after a successful pin/unpin write so the parent screen (which owns the pinned-derived list/order) can refresh. */
  onPinChange?: () => void;
  /** Home only -- true while the dashboard is in its drag-to-reorder mode (toggled from the tab's own header button). Suppresses this cell's own long-press menu and tap-to-toggle so the grid's own drag gesture owns the whole cell instead of contending with them. */
  reordering?: boolean;
};

/**
 * A generic dashboard cell -- shell (glass surface, label, layout) is shared
 * across every device type; only the small status/value readout in the
 * middle differs per deviceType. Adding a new device type later means adding
 * one more case here, not a new cell component.
 *
 * Owns its own tap-to-toggle behavior internally (switch devices only) --
 * callers just pass `device` + `server`, no `onPress` to build themselves.
 * `DeviceListResponse` carries no live state at all, so a successful
 * toggle's returned `powered` value is kept as a local optimistic override
 * until the next real fetch, scoped to this one cell rather than lifted to
 * the parent screen.
 *
 * Also owns its own pin/unpin menu -- a real native long-press context menu
 * (see `ContextMenu`) rather than a separate "..." button, matching the
 * platform's usual long-press-for-actions convention instead of adding a
 * dedicated trigger to an already-small cell.
 */
function DeviceCellImpl({
  device,
  server,
  pinned,
  allowPinning,
  onPinChange,
  reordering,
}: DeviceCellProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [onOverride, setOnOverride] = useState<boolean | null>(null);

  const effectiveDevice: Device =
    device.deviceType === 'switch' && onOverride !== null ? { ...device, on: onOverride } : device;

  const handlePress = useCallback(() => {
    if (device.deviceType !== 'switch' || !server) return;
    toggleDevice({
      host: server.host,
      port: server.port,
      token: server.token,
      expectedServerFingerprint: server.serverFingerprint,
      deviceId: device.id,
    }).then((outcome) => {
      if (outcome.success) {
        setOnOverride(outcome.powered ?? false);
      }
    });
    // server's fields are stable for the lifetime of a pairing (only change
    // on reconnect/re-pair, which remounts the paired-servers list anyway),
    // so depending on the object itself is enough -- no need to spread its fields.
  }, [device.deviceType, device.id, server]);

  // Empty (not just disabled) while reordering -- ContextMenu renders its
  // children completely unwrapped when there are no actions, so no native
  // long-press gesture is mounted at all to contend with Sortable.Grid's
  // own drag-activation gesture on the same cell.
  const menuActions: MenuAction[] = [];
  if (!reordering) {
    if (pinned !== undefined && server) {
      const ref = { serverId: server.id, deviceId: device.id };
      if (pinned) {
        menuActions.push({
          label: t('deviceUnpin'),
          sfSymbol: 'pin.slash',
          destructive: true,
          onPress: () => unpinDevice(ref).then(() => onPinChange?.()),
        });
      } else if (allowPinning) {
        menuActions.push({
          label: t('devicePin'),
          sfSymbol: 'pin',
          onPress: () => pinDevice(ref).then(() => onPinChange?.()),
        });
      }
    }
  }

  const color = deviceStatusColor(effectiveDevice, theme);

  return (
    // The aspectRatio-square sizing lives on this plain `View`, not on
    // `ContextMenu`/`MenuView` -- a native menu trigger is a foreign view as
    // far as Yoga is concerned, and while it renders fine as a `flex: 1`
    // *child* of an already-concretely-sized parent, using it as the
    // outermost, aspectRatio-computing node collapses to a tiny broken size
    // specifically inside Sortable.Grid's own layout pass (fine in the
    // Devices tab's plain flexDirection:'row' context, broken on Home).
    <View style={styles.wrapper}>
      <ContextMenu actions={menuActions} style={styles.fill}>
        {/* `width/height: '100%'` here, not `flex: 1` -- MenuView correctly
            sizes *itself* to fill `wrapper` (that's the `flex: 1` above),
            but its native SwiftUI/Compose layer doesn't stretch its own RN
            child to match: a `flex: 1` child collapses to its intrinsic
            content height and gets centered inside MenuView's (correctly
            full-size) bounds -- exactly the "full width, ~text-height tall,
            centered" symptom. A percentage resolves directly against the
            already-known parent size instead of relying on MenuView to
            participate in flex distribution, which sidesteps that gap. */}
        <Pressable
          style={styles.pressableFill}
          onPress={!reordering && device.deviceType === 'switch' ? handlePress : undefined}
        >
          <GlassSurface style={styles.surface} color={color}>
            <View style={styles.readout}>
              <DeviceReadout device={effectiveDevice} />
            </View>
            <Text style={[styles.label, { color: labelColor(color, theme) }]} numberOfLines={1}>
              {device.label}
            </Text>
          </GlassSurface>
        </Pressable>
      </ContextMenu>
    </View>
  );
}

/** Reference equality on `device`/`server` isn't useful here -- callers remap fresh objects every render (mapDeviceSummary et al.), so compare the fields that actually affect rendering instead. */
function devicePropsAreEqual(prev: DeviceCellProps, next: DeviceCellProps): boolean {
  if (prev.server?.id !== next.server?.id || prev.server?.token !== next.server?.token) {
    return false;
  }
  if (
    prev.pinned !== next.pinned ||
    prev.allowPinning !== next.allowPinning ||
    prev.reordering !== next.reordering
  ) {
    return false;
  }
  const a = prev.device;
  const b = next.device;
  if (a.id !== b.id || a.deviceType !== b.deviceType || a.label !== b.label) {
    return false;
  }
  switch (a.deviceType) {
    case 'switch':
      return b.deviceType === 'switch' && a.on === b.on;
    case 'alarm':
      return b.deviceType === 'alarm' && a.armed === b.armed && a.triggered === b.triggered;
    case 'value':
      return b.deviceType === 'value' && a.value === b.value && a.unit === b.unit;
  }
}

export const DeviceCell = memo(DeviceCellImpl, devicePropsAreEqual);

function deviceStatusColor(device: Device, theme: CustomTheme): string | undefined {
  switch (device.deviceType) {
    case 'switch':
      return device.on ? theme.colors.success : undefined;
    case 'alarm':
      return device.triggered
        ? theme.colors.danger
        : device.armed
          ? theme.colors.success
          : theme.colors.disabled;
    case 'value':
      // No natural on/off state for a numeric readout -- left untinted
      // until there's a real spec for what "active" means here (e.g. a
      // configurable threshold), rather than guessing one.
      return undefined;
  }
}

/**
 * The label sits on top of whatever tint `GlassSurface` is showing, which
 * needs a specific contrasting color per tint rather than one fixed color --
 * the success/danger tints are strong, opaque-ish fills (see GlassSurface's
 * `TINT_ALPHA`) that the default secondary text color doesn't read well
 * against. Untinted and the neutral `disabled` tint stay on the existing
 * secondary color, which already has enough contrast against those.
 */
function labelColor(tintColor: string | undefined, theme: CustomTheme): string {
  if (tintColor === theme.colors.success) return '#000000';
  if (tintColor === theme.colors.danger) return '#ffffff';
  return theme.colors.textSecondary;
}

function DeviceReadout({ device }: { device: Device }) {
  const { theme } = useTheme();

  switch (device.deviceType) {
    case 'value':
      return (
        <Text style={[styles.valueText, { color: theme.colors.text }]}>
          {device.value}
          <Text style={[styles.unitText, { color: theme.colors.textSecondary }]}>
            {' '}
            {device.unit}
          </Text>
        </Text>
      );
    case 'switch':
      return <Image source={DEVICE_TYPE_ICONS.switch} style={styles.icon} />;
    case 'alarm':
      return <Image source={DEVICE_TYPE_ICONS.alarm} style={styles.icon} />;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    aspectRatio: 1,
    padding: 10,
  },
  fill: {
    flex: 1,
  },
  pressableFill: {
    width: '100%',
    height: '100%',
  },
  surface: {
    flex: 1,
    padding: 14,
    borderRadius: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 60,
    height: 60,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 28,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
