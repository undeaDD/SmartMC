import { router } from 'expo-router';
import { AppleShortcuts, Plus, Server } from 'iconoir-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { DeviceCell } from '@/components/DeviceCell';
import { EmptyState } from '@/components/EmptyState';
import type { Device } from '@/lib/devices/types';
import { SERVER_MODAL_HREF } from '@/lib/smartmc/routes';
import { usePairedServers } from '@/lib/smartmc/usePairedServers';
import { useI18n } from '@/providers/I18nProvider';

export default function HomeScreen() {
  const { t } = useI18n();
  const pairedServers = usePairedServers();
  // No persistence/backend for pinned devices yet (M5's real device model
  // hasn't landed server-side) -- starts genuinely empty rather than seeded
  // with fake data, so the empty state you see here is accurate, not staged.
  const [pinnedDevices] = useState<Device[]>([]);

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

  if (pinnedDevices.length === 0) {
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
      data={pinnedDevices}
      keyExtractor={(device) => device.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => <DeviceCell device={item} />}
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
