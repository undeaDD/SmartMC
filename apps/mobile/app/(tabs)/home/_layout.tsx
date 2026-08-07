import { router, Stack } from 'expo-router';
import { Plus } from 'iconoir-react-native';
import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { SmartMcLogo } from '@/components/SmartMcLogo';
import { useStackScreenOptions } from '@/components/useStackScreenOptions';
import { usePairedServers } from '@/lib/smartmc/usePairedServers';
import { useTheme } from '@/providers/ExtendedThemeProvider';

const HomeStackLayout = () => {
  const screenOptions = useStackScreenOptions();
  const { theme } = useTheme();
  // Same "+ pin a device" shortcut as the server list's header, but only
  // makes sense to show once there's actually a server to pull devices
  // from.
  const pairedServers = usePairedServers();
  const hasServer = (pairedServers?.length ?? 0) > 0;

  const indexOptions = useMemo(
    () => ({
      title: 'SmartMC',
      unstable_headerLeftItems: () => [
        {
          type: 'custom',
          element: <SmartMcLogo size={26} color={theme.colors.primary} />,
          hidesSharedBackground: true, // this is the sauce
        },
      ],
      headerRight: hasServer
        ? () => (
            <Pressable onPress={() => router.push('/(tabs)/devices')} hitSlop={8}>
              <Plus width={22} height={22} color={theme.colors.primary} />
            </Pressable>
          )
        : undefined,
    }),
    [theme, hasServer],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
};

export default HomeStackLayout;
