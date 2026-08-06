import * as Application from 'expo-application';
import { Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { Bell, Discord, Github, Globe, InfoCircle, Page, PrivacyPolicy, SendMail, Server, Book } from 'iconoir-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { SettingsRow } from '@/components/SettingsRow';
import { View } from '@/components/Themed';
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
    <View style={styles.container}>
      <Section>
        <Link href="/(tabs)/profile/server" asChild>
          <SettingsRow icon={Server} label={t('settingsServer')} />
        </Link>
        <SettingsRow icon={Bell} label={t('settingsNotifications')} disabled />
      </Section>

      <Section>
        <SettingsRow icon={InfoCircle} label={t('settingsImprint')} onPress={() => Linking.openURL(IMPRINT_URL)} />
        <SettingsRow icon={PrivacyPolicy} label={t('settingsPrivacy')} onPress={() => Linking.openURL(PRIVACY_URL)} />
        <SettingsRow icon={Page} label={t('settingsLicense')} onPress={() => Linking.openURL(LICENSE_URL)} />
      </Section>

      <Section>
        <SettingsRow icon={Globe} label={t('settingsHomepage')} onPress={() => Linking.openURL(HOMEPAGE_URL)} />
        <SettingsRow icon={Github} label={t('settingsGithub')} onPress={() => Linking.openURL(GITHUB_URL)} />
        <SettingsRow icon={Book} label={t('settingsDocs')} onPress={() => Linking.openURL(DOCS_URL)} />
        <SettingsRow icon={Discord} label={t('settingsDiscord')} onPress={() => Linking.openURL(DISCORD_URL)} />
      </Section>

      <Section>
        <SettingsRow icon={SendMail} label={t('settingsFeedback')} onPress={() => Linking.openURL(FEEDBACK_MAIL_URL)} />
      </Section>

      <Text style={[styles.version, { color: theme.colors.textSecondary }]}>
        {t('profileVersion', {
          version: Application.nativeApplicationVersion ?? '?',
          build: Application.nativeBuildVersion ?? '?',
        })}
      </Text>
    </View>
  );
}

function Section({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return <View style={[styles.section, { backgroundColor: theme.colors.card }]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 20,
  },
  section: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  version: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.6,
  },
});
