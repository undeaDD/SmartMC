import * as WebBrowser from 'expo-web-browser';
import { HelpCircle } from 'iconoir-react-native';
import { Pressable } from 'react-native';

import { useTheme } from '@/providers/ExtendedThemeProvider';

type DocsButtonProps = {
  url: string;
  size?: number;
};

/**
 * A "?" button opening a doc page in an in-app browser sheet
 * (`expo-web-browser`'s `openBrowserAsync` -- SFSafariViewController on iOS,
 * Custom Tabs on Android, already a dependency, no new native module
 * needed) rather than handing off to the system browser.
 */
export function DocsButton({ url, size = 22 }: DocsButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={() => WebBrowser.openBrowserAsync(url)} hitSlop={8}>
      <HelpCircle width={size} height={size} color={theme.colors.primary} />
    </Pressable>
  );
}
