import { router, useFocusEffect } from 'expo-router';
import { Settings } from 'iconoir-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeviceCell } from '@/components/DeviceCell';
import { EmptyState } from '@/components/EmptyState';
import type { Device } from '@/lib/devices/types';
import { getPairedServer, type PairedServer } from '@/lib/smartmc/storage';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

export default function DevicesScreen() {
  const { t } = useI18n();
  const [pairedServer, setPairedServer] = useState<PairedServer | null | undefined>(undefined);

  // Re-read on focus, not just mount -- matches profile.tsx's pattern, so
  // pairing (or unpairing, once that exists) from another tab is reflected
  // here without needing a shared store.
  useFocusEffect(
    useCallback(() => {
      getPairedServer().then(setPairedServer);
    }, []),
  );

  if (pairedServer === undefined) {
    return null;
  }

  if (pairedServer === null) {
    return (
      <EmptyState
        icon="profile"
        title={t('devicesNoServerTitle')}
        subtitle={t('devicesNoServerSubtitle')}
        actionLabel={t('devicesGoToProfile')}
        actionIcon={Settings}
        onAction={() => router.push('/(tabs)/profile')}
      />
    );
  }

  // No real device-fetch mechanism exists yet -- querying a paired server's
  // actual devices needs the persistent live connection (M5/later work per
  // CLAUDE.md), not just the one-shot pairing/reconnect connections that
  // exist today. Genuinely empty per server, same honest-empty approach as
  // Home. Only ever one section in practice right now (storage.ts's
  // v1-scoped single-paired-server limit), but built to section by server
  // since that's the real, already-planned shape once multi-server pairing
  // lands.
  const sections: { server: PairedServer; devices: Device[] }[] = [{ server: pairedServer, devices: [] }];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {sections.map((section) => (
        <DeviceSection key={`${section.server.host}:${section.server.port}`} server={section.server} devices={section.devices} />
      ))}
    </ScrollView>
  );
}

function DeviceSection({ server, devices }: { server: PairedServer; devices: Device[] }) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const rows = chunkPairs(devices);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>
        {t('profilePairedServerAddress', { host: server.host, port: server.port })}
      </Text>
      {devices.length === 0 ? (
        <Text style={[styles.sectionEmptyText, { color: theme.colors.textSecondary }]}>{t('devicesEmpty')}</Text>
      ) : (
        rows.map((row, index) => (
          <View key={index} style={styles.row}>
            {row.map((device) => (
              <DeviceCell key={device.id} device={device} />
            ))}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))
      )}
    </View>
  );
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
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  sectionEmptyText: {
    fontSize: 14,
    paddingHorizontal: 4,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
});
