import { useFonts } from 'expo-font';
import { type NativeStackNavigationOptions, Stack } from 'expo-router';
import { LogBox, Platform } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { enableFreeze, enableScreens, FullWindowOverlay } from 'react-native-screens';
import AppPlatform from '@/components/AppPlatform';
import { AppPreferencesProvider } from '@/providers/AppPreferences';
import { ExtendedThemeProvider, useTheme } from '@/providers/ExtendedThemeProvider';
import { I18nProvider, useI18n } from '@/providers/I18nProvider';

LogBox.ignoreAllLogs();
enableScreens(true);
enableFreeze(true);

const ROOT_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerShown: false,
  headerBackButtonDisplayMode: 'generic',
  headerTransparent: AppPlatform.OS === 'iosnew',
  freezeOnBlur: true,
  scrollEdgeEffects: {
    bottom: 'soft',
    left: 'soft',
    right: 'soft',
    top: 'soft',
  },
};

const TABS_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  animation: 'fade',
  animationDuration: 150,
};

const AppStatusBar = () => {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} animated={true} />;
};

export default function RootLayout() {
  useFonts({
    TabIcons: require('../assets/fonts/TabIcons.ttf'),
  });

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AppPreferencesProvider>
      <I18nProvider>
        <ExtendedThemeProvider>
          <RootStack />
          <ToastHost />
          <AppStatusBar />
        </ExtendedThemeProvider>
      </I18nProvider>
    </AppPreferencesProvider>
  );
}

function RootStack() {
  const { t } = useI18n();

  return (
    <Stack screenOptions={ROOT_SCREEN_OPTIONS}>
      <Stack.Screen name="(tabs)" options={TABS_SCREEN_OPTIONS} />
      <Stack.Screen name="server" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen
        name="app-settings"
        options={{ presentation: 'modal', headerShown: true, title: t('appSettingsTitle') }}
      />
    </Stack>
  );
}

// Modal screens present as separate native view controllers on iOS, stacked
// above the React root view -- a toast rendered normally would be invisible
// while one is open, hence FullWindowOverlay putting it in its own UIWindow.
// Android's modal presentation shares the same window, so no wrapper needed.
function ToastHost() {
  const toast = <FlashMessage position="top" floating animated duration={3000} />;
  return Platform.OS === 'ios' ? <FullWindowOverlay>{toast}</FullWindowOverlay> : toast;
}
