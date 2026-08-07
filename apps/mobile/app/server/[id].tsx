import { Link, router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { reconnectToServer } from '@/lib/smartmc/reconnectClient';
import {
  getPairedServer,
  type PairedServer,
  removePairedServer,
  savePairedServer,
  serverLabel,
} from '@/lib/smartmc/storage';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

// Root-level (not nested under (tabs)/profile) so it's reachable via
// router.push from anywhere in the app, not just the Settings tab's own
// stack -- per explicit request, now that multiple servers can be paired
// and each gets its own row -> pushed detail screen, matching an iOS
// Settings list/detail pattern (e.g. Wi-Fi's network list).
export default function ServerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [pairedServer, setPairedServer] = useState<PairedServer | null | undefined>(undefined);
  const [reconnecting, setReconnecting] = useState(false);

  // The layout's static Stack.Screen options can only see the route param
  // (the raw "host:port" id) -- once the real record loads, prefer its
  // user-given name for the header title.
  useEffect(() => {
    if (pairedServer) {
      navigation.setOptions({ title: serverLabel(pairedServer) });
    }
  }, [pairedServer, navigation]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getPairedServer(id).then((server) => {
        if (!cancelled) setPairedServer(server);
      });
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  async function handleReconnect() {
    if (!pairedServer) return;
    setReconnecting(true);
    const outcome = await reconnectToServer({
      host: pairedServer.host,
      port: pairedServer.port,
      token: pairedServer.token,
      expectedServerFingerprint: pairedServer.serverFingerprint,
    });
    setReconnecting(false);

    if (!outcome.success) {
      showMessage({ message: outcome.error, type: 'danger' });
      return;
    }

    const updated: PairedServer = { ...pairedServer, token: outcome.token ?? pairedServer.token };
    await savePairedServer(updated);
    setPairedServer(updated);
    showMessage({ message: t('reconnectSuccess'), type: 'success' });
  }

  async function handleForget() {
    await removePairedServer(id);
    showMessage({ message: t('serverForgotten'), type: 'info' });
    router.back();
  }

  if (pairedServer === undefined) {
    return null;
  }

  if (pairedServer === null) {
    // The server this screen was opened for was removed elsewhere (e.g.
    // forgotten from another instance of this same screen) while this one
    // was still mounted -- not the "never paired" case, which the Settings
    // list itself handles by simply not showing a row at all.
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        automaticallyAdjustContentInsets={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.intro, { color: theme.colors.textSecondary }]}>
          {t('serverNotFound')}
        </Text>
      </ScrollView>
    );
  }

  const primaryButtonStyle = StyleSheet.flatten([
    styles.button,
    { backgroundColor: theme.colors.primary, opacity: reconnecting ? 0.6 : 1 },
  ]);
  const secondaryButtonStyle = StyleSheet.flatten([
    styles.secondaryButton,
    { borderColor: theme.colors.border },
  ]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      automaticallyAdjustKeyboardInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.pairedServerLabel, { color: theme.colors.text }]}>
        {serverLabel(pairedServer)}
      </Text>
      <Text style={[styles.deviceNameLabel, { color: theme.colors.textSecondary }]}>
        {t('profilePairedServerAddress', { host: pairedServer.host, port: pairedServer.port })} ·{' '}
        {pairedServer.deviceName}
      </Text>

      <Pressable style={primaryButtonStyle} onPress={handleReconnect} disabled={reconnecting}>
        {reconnecting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{t('profileReconnect')}</Text>
        )}
      </Pressable>

      <Link href="/server/add" asChild>
        <Pressable style={secondaryButtonStyle}>
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
            {t('serverPairDifferent')}
          </Text>
        </Pressable>
      </Link>

      <Pressable style={styles.forgetButton} onPress={handleForget}>
        <Text style={[styles.forgetButtonText, { color: theme.colors.danger }]}>
          {t('serverForget')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  intro: {
    fontSize: 15,
    marginBottom: 8,
  },
  pairedServerLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  deviceNameLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  forgetButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  forgetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
