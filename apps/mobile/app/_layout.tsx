import { useFonts } from 'expo-font';
import { NativeStackNavigationOptions, Stack } from 'expo-router';
import { LogBox, Platform } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import 'react-native-reanimated';
import { enableFreeze, enableScreens, FullWindowOverlay } from 'react-native-screens';
import { I18nProvider } from '@/providers/I18nProvider';
import { ExtendedThemeProvider, useTheme } from '@/providers/ExtendedThemeProvider';
import { AppPreferencesProvider } from '@/providers/AppPreferences';
import AppPlatform from '@/components/AppPlatform';
import { StatusBar } from 'expo-status-bar';

LogBox.ignoreAllLogs();
enableScreens(true);
enableFreeze(true);

const ROOT_SCREEN_OPTIONS: NativeStackNavigationOptions = {
	headerShown: false,
	headerBackButtonDisplayMode: "generic",
	headerTransparent: AppPlatform.OS === "iosnew",
	freezeOnBlur: true,
	scrollEdgeEffects: {
		bottom: "soft",
		left: "soft",
		right: "soft",
		top: "soft",
	},
};

const TABS_SCREEN_OPTIONS: NativeStackNavigationOptions = {
	animation: "fade",
  animationDuration: 150,
};

const AppStatusBar = () => {
	const { scheme } = useTheme();
	return <StatusBar style={scheme === "dark" ? "light" : "dark"} animated={true} />;
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
          <Stack screenOptions={ROOT_SCREEN_OPTIONS}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(tabs)" options={TABS_SCREEN_OPTIONS} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <ToastHost />
          <AppStatusBar />
        </ExtendedThemeProvider>
      </I18nProvider>
    </AppPreferencesProvider>
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
