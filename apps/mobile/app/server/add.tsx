import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Server } from 'iconoir-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Hero } from '@/components/Hero';
import { pairWithServer } from '@/lib/smartmc/pairingClient';
import { makeServerId, savePairedServer } from '@/lib/smartmc/storage';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

export default function PairScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [serverName, setServerName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('25565');
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState(Constants.deviceName ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        serverName: z.string().trim(),
        host: z.string().trim().min(1, t('pairHostRequired')),
        port: z.coerce.number().int().min(1, t('pairPortInvalid')).max(65535, t('pairPortInvalid')),
        pairingCode: z.string().regex(/^\d{6}$/, t('pairCodeInvalid')),
        deviceName: z.string().trim().min(1, t('pairDeviceNameRequired')),
      }),
    [t],
  );

  async function handleSubmit() {
    const result = schema.safeParse({ serverName, host, port, pairingCode, deviceName });
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? '']),
        ),
      );
      return;
    }
    setErrors({});
    setSubmitting(true);

    const outcome = await pairWithServer(result.data);
    setSubmitting(false);

    if (!outcome.success) {
      showMessage({ message: outcome.error, type: 'danger' });
      return;
    }

    await savePairedServer({
      id: makeServerId(result.data.host, result.data.port),
      host: result.data.host,
      port: result.data.port,
      serverName: result.data.serverName,
      deviceName: result.data.deviceName,
      token: outcome.token ?? '',
      playerUuid: outcome.playerUuid ?? '',
      serverFingerprint: outcome.serverFingerprint,
    });

    showMessage({ message: t('pairSuccess'), type: 'success' });
    router.back();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 96 }]}
        automaticallyAdjustContentInsets={true}
        keyboardShouldPersistTaps="handled"
      >
        <Hero icon={Server} title={t('pairHeroTitle')} subtitle={t('pairHeroSubtitle')} />

        <Field
          label={t('pairServerName')}
          value={serverName}
          onChangeText={setServerName}
          error={errors.serverName}
        />
        <Field
          label={t('pairHost')}
          value={host}
          onChangeText={setHost}
          error={errors.host}
          autoCapitalize="none"
        />
        <Field
          label={t('pairPort')}
          value={port}
          onChangeText={setPort}
          error={errors.port}
          keyboardType="number-pad"
        />
        <Field
          label={t('pairCode')}
          value={pairingCode}
          onChangeText={setPairingCode}
          error={errors.pairingCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Field
          label={t('pairDeviceName')}
          value={deviceName}
          onChangeText={setDeviceName}
          error={errors.deviceName}
        />
      </ScrollView>

      {/* Pinned to the screen bottom with no backdrop of its own -- the
          ScrollView's content is free to scroll beneath it. */}
      <View
        style={[styles.pinnedButtonWrap, { paddingBottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary, opacity: submitting ? 0.6 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>{t('pairSubmit')}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
};

function Field({
  label,
  value,
  onChangeText,
  error,
  autoCapitalize,
  keyboardType,
  maxLength,
}: FieldProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        style={[
          styles.input,
          { color: theme.colors.text, borderColor: error ? '#e5484d' : theme.colors.primary },
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 0,
    gap: 8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#e5484d',
    fontSize: 12,
    marginTop: 4,
  },
  pinnedButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
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
});
