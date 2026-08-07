import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { reconnectToServer } from '@/lib/smartmc/reconnectClient';
import {
  clearPairedServer,
  getPairedServer,
  type PairedServer,
  savePairedServer,
} from '@/lib/smartmc/storage';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

// The paired-server status/actions used to live inline on the main Settings
// screen -- pulled out into its own modal (opened via the "Server" row) so
// the Settings list itself stays a plain list of short rows, matching an
// iOS-Settings look, rather than mixing in a stateful sub-view.
export default function ServerModal() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [pairedServer, setPairedServer] = useState<PairedServer | null | undefined>(undefined);
  const [reconnecting, setReconnecting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getPairedServer().then(setPairedServer);
    }, []),
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
    await clearPairedServer();
    setPairedServer(null);
    showMessage({ message: t('serverForgotten'), type: 'info' });
  }

  if (pairedServer === undefined) {
    return null;
  }

  if (pairedServer === null) {
    const emptyStateButtonStyle = StyleSheet.flatten([
      styles.button,
      { backgroundColor: theme.colors.primary },
    ]);

    return (
      <ScrollView
        contentContainerStyle={styles.container}
        automaticallyAdjustKeyboardInsets={true}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.intro, { color: theme.colors.textSecondary }]}>
          {t('serverNotPairedIntro')}
        </Text>
        <Link href="/modal" asChild>
          <Pressable style={emptyStateButtonStyle}>
            <Text style={styles.buttonText}>{t('pairSubmit')}</Text>
          </Pressable>
        </Link>
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
        {t('profilePairedServerAddress', { host: pairedServer.host, port: pairedServer.port })}
      </Text>
      <Text style={[styles.deviceNameLabel, { color: theme.colors.textSecondary }]}>
        {pairedServer.deviceName}
      </Text>

      <Pressable style={primaryButtonStyle} onPress={handleReconnect} disabled={reconnecting}>
        {reconnecting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{t('profileReconnect')}</Text>
        )}
      </Pressable>

      <Link href="/modal" asChild>
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
