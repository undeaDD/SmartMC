import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassSurface } from '@/components/GlassSurface';
import type { Device } from '@/lib/devices/types';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

type DeviceCellProps = {
  device: Device;
  onPress?: () => void;
};

/**
 * A generic dashboard cell -- shell (glass surface, label, layout) is shared
 * across every device type; only the small status/value readout in the
 * middle differs per deviceType. Adding a new device type later means adding
 * one more case here, not a new cell component.
 */
export function DeviceCell({ device, onPress }: DeviceCellProps) {
  const { theme } = useTheme();

  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <GlassSurface style={styles.surface}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {device.label}
        </Text>
        <View style={styles.readout}>
          <DeviceReadout device={device} />
        </View>
      </GlassSurface>
    </Pressable>
  );
}

function DeviceReadout({ device }: { device: Device }) {
  const { theme } = useTheme();
  const { t } = useI18n();

  switch (device.deviceType) {
    case 'alarm': {
      const color = device.triggered ? theme.colors.danger : device.armed ? theme.colors.success : theme.colors.disabled;
      const text = device.triggered ? t('deviceAlarmTriggered') : device.armed ? t('deviceAlarmArmed') : t('deviceAlarmDisarmed');
      return (
        <>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>{text}</Text>
        </>
      );
    }
    case 'value':
      return (
        <Text style={[styles.valueText, { color: theme.colors.text }]}>
          {device.value}
          <Text style={[styles.unitText, { color: theme.colors.textSecondary }]}> {device.unit}</Text>
        </Text>
      );
    case 'switch': {
      const color = device.on ? theme.colors.success : theme.colors.disabled;
      const text = device.on ? t('deviceSwitchOn') : t('deviceSwitchOff');
      return (
        <>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>{text}</Text>
        </>
      );
    }
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    aspectRatio: 1,
  },
  surface: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
