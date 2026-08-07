import { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from '@/components/GlassSurface';
import type { Device } from '@/lib/devices/types';
import { toggleDevice } from '@/lib/smartmc/deviceToggleClient';
import type { PairedServer } from '@/lib/smartmc/storage';
import type { CustomTheme } from '@/providers/ExtendedThemeProvider';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

type DeviceCellProps = {
  device: Device;
  /** Only required for switch-type devices -- that's the only type this cell can toggle itself. */
  server?: PairedServer;
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
 */
function DeviceCellImpl({ device, server }: DeviceCellProps) {
  const { theme } = useTheme();
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

  const color = deviceStatusColor(effectiveDevice, theme);

  return (
    <Pressable
      style={styles.wrapper}
      onPress={device.deviceType === 'switch' ? handlePress : undefined}
    >
      <GlassSurface style={styles.surface} color={color}>
        <View style={styles.readout}>
          <DeviceReadout device={effectiveDevice} />
        </View>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {device.label}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

/** Reference equality on `device`/`server` isn't useful here -- callers remap fresh objects every render (mapDeviceSummary et al.), so compare the fields that actually affect rendering instead. */
function devicePropsAreEqual(prev: DeviceCellProps, next: DeviceCellProps): boolean {
  if (prev.server?.id !== next.server?.id || prev.server?.token !== next.server?.token) {
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
      return device.on ? theme.colors.success : theme.colors.disabled;
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

function DeviceReadout({ device }: { device: Device }) {
  const { theme } = useTheme();
  const { t } = useI18n();

  switch (device.deviceType) {
    case 'alarm': {
      const text = device.triggered
        ? t('deviceAlarmTriggered')
        : device.armed
          ? t('deviceAlarmArmed')
          : t('deviceAlarmDisarmed');
      return <Text style={[styles.statusText, { color: theme.colors.text }]}>{text}</Text>;
    }
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
    case 'switch': {
      const text = device.on ? t('deviceSwitchOn') : t('deviceSwitchOff');
      return <Text style={[styles.statusText, { color: theme.colors.text }]}>{text}</Text>;
    }
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    aspectRatio: 1,
    padding: 10,
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
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
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
