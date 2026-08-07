import { router } from 'expo-router';
import { AppleShortcuts, Plus, Server } from 'iconoir-react-native';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { DeviceCell } from '@/components/DeviceCell';
import { EmptyState } from '@/components/EmptyState';
import { mapDeviceSummary } from '@/lib/devices/mapDeviceSummary';
import type { Device } from '@/lib/devices/types';
import { toggleDevice } from '@/lib/smartmc/deviceToggleClient';
import { SERVER_MODAL_HREF } from '@/lib/smartmc/routes';
import type { PairedServer } from '@/lib/smartmc/storage';
import { useDeviceLists } from '@/lib/smartmc/useDeviceLists';
import { useI18n } from '@/providers/I18nProvider';

type HomeItem = { device: Device; server: PairedServer };

export default function HomeScreen() {
  const { t } = useI18n();
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

  // No real pinning UI/persistence exists yet -- shows every fetched device
  // across every paired server, flattened, as an honest interim stand-in
  // for "pinned" until that feature lands, rather than staying empty.
  const items: HomeItem[] = serverDevices.flatMap(({ server, devices }) =>
    (devices ?? []).map((summary) => ({ device: mapDeviceSummary(summary), server })),
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={AppleShortcuts}
        title={t('homeEmptyTitle')}
        subtitle={t('homeEmptySubtitle')}
        actionLabel={t('homePinDevice')}
        actionIcon={Plus}
        onAction={() => router.push('/(tabs)/devices')}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.device.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      renderItem={({ item }) => (
        <DeviceCell
          device={item.device}
          onPress={
            item.device.deviceType === 'switch'
              ? () => {
                  toggleDevice({
                    host: item.server.host,
                    port: item.server.port,
                    token: item.server.token,
                    expectedServerFingerprint: item.server.serverFingerprint,
                    deviceId: item.device.id,
                  });
                }
              : undefined
          }
        />
      )}
      automaticallyAdjustContentInsets={true}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 12,
    gap: 12,
  },
  row: {
    gap: 12,
  },
});
