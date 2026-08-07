import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { useTheme } from '@/providers/ExtendedThemeProvider';

type EmptyStateProps = {
  icon?: ComponentType<SvgProps>;
  title: string;
  subtitle: string;
  actionLabel?: string;
  // Iconoir icon component (e.g. `Plus` from 'iconoir-react-native'), not a
  // TabIcons glyph -- the big centered icon above still uses the small
  // TabIcons font, but the button's leading icon is Iconoir per explicit
  // request, despite iconoir-react-native's barrel-import crash risk
  // documented in CLAUDE.md (accepted deliberately, not overlooked).
  actionIcon?: ComponentType<SvgProps>;
  onAction?: () => void;
};

/**
 * Generic centered icon/title/subtitle/action empty state. CLAUDE.md's "App
 * navigation & UX states" section specs several near-identical states
 * (empty dashboard, no-connection, chunk-not-loaded, no-permission, stale
 * reference) -- built reusable from the start rather than as a one-off for
 * Home, since those are real, already-planned near-term call sites, not a
 * hypothetical.
 */
export function EmptyState({
  icon: TitleIcon,
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {TitleIcon ? <TitleIcon width={48} height={48} color={theme.colors.textSecondary} /> : null}
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Pressable
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onAction}
        >
          {ActionIcon ? <ActionIcon width={18} height={18} color="#000" /> : null}
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
});
