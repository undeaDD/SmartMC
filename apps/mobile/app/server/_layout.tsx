import { router, Stack } from 'expo-router';
import { Plus, Xmark } from 'iconoir-react-native';
import { useMemo } from 'react';
import { Pressable } from 'react-native';

import { DocsButton } from '@/components/DocsButton';
import { useStackScreenOptions } from '@/components/useStackScreenOptions';
import { PLAYERS_DOCS_URL } from '@/lib/smartmc/docsUrl';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

// This whole group is presented as ONE modal sheet from the root layout
// (see app/_layout.tsx's "server" Stack.Screen) -- everything in here is a
// plain push within that single sheet: list -> server detail, list -> add
// a new server. Dismissing the sheet (swipe down, or a future close button)
// exits the whole flow back to wherever it was opened from.
const ServerStackLayout = () => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const screenOptions = useStackScreenOptions();

  const indexOptions = useMemo(
    () => ({
      title: t('settingsServer'),
      headerLeft: () => (
        <Pressable onPress={() => router.dismiss()} hitSlop={8}>
          <Xmark width={22} height={22} color={theme.colors.primary} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => router.push('/server/add')} hitSlop={8}>
          <Plus width={22} height={22} color={theme.colors.primary} />
        </Pressable>
      ),
    }),
    [t, theme],
  );

  const addOptions = useMemo(
    () => ({
      title: t('pairTitle'),
      headerRight: () => <DocsButton url={PLAYERS_DOCS_URL} />,
    }),
    [t],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          title: decodeURIComponent((route.params as { id?: string } | undefined)?.id ?? ''),
        })}
      />
      <Stack.Screen name="add" options={addOptions} />
    </Stack>
  );
};

export default ServerStackLayout;
