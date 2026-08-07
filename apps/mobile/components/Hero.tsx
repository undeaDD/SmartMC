import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { useTheme } from '@/providers/ExtendedThemeProvider';

type HeroProps = {
  icon: ComponentType<SvgProps>;
  title: string;
  subtitle: string;
};

/**
 * A centered icon/title/subtitle block used as the first row above a
 * screen's real content (unlike EmptyState, which fills the whole screen
 * for a "there's nothing here" state -- Hero introduces a screen that *does*
 * have content below it).
 */
export function Hero({ icon: Icon, title, subtitle }: HeroProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Icon width={40} height={40} color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});
