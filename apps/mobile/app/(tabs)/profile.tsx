import { Link } from 'expo-router';
import * as Application from 'expo-application';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useI18n } from '@/providers/I18nProvider';

// Placeholder shell only beyond pairing -- no real settings logic yet.
// Sections per CLAUDE.md's "App navigation & UX states": paired-server
// management, notification preferences, and links out to the landing
// page/docs/GitHub.
export default function ProfileScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Link href="/modal" asChild>
        <Pressable>
          <Text style={styles.section}>{t('profilePairedServers')}</Text>
        </Pressable>
      </Link>
      <Text style={styles.section}>{t('profileNotificationPreferences')}</Text>
      <Text style={styles.section}>{t('profileAboutLinks')}</Text>
      <Text style={styles.version}>
        {t('profileVersion', {
          version: Application.nativeApplicationVersion ?? '?',
          build: Application.nativeBuildVersion ?? '?',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  section: {
    fontSize: 17,
    opacity: 0.6,
  },
  version: {
    fontSize: 13,
    opacity: 0.4,
    marginTop: 8,
  },
});
