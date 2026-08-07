import { router } from 'expo-router';
import { Plus, Server } from 'iconoir-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Hero } from '@/components/Hero';
import { SettingsRow } from '@/components/SettingsRow';
import { serverLabel } from '@/lib/smartmc/storage';
import { usePairedServers } from '@/lib/smartmc/usePairedServers';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

export default function ServerListScreen() {
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
        actionLabel={t('settingsAddServer')}
        actionIcon={Plus}
        onAction={() => router.push('/server/add')}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      automaticallyAdjustContentInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      <Hero icon={Server} title={t('serverListHeroTitle')} subtitle={t('serverListHeroSubtitle')} />
      <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
        {pairedServers.map((server) => (
          <SettingsRow
            key={server.id}
            icon={Server}
            label={serverLabel(server)}
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
