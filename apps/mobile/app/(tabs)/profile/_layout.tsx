import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { SmartMcLogo } from '@/components/SmartMcLogo';
import { useStackScreenOptions } from '@/components/useStackScreenOptions';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

const ProfileStackLayout = () => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const screenOptions = useStackScreenOptions();

  const indexOptions = useMemo(
    () => ({
      title: t('tabProfile'),
      unstable_headerLeftItems: () => [
        {
          type: 'custom',
          element: <SmartMcLogo size={26} color={theme.colors.primary} />,
          hidesSharedBackground: true, // this is the sauce
        },
      ],
    }),
    [t, theme],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
      <Stack.Screen name="app-settings" options={{ title: t('appSettingsTitle') }} />
    </Stack>
  );
};

export default ProfileStackLayout;
