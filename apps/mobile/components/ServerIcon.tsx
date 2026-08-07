import { Server } from 'iconoir-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ExtendedThemeProvider';

type ServerIconProps = {
  /** Base64 PNG (no data-URI prefix), as returned by `fetchServerIcon`. Falls back to a generic icon-in-rounded-square (matching SettingsRow/Hero's convention) when absent. */
  imageBase64?: string;
  size?: number;
};

/** The real server-icon.png when available, otherwise the same generic icon-in-rounded-square look used by SettingsRow/Hero -- shared so both fall back identically. */
export function ServerIcon({ imageBase64, size = 30 }: ServerIconProps) {
  const { theme } = useTheme();
  const borderRadius = Math.round(size * 0.28);

  if (imageBase64) {
    return (
      <Image
        source={{ uri: `data:image/png;base64,${imageBase64}` }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius, backgroundColor: `${theme.colors.primary}ee` },
      ]}
    >
      <Server width={size * 0.6} height={size * 0.6} color={'black'} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
