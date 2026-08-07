import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { checkServerReachable } from './serverStatus';
import type { PairedServer } from './storage';

export type Reachability = 'checking' | 'online' | 'offline';

/**
 * Kicks off an independent reachability check per server on focus (this
 * screen is a root-level modal Stack, not nested under NativeTabs, so
 * unlike `usePairedServers`/`useDeviceLists` a plain `useFocusEffect` alone
 * reliably covers the initial mount too -- no extra `useEffect` needed).
 * Each server's result lands whenever its own check resolves, independent
 * of the others, so one slow/offline server doesn't hold up the rest.
 */
export function useServerReachability(
  servers: PairedServer[] | undefined,
): Record<string, Reachability> {
  const [reachability, setReachability] = useState<Record<string, Reachability>>({});

  useFocusEffect(
    useCallback(() => {
      if (!servers) return;
      setReachability((prev) => {
        const next = { ...prev };
        for (const server of servers) next[server.id] = 'checking';
        return next;
      });
      for (const server of servers) {
        checkServerReachable(server.host, server.port).then((online) => {
          setReachability((prev) => ({ ...prev, [server.id]: online ? 'online' : 'offline' }));
        });
      }
    }, [servers]),
  );

  return reachability;
}
