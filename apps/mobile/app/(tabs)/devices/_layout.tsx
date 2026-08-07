import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { DocsButton } from '@/components/DocsButton';
import { SmartMcLogo } from '@/components/SmartMcLogo';
import { useStackScreenOptions } from '@/components/useStackScreenOptions';
import { PLAYERS_DOCS_URL } from '@/lib/smartmc/docsUrl';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

const DevicesStackLayout = () => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const screenOptions = useStackScreenOptions();
  const indexOptions = useMemo(
    () => ({
      title: t('tabDevices'),
      unstable_headerLeftItems: () => [
        {
          type: 'custom',
          element: <SmartMcLogo size={26} color={theme.colors.primary} />,
          hidesSharedBackground: true, // this is the sauce
        },
      ],
      headerRight: () => <DocsButton url={PLAYERS_DOCS_URL} />,
    }),
    [t, theme],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
};

export default DevicesStackLayout;
