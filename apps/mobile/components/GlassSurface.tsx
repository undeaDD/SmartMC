import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import AppPlatform from '@/components/AppPlatform';
import { useTheme } from '@/providers/ExtendedThemeProvider';

// Matches the opacity of the neutral theme.blur.background values it stands
// in for (e.g. '#12121299') -- keeps the blur/translucency visible under the
// tint instead of the color becoming a flat, opaque fill.
const TINT_ALPHA = '99';

type GlassSurfaceProps = {
  color?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * A card-like surface backed by real Liquid Glass on iOS 26+, falling back to
 * a blurred translucent panel everywhere else. The native glass shapes and
 * rounds itself, so no backgroundColor/borderRadius is applied there -- the
 * blur fallback has to draw both itself, since BlurView is just a plain
 * translucent rect otherwise.
 */
export function GlassSurface({ color, style, children }: GlassSurfaceProps) {
  const { theme } = useTheme();

  // isGlassEffectAPIAvailable() guards against a real crash on some iOS 26
  // beta builds where the OS version check alone (AppPlatform.OS === 'iosnew')
  // isn't sufficient -- see expo-glass-effect's own docs (expo/expo#40911).
  const useNativeGlass = useMemo(
    () => AppPlatform.OS === 'iosnew' && isGlassEffectAPIAvailable(),
    [],
  );

  if (useNativeGlass) {
    return (
      <GlassView glassEffectStyle="regular" style={style} tintColor={color}>
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={theme.blur.intensity}
      tint={theme.blur.tint}
      style={[
        style,
        {
          // `color` was previously only wired to the native-glass path above
          // (as tintColor) -- the blur fallback silently ignored it. Blended
          // at the same alpha as the neutral background it replaces, so the
          // blur/translucency underneath stays visible instead of the tint
          // becoming a flat fill.
          backgroundColor: color ? withAlpha(color, TINT_ALPHA) : theme.blur.background,
          borderRadius: theme.radius.medium,
          overflow: 'hidden',
        },
      ]}
    >
      {children}
    </BlurView>
  );
}

/** Appends an alpha channel to a `#rrggbb` color; passes through unchanged if one's already present. */
function withAlpha(hex: string, alphaHex: string): string {
  return hex.length > 7 ? hex : `${hex}${alphaHex}`;
}
