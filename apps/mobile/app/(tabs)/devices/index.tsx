import { router } from 'expo-router';
import { AppleShortcuts, Plus, Server } from 'iconoir-react-native';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DeviceCell } from '@/components/DeviceCell';
import { DocsButton } from '@/components/DocsButton';
import { EmptyState } from '@/components/EmptyState';
import type { Device } from '@/lib/devices/types';
import { PLAYERS_DOCS_URL } from '@/lib/smartmc/docsUrl';
import { SERVER_MODAL_HREF } from '@/lib/smartmc/routes';
import { type PairedServer, serverLabel } from '@/lib/smartmc/storage';
import { usePairedServers } from '@/lib/smartmc/usePairedServers';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

type ListItem =
  | { type: 'header'; key: string; server: PairedServer }
  | { type: 'empty'; key: string }
  | { type: 'row'; key: string; devices: Device[] };

export default function DevicesScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const pairedServers = usePairedServers();

  if (pairedServers === undefined) {
    return null;
  }

  if (pairedServers.length === 0) {
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

  // No real device-fetch mechanism exists yet -- querying a paired server's
  // actual devices needs the persistent live connection (M5/later work per
  // CLAUDE.md), not just the one-shot pairing/reconnect connections that
  // exist today. Genuinely empty per server, same honest-empty approach as
  // Home.
  const items = buildListItems(pairedServers);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key}
      contentContainerStyle={styles.scrollContent}
      automaticallyAdjustContentInsets={true}
      keyboardShouldPersistTaps="handled"
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
              <DocsButton url={PLAYERS_DOCS_URL} size={20} />
            </View>
          );
        }
        return (
          <View style={styles.row}>
            {item.devices.map((device) => (
              <DeviceCell key={device.id} device={device} />
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
function buildListItems(servers: PairedServer[]): ListItem[] {
  return servers.flatMap((server) => {
    const devices: Device[] = [];
    return [
      { type: 'header', key: `header-${server.id}`, server } as ListItem,
      ...(devices.length === 0
        ? [{ type: 'empty', key: `empty-${server.id}` } as ListItem]
        : chunkPairs(devices).map(
            (row, index): ListItem => ({
              type: 'row',
              key: `row-${server.id}-${index}`,
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
