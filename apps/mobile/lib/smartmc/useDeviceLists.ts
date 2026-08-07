import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { fetchDeviceList } from './deviceListClient';
import type { PairedServer } from './storage';
import { usePairedServers } from './usePairedServers';

export type ServerDeviceState = {
  server: PairedServer;
  /** undefined = not fetched yet; [] = fetched, genuinely no devices. */
  devices: import('@smart-mc/protocol').DeviceSummary[] | undefined;
  error: string | undefined;
};

/**
 * Fetches each paired server's device list on mount and on focus (same
 * `useEffect` + `useFocusEffect` double-fire pattern as {@link usePairedServers},
 * needed for the same reason -- a screen nested inside `NativeTabs`' own
 * per-tab Stack doesn't reliably fire focus events on its own). Also exposes
 * `refreshing`/`refresh` for pull-to-refresh. Shared by Home and Devices --
 * both need the same real fetched data now, not local placeholder state.
 */
export function useDeviceLists(): {
  serverDevices: ServerDeviceState[] | undefined;
  refreshing: boolean;
  refresh: () => void;
} {
  const pairedServers = usePairedServers();
  const [byServerId, setByServerId] = useState<
    Record<string, { devices: ServerDeviceState['devices']; error: string | undefined }>
  >({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (servers: PairedServer[]) => {
    const results = await Promise.all(
      servers.map(async (server) => {
        const outcome = await fetchDeviceList({
          host: server.host,
          port: server.port,
          token: server.token,
          expectedServerFingerprint: server.serverFingerprint,
        });
        return [server.id, outcome] as const;
      }),
    );
    setByServerId((prev) => {
      const next = { ...prev };
      for (const [id, outcome] of results) {
        next[id] = outcome.success
          ? { devices: outcome.devices ?? [], error: undefined }
          : { devices: prev[id]?.devices, error: outcome.error };
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (pairedServers) load(pairedServers);
  }, [pairedServers, load]);

  useFocusEffect(
    useCallback(() => {
      if (pairedServers) load(pairedServers);
    }, [pairedServers, load]),
  );

  const refresh = useCallback(() => {
    if (!pairedServers) return;
    setRefreshing(true);
    load(pairedServers).finally(() => setRefreshing(false));
  }, [pairedServers, load]);

  const serverDevices = pairedServers?.map((server) => ({
    server,
    devices: byServerId[server.id]?.devices,
    error: byServerId[server.id]?.error,
  }));

  return { serverDevices, refreshing, refresh };
}
