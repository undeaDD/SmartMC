import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getPairedServers, type PairedServer } from './storage';

/**
 * Loads the paired-server list on mount *and* refreshes on focus.
 * `useFocusEffect` alone should also cover initial mount (a screen normally
 * focuses once when it first appears), but a screen nested inside
 * NativeTabs' own per-tab Stack (expo-router/unstable-native-tabs) doesn't
 * reliably fire that callback -- which previously left a screen stuck
 * showing neither content nor an empty state, indistinguishable from a
 * blank crash. The redundant plain `useEffect` is the defensive fix.
 */
export function usePairedServers(): PairedServer[] | undefined {
  const [servers, setServers] = useState<PairedServer[] | undefined>(undefined);

  const load = useCallback(() => {
    let cancelled = false;
    getPairedServers().then((result) => {
      if (!cancelled) setServers(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(load, [load]);
  useFocusEffect(load);

  return servers;
}
