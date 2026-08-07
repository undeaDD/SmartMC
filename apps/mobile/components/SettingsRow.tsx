import { NavArrowRight } from 'iconoir-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { useTheme } from '@/providers/ExtendedThemeProvider';

type SettingsRowProps = {
  /** Ignored when `leading` is provided. */
  icon?: ComponentType<SvgProps>;
  /** Replaces the default icon-in-rounded-square entirely, e.g. a `ServerIcon` showing a real fetched image instead of a plain SVG glyph. */
  leading?: ReactNode;
  label: string;
  /** A second line under the label, e.g. a live status ("Online"/"Offline") -- distinct from `detail`, which stays a trailing side value like an address. */
  subtitle?: string;
  /** Overrides `subtitle`'s color (e.g. green/red for a status word). Defaults to the theme's secondary text color. */
  subtitleColor?: string;
  detail?: string;
  onPress?: () => void;
  disabled?: boolean;
};

/**
 * A single iOS-Settings-style row: icon in a rounded square, label (+
 * optional subtitle line), optional trailing detail text, chevron. Shared by
 * every row in the Settings screen (both the plain link rows and the
 * "Server" row that opens a modal) and the paired-server list.
 */
export function SettingsRow({
  icon: Icon,
  leading,
  label,
  subtitle,
  subtitleColor,
  detail,
  onPress,
  disabled,
}: SettingsRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      {leading ??
        (Icon ? (
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}ee` }]}>
            <Icon width={18} height={18} color={'black'} />
          </View>
        ) : null)}
      <View style={styles.textColumn}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor ?? theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {detail ? (
        <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>{detail}</Text>
      ) : null}
      {onPress && !disabled ? (
        <NavArrowRight width={16} height={16} color={theme.colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
  },
  detail: {
    fontSize: 14,
  },
});
