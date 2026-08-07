import { router, useNavigation } from 'expo-router';
import { AppleShortcuts, Check, EditPencil, Plus, Server } from 'iconoir-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import Sortable, {
  type SortableGridDragEndParams,
  type SortableGridRenderItem,
} from 'react-native-sortables';

import { DeviceCell } from '@/components/DeviceCell';
import { EmptyState } from '@/components/EmptyState';
import { mapDeviceSummary } from '@/lib/devices/mapDeviceSummary';
import type { Device } from '@/lib/devices/types';
import { type PinnedDeviceRef, reorderPinnedDevices } from '@/lib/smartmc/pinnedDevices';
import { SERVER_MODAL_HREF } from '@/lib/smartmc/routes';
import type { PairedServer } from '@/lib/smartmc/storage';
import { useDeviceLists } from '@/lib/smartmc/useDeviceLists';
import { usePinnedDevices } from '@/lib/smartmc/usePinnedDevices';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

type PinnedItem = { ref: PinnedDeviceRef; device: Device; server: PairedServer };

function refsEqual(a: PinnedDeviceRef[], b: PinnedDeviceRef[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (ref, index) => ref.serverId === b[index].serverId && ref.deviceId === b[index].deviceId,
    )
  );
}

export default function HomeScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { serverDevices, refreshing, refresh: refreshDevices } = useDeviceLists();
  const { pinnedRefs, refresh: refreshPinned } = usePinnedDevices();
  const scrollableRef = useAnimatedRef<ScrollView>();

  // Drag-to-reorder is off by default -- a cell's own long press opens its
  // pin/unpin menu (see DeviceCell). The header's own pencil/checkmark
  // button (wired below via `navigation.setOptions`, since that button
  // lives in `_layout.tsx`'s Stack header, not this screen's own tree) is
  // the sole way in and out of reorder mode, so there's never a moment
  // where both a cell's long-press menu and Sortable.Grid's own drag
  // gesture are active on the same cell at once (DeviceCell suppresses its
  // menu/tap entirely while `reordering` is true).
  const [isReordering, setIsReordering] = useState(false);

  // Local, optimistically-updated copy of the pinned order -- drag-and-drop
  // reordering updates this immediately (see handleDragEnd) rather than
  // waiting on a storage round-trip + refetch, which would otherwise show a
  // visible snap-back while the write is in flight. Only re-synced from the
  // hook's own state when it actually changes (mount/focus/after a pin-menu
  // action), not on every render, so a just-completed local drag isn't
  // clobbered by a stale value.
  const [orderedRefs, setOrderedRefs] = useState<PinnedDeviceRef[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omits `orderedRefs` -- re-running this on every local reorder (which changes orderedRefs) would clobber the optimistic drag-end update this effect is guarding against.
  useEffect(() => {
    if (pinnedRefs && !refsEqual(pinnedRefs, orderedRefs)) {
      setOrderedRefs(pinnedRefs);
    }
  }, [pinnedRefs]);

  const deviceByRef = new Map<string, { device: Device; server: PairedServer }>();
  for (const { server, devices } of serverDevices ?? []) {
    for (const summary of devices ?? []) {
      deviceByRef.set(`${server.id}::${summary.id}`, { device: mapDeviceSummary(summary), server });
    }
  }

  // Refs pointing at a device that's no longer in the fetched list (removed
  // server-side, or its server disconnected) are silently dropped from
  // display -- an honest stale-reference case, not an error worth surfacing.
  const items: PinnedItem[] = orderedRefs.flatMap((ref) => {
    const found = deviceByRef.get(`${ref.serverId}::${ref.deviceId}`);
    return found ? [{ ref, device: found.device, server: found.server }] : [];
  });

  // The reorder toggle only makes sense once there's something to reorder --
  // exits reorder mode automatically if the last pinned device is removed
  // out from under it (e.g. unpinned from the Devices tab in another tab).
  useEffect(() => {
    if (items.length === 0 && isReordering) setIsReordering(false);
  }, [items.length, isReordering]);

  useEffect(() => {
    navigation.setOptions({
      headerRight:
        items.length > 0
          ? () => (
              <Pressable onPress={() => setIsReordering((prev) => !prev)} hitSlop={8}>
                {isReordering ? (
                  <Check width={22} height={22} color={theme.colors.primary} />
                ) : (
                  <EditPencil width={22} height={22} color={theme.colors.primary} />
                )}
              </Pressable>
            )
          : undefined,
    });
    // items is derived fresh every render (not a stable dep-friendly value) --
    // its length is what actually needs to trigger this, same as the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isReordering, items.length, theme]);

  const handleDragEnd = useCallback(({ data }: SortableGridDragEndParams<PinnedItem>) => {
    const newRefs = data.map((item) => item.ref);
    setOrderedRefs(newRefs);
    reorderPinnedDevices(newRefs);
  }, []);

  const renderItem = useCallback<SortableGridRenderItem<PinnedItem>>(
    ({ item }) => (
      <DeviceCell
        device={item.device}
        server={item.server}
        pinned={true}
        onPinChange={refreshPinned}
        reordering={isReordering}
      />
    ),
    [refreshPinned, isReordering],
  );

  if (serverDevices === undefined || pinnedRefs === undefined) {
    return null;
  }

  if (serverDevices.length === 0) {
    return (
      <EmptyState
        icon={Server}
        title={t('noServerTitle')}
        subtitle={t('noServerSubtitle')}
        actionLabel={t('noServerConnect')}
        actionIcon={Plus}
        onAction={() => router.push(SERVER_MODAL_HREF)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={AppleShortcuts}
        title={t('homeEmptyTitle')}
        subtitle={t('homeEmptySubtitle')}
        actionLabel={t('homePinDevice')}
        actionIcon={Plus}
        onAction={() => router.push('/(tabs)/devices')}
      />
    );
  }

  return (
    <ScrollView
      ref={scrollableRef}
      contentContainerStyle={styles.grid}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustContentInsets={true}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshDevices} />}
    >
      <Sortable.Grid
        columns={2}
        data={items}
        keyExtractor={(item) => item.device.id}
        renderItem={renderItem}
        rowGap={4}
        columnGap={4}
        sortEnabled={isReordering}
        scrollableRef={scrollableRef}
        onDragEnd={handleDragEnd}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 12,
  },
});
