import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import AppPlatform from '@/components/AppPlatform';
import { useTheme } from '@/providers/ExtendedThemeProvider';

type GlassSurfaceProps = {
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
export function GlassSurface({ style, children }: GlassSurfaceProps) {
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
      <GlassView glassEffectStyle="regular" style={style}>
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
          backgroundColor: theme.blur.background,
          borderRadius: theme.radius.medium,
          overflow: 'hidden',
        },
      ]}
    >
      {children}
    </BlurView>
  );
}
