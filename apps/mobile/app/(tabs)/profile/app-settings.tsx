import { ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

// Placeholder -- kept intentionally empty for now, per explicit request.
export default function AppSettingsScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustContentInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        {t('appSettingsEmpty')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
  },
});
