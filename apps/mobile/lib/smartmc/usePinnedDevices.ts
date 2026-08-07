import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getPinnedDeviceRefs, type PinnedDeviceRef } from './pinnedDevices';

/**
 * Loads the ordered pinned-device-ref list on mount *and* on focus -- same
 * `useEffect` + `useFocusEffect` double-fire pattern as {@link usePairedServers}
 * and {@link useDeviceLists}, needed for the same reason (a screen nested
 * inside NativeTabs' own per-tab Stack doesn't reliably fire focus alone).
 * Each screen using this gets its own instance; SecureStore is the shared
 * source of truth, and refocusing re-syncs it, matching the existing
 * multi-instance convention for `usePairedServers`.
 */
export function usePinnedDevices(): {
  pinnedRefs: PinnedDeviceRef[] | undefined;
  refresh: () => void;
} {
  const [pinnedRefs, setPinnedRefs] = useState<PinnedDeviceRef[] | undefined>(undefined);

  const load = useCallback(() => {
    let cancelled = false;
    getPinnedDeviceRefs().then((result) => {
      if (!cancelled) setPinnedRefs(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(load, [load]);
  useFocusEffect(load);

  return { pinnedRefs, refresh: load };
}
