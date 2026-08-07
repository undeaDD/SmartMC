import type { BlurTint } from 'expo-blur';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import AppPlatform from '@/components/AppPlatform';
import { type SystemStyle, usePreferences } from './AppPreferences';

export type CustomTheme = typeof DefaultTheme & {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    textSecondary: string;
    danger: string;
    success: string;
    inputBackground: string;
    surface: string;
    disabled: string;
    // Web BB_Button neutral style (bg-background-50 / dark:bg-dark-background-400,
    // hover -100 / dark -350, text background-900 / dark white).
    buttonNeutral: string;
    buttonNeutralPressed: string;
    buttonNeutralText: string;
  };
  blur: {
    intensity: number;
    tint: BlurTint | undefined;
    background: string;
  };
  radius: {
    small: number;
    medium: number;
    large: number;
  };
};

const LightCustomTheme: CustomTheme = {
  ...DefaultTheme,

  // Brand palette per apps/landing/src/styles/theme.css -- white / green / gray / teal / two dark bg tones.
  colors: {
    primary: '#39bf45', // brand-green / green-500
    background: '#f3f4f6', // brand-white
    card: '#ffffff',
    text: '#181818', // brand-ink
    border: '#e2e2e2',
    notification: '#39bf45',
    textSecondary: '#8c8c8c', // brand-gray
    danger: '#dc2626',
    success: '#39bf45', // brand-green doubles as the semantic "on"/"armed" success color
    inputBackground: '#ffffff',
    surface: '#f3f4f6',
    disabled: '#8c8c8c', // brand-gray
    buttonNeutral: '#f3f4f6',
    buttonNeutralPressed: '#e9eaec',
    buttonNeutralText: '#181818', // brand-ink
  },
  blur: {
    intensity: AppPlatform.OS === 'iosnew' ? 0 : 90,
    tint: AppPlatform.OS === 'iosnew' ? undefined : 'systemMaterialLight',
    background: AppPlatform.OS === 'iosnew' ? 'transparent' : '#FFFFFF99',
  },
  radius: {
    small: AppPlatform.OS === 'iosnew' ? 14 : 8,
    medium: AppPlatform.OS === 'iosnew' ? 22 : 12,
    large: AppPlatform.OS === 'iosnew' ? 28 : 16,
  },
};

const DarkCustomTheme: CustomTheme = {
  ...DarkTheme,

  // Brand palette per apps/landing/src/styles/theme.css. green-400 (not the
  // base brand-green) for primary/notification/success -- same reasoning as
  // constants/Colors.ts's tintColorDark: better contrast on a near-black background.
  colors: {
    primary: '#5ccf68', // green-400
    background: '#121212', // brand-ink-deep / ink-950
    card: '#1f1f1f', // ink-800
    text: '#ffffff',
    border: '#2b2b2b', // ink-700
    notification: '#5ccf68', // green-400
    textSecondary: '#8c8c8c', // brand-gray
    danger: '#ef4444',
    success: '#5ccf68', // green-400
    inputBackground: '#1f1f1f', // ink-800
    surface: '#1f1f1f', // ink-800
    disabled: '#8c8c8c', // brand-gray
    buttonNeutral: '#1f1f1f', // ink-800
    buttonNeutralPressed: '#2b2b2b', // ink-700
    buttonNeutralText: '#ffffff',
  },
  blur: {
    intensity: AppPlatform.OS === 'iosnew' ? 0 : 50,
    tint: AppPlatform.OS === 'iosnew' ? undefined : 'systemMaterialDark',
    background: AppPlatform.OS === 'iosnew' ? 'transparent' : '#12121299', // ink-950 tint, not generic black
  },
  radius: {
    small: AppPlatform.OS === 'iosnew' ? 14 : 8,
    medium: AppPlatform.OS === 'iosnew' ? 22 : 12,
    large: AppPlatform.OS === 'iosnew' ? 28 : 16,
  },
};

export const ExtendedThemeContext = createContext<{ scheme: 'light' | 'dark'; theme: CustomTheme }>(
  {
    scheme: 'light',
    theme: LightCustomTheme,
  },
);

export const ExtendedThemeProvider = ({ children }: { children: ReactNode }) => {
  const deviceScheme = useColorScheme();
  const { systemStyle } = usePreferences();

  const selected: SystemStyle = systemStyle[0];
  const effectiveScheme: 'light' | 'dark' =
    selected === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : selected;
  const theme = effectiveScheme === 'light' ? LightCustomTheme : DarkCustomTheme;

  const contextValue = useMemo(
    () => ({ scheme: effectiveScheme, theme }),
    [effectiveScheme, theme],
  );

  return (
    <ExtendedThemeContext.Provider value={contextValue}>
      <ThemeProvider value={theme}>{children}</ThemeProvider>
    </ExtendedThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ExtendedThemeContext);
