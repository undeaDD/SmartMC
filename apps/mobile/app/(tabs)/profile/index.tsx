import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import {
  Book,
  Discord,
  Github,
  Globe,
  InfoCircle,
  Page,
  PrivacyPolicy,
  SendMail,
  Server,
} from 'iconoir-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SettingsRow } from '@/components/SettingsRow';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

const HOMEPAGE_URL = 'https://undeadd.github.io/SmartMC';
const GITHUB_URL = 'https://github.com/undeaDD/SmartMC';
const DOCS_URL = 'https://undeadd.github.io/SmartMC/wiki/players';
const DISCORD_URL = 'https://discord.gg/ugef96S34';
const IMPRINT_URL = 'https://undeadd.github.io/SmartMC/imprint';
const PRIVACY_URL = 'https://undeadd.github.io/SmartMC/privacy';
const LICENSE_URL = 'https://undeadd.github.io/SmartMC/license';
const FEEDBACK_MAIL_URL = 'mailto:undeaD_D@live.de';

export default function ProfileScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <ScrollView
      style={styles.container}
      automaticallyAdjustKeyboardInsets={true}
      keyboardShouldPersistTaps="handled"
    >
      <Section title={t('settingsServerSection')}>
        <Link href="/(tabs)/profile/server" asChild>
          <SettingsRow icon={Server} label={t('settingsServer')} />
        </Link>
      </Section>

      <Section title={t('settingsCommunitySection')}>
        <SettingsRow
          icon={Globe}
          label={t('settingsHomepage')}
          onPress={() => Linking.openURL(HOMEPAGE_URL)}
        />
        <SettingsRow
          icon={Github}
          label={t('settingsGithub')}
          onPress={() => Linking.openURL(GITHUB_URL)}
        />
        <SettingsRow
          icon={Book}
          label={t('settingsDocs')}
          onPress={() => Linking.openURL(DOCS_URL)}
        />
        <SettingsRow
          icon={Discord}
          label={t('settingsDiscord')}
          onPress={() => Linking.openURL(DISCORD_URL)}
        />
      </Section>

      <Section title={t('settingsFeedbackSection')}>
        <SettingsRow
          icon={SendMail}
          label={t('settingsFeedback')}
          onPress={() => Linking.openURL(FEEDBACK_MAIL_URL)}
        />
      </Section>

      <Section title={t('settingsLegalSection')}>
        <SettingsRow
          icon={InfoCircle}
          label={t('settingsImprint')}
          onPress={() => Linking.openURL(IMPRINT_URL)}
        />
        <SettingsRow
          icon={PrivacyPolicy}
          label={t('settingsPrivacy')}
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />
        <SettingsRow
          icon={Page}
          label={t('settingsLicense')}
          onPress={() => Linking.openURL(LICENSE_URL)}
        />
      </Section>

      <Text style={[styles.version, { color: theme.colors.textSecondary }]}>
        {t('profileVersion', {
          version: Application.nativeApplicationVersion ?? '?',
          build: Application.nativeBuildVersion ?? '?',
        })}
      </Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View>
      <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{title}</Text>
      <View style={[styles.section, { backgroundColor: theme.colors.card }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  section: {
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 18,
  },
  version: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 15,
  },
});
