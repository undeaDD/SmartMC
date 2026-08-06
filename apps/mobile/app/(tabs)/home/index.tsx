import { router } from 'expo-router';
import { Plus } from 'iconoir-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { DeviceCell } from '@/components/DeviceCell';
import { EmptyState } from '@/components/EmptyState';
import { View } from '@/components/Themed';
import type { Device } from '@/lib/devices/types';
import { useI18n } from '@/providers/I18nProvider';

export default function HomeScreen() {
  const { t } = useI18n();
  // No persistence/backend for pinned devices yet (M5's real device model
  // hasn't landed server-side) -- starts genuinely empty rather than seeded
  // with fake data, so the empty state you see here is accurate, not staged.
  const [pinnedDevices] = useState<Device[]>([]);

  if (pinnedDevices.length === 0) {
    return (
      <EmptyState
        icon="home"
        title={t('homeEmptyTitle')}
        subtitle={t('homeEmptySubtitle')}
        actionLabel={t('homePinDevice')}
        actionIcon={Plus}
        onAction={() => router.push('/(tabs)/devices')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pinnedDevices}
        keyExtractor={(device) => device.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => <DeviceCell device={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    padding: 12,
    gap: 12,
  },
  row: {
    gap: 12,
  },
});
