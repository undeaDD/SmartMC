import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { fetchServerIcon } from './serverIconClient';
import type { PairedServer } from './storage';

/**
 * Maps paired-server id -> base64 PNG (no data-URI prefix), fetched
 * independently per server on focus. Absent entries just mean "no icon set,
 * or the fetch hasn't resolved/failed yet" -- errors are swallowed here
 * (falling back to a generic icon) rather than surfaced, since a missing
 * server icon isn't something worth an app-level error state over.
 */
export function useServerIcons(
  servers: PairedServer[] | undefined,
): Record<string, string | undefined> {
  const [icons, setIcons] = useState<Record<string, string | undefined>>({});

  useFocusEffect(
    useCallback(() => {
      if (!servers) return;
      for (const server of servers) {
        fetchServerIcon({
          host: server.host,
          port: server.port,
          token: server.token,
          expectedServerFingerprint: server.serverFingerprint,
        }).then((outcome) => {
          if (outcome.success && outcome.imageBase64) {
            setIcons((prev) => ({ ...prev, [server.id]: outcome.imageBase64 }));
          }
        });
      }
    }, [servers]),
  );

  return icons;
}
