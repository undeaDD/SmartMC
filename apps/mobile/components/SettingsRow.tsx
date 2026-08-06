import { NavArrowRight } from 'iconoir-react-native';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { useTheme } from '@/providers/ExtendedThemeProvider';

type SettingsRowProps = {
  icon: ComponentType<SvgProps>;
  label: string;
  detail?: string;
  onPress?: () => void;
  disabled?: boolean;
};

/**
 * A single iOS-Settings-style row: icon in a rounded square, label, optional
 * trailing detail text, chevron. Shared by every row in the Settings screen
 * (both the plain link rows and the "Server" row that opens a modal).
 */
export function SettingsRow({ icon: Icon, label, detail, onPress, disabled }: SettingsRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.surface }]}>
        <Icon width={18} height={18} color={theme.colors.primary} />
      </View>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      {detail ? <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>{detail}</Text> : null}
      {onPress && !disabled ? <NavArrowRight width={16} height={16} color={theme.colors.textSecondary} /> : null}
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
  label: {
    flex: 1,
    fontSize: 16,
  },
  detail: {
    fontSize: 14,
  },
});
