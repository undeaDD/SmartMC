import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { z } from 'zod';

import { Text, View, useThemeColor } from '@/components/Themed';
import { pairWithServer } from '@/lib/smartmc/pairingClient';
import { savePairedServer } from '@/lib/smartmc/storage';
import { useI18n } from '@/providers/I18nProvider';

export default function PairScreen() {
  const { t } = useI18n();
  const tint = useThemeColor({}, 'tint');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('25565');
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState(Constants.deviceName ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        host: z.string().trim().min(1, t('pairHostRequired')),
        port: z.coerce.number().int().min(1, t('pairPortInvalid')).max(65535, t('pairPortInvalid')),
        pairingCode: z.string().regex(/^\d{6}$/, t('pairCodeInvalid')),
        deviceName: z.string().trim().min(1, t('pairDeviceNameRequired')),
      }),
    [t],
  );

  async function handleSubmit() {
    const result = schema.safeParse({ host, port, pairingCode, deviceName });
    if (!result.success) {
      setErrors(Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ''])));
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
      host: result.data.host,
      port: result.data.port,
      deviceName: result.data.deviceName,
      token: outcome.token ?? '',
      playerUuid: outcome.playerUuid ?? '',
      serverFingerprint: outcome.serverFingerprint,
    });

    showMessage({ message: t('pairSuccess'), type: 'success' });
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('pairTitle')}</Text>
      <Text style={styles.intro}>{t('pairIntro')}</Text>

      <Field label={t('pairHost')} value={host} onChangeText={setHost} error={errors.host} autoCapitalize="none" />
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
      <Field label={t('pairDeviceName')} value={deviceName} onChangeText={setDeviceName} error={errors.deviceName} />

      <Pressable
        style={[styles.button, { backgroundColor: tint, opacity: submitting ? 0.6 : 1 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('pairSubmit')}</Text>}
      </Pressable>
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

function Field({ label, value, onChangeText, error, autoCapitalize, keyboardType, maxLength }: FieldProps) {
  const text = useThemeColor({}, 'text');
  const tabIconDefault = useThemeColor({}, 'tabIconDefault');

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        style={[styles.input, { color: text, borderColor: error ? '#e5484d' : tabIconDefault }]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  intro: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    opacity: 0.6,
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
  button: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
