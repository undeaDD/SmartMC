import type { NativeStackNavigationOptions } from 'expo-router';
import { useMemo } from 'react';
import AppPlatform from '@/components/AppPlatform';
import { useTheme } from '@/providers/ExtendedThemeProvider';

export function useStackScreenOptions(): NativeStackNavigationOptions {
  const { theme } = useTheme();

  return useMemo(
    () =>
      AppPlatform.OS === 'iosnew'
        ? {
            headerShown: true,
            headerLargeTitle: false,
            headerTransparent: true,
            headerBackButtonDisplayMode: 'generic',
            headerTintColor: theme.colors.text,
            headerBlurEffect: 'none',
            headerBackgroundColor: 'transparent',
            freezeOnBlur: true,
            scrollEdgeEffects: {
              bottom: 'soft',
              left: 'soft',
              right: 'soft',
              top: 'soft',
            },
          }
        : {
            headerShown: true,
            headerLargeTitle: false,
            headerTransparent: false,
            headerBackButtonDisplayMode: 'generic',
            headerTintColor: theme.colors.text,
            headerStyle: {
              backgroundColor: theme.colors.card,
            },
            freezeOnBlur: true,
          },
    [theme],
  );
}
