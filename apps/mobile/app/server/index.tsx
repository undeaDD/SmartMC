import { router } from 'expo-router';
import { Plus, Server } from 'iconoir-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Hero } from '@/components/Hero';
import { ServerIcon } from '@/components/ServerIcon';
import { SettingsRow } from '@/components/SettingsRow';
import { serverLabel } from '@/lib/smartmc/storage';
import { usePairedServers } from '@/lib/smartmc/usePairedServers';
import { useServerIcons } from '@/lib/smartmc/useServerIcons';
import { type Reachability, useServerReachability } from '@/lib/smartmc/useServerReachability';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

function reachabilityLabel(state: Reachability | undefined, t: (key: string) => string): string {
  switch (state) {
    case 'online':
      return t('serverStatusOnline');
    case 'offline':
      return t('serverStatusOffline');
    default:
      return t('serverStatusChecking');
  }
}

function reachabilityColor(
  state: Reachability | undefined,
  theme: ReturnType<typeof useTheme>['theme'],
): string {
  switch (state) {
    case 'online':
      return theme.colors.success;
    case 'offline':
      return theme.colors.danger;
    default:
      return theme.colors.textSecondary;
  }
}

export default function ServerListScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const pairedServers = usePairedServers();
  const reachability = useServerReachability(pairedServers);
  const icons = useServerIcons(pairedServers);

  if (pairedServers === undefined) {
    return null;
  }

  if (pairedServers.length === 0) {
    return (
      <EmptyState
        icon={Server}
        title={t('noServerTitle')}
        subtitle={t('noServerSubtitle')}
        actionLabel={t('settingsAddServer')}
        actionIcon={Plus}
        onAction={() => router.push('/server/add')}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustContentInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      <Hero icon={Server} title={t('serverListHeroTitle')} subtitle={t('serverListHeroSubtitle')} />
      <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
        {pairedServers.map((server) => (
          <SettingsRow
            key={server.id}
            leading={<ServerIcon imageBase64={icons[server.id]} size={30} />}
            label={serverLabel(server)}
            subtitle={reachabilityLabel(reachability[server.id], t)}
            subtitleColor={reachabilityColor(reachability[server.id], theme)}
            detail={server.serverName ? `${server.host}:${server.port}` : undefined}
            onPress={() => router.push({ pathname: '/server/[id]', params: { id: server.id } })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
