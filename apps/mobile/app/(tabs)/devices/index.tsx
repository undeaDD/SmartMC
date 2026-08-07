import { router } from 'expo-router';
import { AppleShortcuts, Plus, Server } from 'iconoir-react-native';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DeviceCell } from '@/components/DeviceCell';
import { EmptyState } from '@/components/EmptyState';
import { mapDeviceSummary } from '@/lib/devices/mapDeviceSummary';
import type { Device } from '@/lib/devices/types';
import { SERVER_MODAL_HREF } from '@/lib/smartmc/routes';
import { type PairedServer, serverLabel } from '@/lib/smartmc/storage';
import { type ServerDeviceState, useDeviceLists } from '@/lib/smartmc/useDeviceLists';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

type ListItem =
  | { type: 'header'; key: string; server: PairedServer }
  | { type: 'empty'; key: string }
  | { type: 'row'; key: string; server: PairedServer; devices: Device[] };

export default function DevicesScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { serverDevices, refreshing, refresh } = useDeviceLists();

  if (serverDevices === undefined) {
    return null;
  }

  if (serverDevices.length === 0) {
    return (
      <EmptyState
        icon={Server}
        title={t('noServerTitle')}
        subtitle={t('noServerSubtitle')}
        actionLabel={t('noServerConnect')}
        actionIcon={Plus}
        onAction={() => router.push(SERVER_MODAL_HREF)}
      />
    );
  }

  const items = buildListItems(serverDevices);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key}
      contentContainerStyle={styles.scrollContent}
      automaticallyAdjustContentInsets={true}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      renderItem={({ item }) => {
        if (item.type === 'header') {
          return (
            <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>
              {serverLabel(item.server)}
            </Text>
          );
        }
        if (item.type === 'empty') {
          return (
            <View style={[styles.hintCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.hintIconWrap, { backgroundColor: theme.colors.primary }]}>
                <AppleShortcuts width={18} height={18} color={'black'} />
              </View>
              <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                {t('devicesEmpty')}
              </Text>
            </View>
          );
        }
        return (
          <View style={styles.row}>
            {item.devices.map((device) => (
              <DeviceCell key={device.id} device={device} server={item.server} />
            ))}
            {item.devices.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        );
      }}
    />
  );
}

// A single virtualized FlatList, not one FlatList per section -- each
// server contributes a full-width header item followed by either an
// "empty" notice item or 2-device row items. FlatList's own `numColumns`
// forces every item into a uniform N-column grid, which can't represent a
// full-width header interleaved with 2-wide device rows without hacky
// padding tricks; pre-chunking devices into row items (each rendering its
// own 1-2 cells) gets the same 2-column visual result without fighting that.
function buildListItems(serverDevices: ServerDeviceState[]): ListItem[] {
  return serverDevices.flatMap(({ server, devices: summaries }) => {
    const devices: Device[] = (summaries ?? []).map(mapDeviceSummary);
    return [
      { type: 'header', key: `header-${server.id}`, server } as ListItem,
      ...(devices.length === 0
        ? [{ type: 'empty', key: `empty-${server.id}` } as ListItem]
        : chunkPairs(devices).map(
            (row, index): ListItem => ({
              type: 'row',
              key: `row-${server.id}-${index}`,
              server,
              devices: row,
            }),
          )),
    ];
  });
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginTop: 12,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 26,
    paddingLeft: 20,
    paddingRight: 25,
    paddingVertical: 13,
    marginBottom: 30,
  },
  hintIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
});
