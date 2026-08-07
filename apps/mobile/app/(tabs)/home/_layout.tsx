import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { SmartMcLogo } from '@/components/SmartMcLogo';
import { useStackScreenOptions } from '@/components/useStackScreenOptions';
import { useTheme } from '@/providers/ExtendedThemeProvider';

const HomeStackLayout = () => {
  const screenOptions = useStackScreenOptions();
  const { theme } = useTheme();

  // `headerRight` isn't set here -- the index screen owns it dynamically via
  // `navigation.setOptions()` (it's the reorder-mode pencil/checkmark
  // toggle, which depends on screen-local state this layout doesn't have).
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
    }),
    [theme],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
};

export default HomeStackLayout;
