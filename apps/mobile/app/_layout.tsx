import { useFonts } from 'expo-font';
import { type NativeStackNavigationOptions, Stack } from 'expo-router';
import { LogBox, Platform, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { enableFreeze, enableScreens, FullWindowOverlay } from 'react-native-screens';
import AppPlatform from '@/components/AppPlatform';
import { AppPreferencesProvider } from '@/providers/AppPreferences';
import { ExtendedThemeProvider, useTheme } from '@/providers/ExtendedThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';

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
    // Required by react-native-gesture-handler (and thus
    // react-native-draggable-flatlist's drag gesture) -- without an ancestor
    // GestureHandlerRootView, gesture handlers silently don't respond,
    // especially on Android. Wraps the whole app since it's a one-time root
    // requirement, not something worth scoping per-screen.
    <GestureHandlerRootView style={styles.fill}>
      <AppPreferencesProvider>
        <I18nProvider>
          <ExtendedThemeProvider>
            <RootStack />
            <ToastHost />
            <AppStatusBar />
          </ExtendedThemeProvider>
        </I18nProvider>
      </AppPreferencesProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

function RootStack() {
  return (
    <Stack screenOptions={ROOT_SCREEN_OPTIONS}>
      <Stack.Screen name="(tabs)" options={TABS_SCREEN_OPTIONS} />
      <Stack.Screen name="server" options={{ presentation: 'modal', headerShown: false }} />
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
