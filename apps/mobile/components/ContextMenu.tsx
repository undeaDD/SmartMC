import { MenuView } from '@expo/ui/community/menu';
import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

export type MenuAction = {
  label: string;
  /** iOS-only -- SF Symbol name shown beside the label. Android ignores this (it only accepts a bundled image asset, which nothing here has), so Android menu items render as text-only. */
  sfSymbol?: SFSymbol;
  destructive?: boolean;
  onPress: () => void;
};

type ContextMenuProps = {
  actions: MenuAction[];
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Wraps `children` in a real native long-press context menu (`@expo/ui`'s
 * `MenuView` -- SwiftUI `ContextMenu` on iOS, Compose `DropdownMenu` on
 * Android). `@expo/ui` is already pulled in transitively by expo-router
 * itself (it backs some of Router's own native UI), so this doesn't add a
 * new native surface beyond what's already linked into the current
 * dev-client build. Renders `children` unwrapped when there are no actions,
 * so a cell with nothing to offer doesn't grow an inert long-press handler
 * that could contend with another gesture (e.g. Sortable.Grid's own drag).
 * Still applies `style` via a plain `View` in that case, so callers can rely
 * on the same layout box either way (e.g. a fixed-size grid cell).
 */
export function ContextMenu({ actions, style, children }: ContextMenuProps) {
  if (actions.length === 0) return <View style={style}>{children}</View>;

  return (
    <MenuView
      style={style}
      shouldOpenOnLongPress
      actions={actions.map((action) => ({
        title: action.label,
        image: action.sfSymbol,
        attributes: action.destructive ? { destructive: true } : undefined,
      }))}
      onPressAction={(event) => {
        actions.find((action) => action.label === event.nativeEvent.event)?.onPress();
      }}
    >
      {children}
    </MenuView>
  );
}
