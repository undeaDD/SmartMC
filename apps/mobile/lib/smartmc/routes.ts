import type { Href } from 'expo-router';

// Expo Router's generated .expo/types/router.d.ts (typed routes) is driven
// by Metro's file watcher, not by `tsc` -- it lags behind newly-added route
// files (and has been observed representing this exact group index route
// inconsistently, as both `/server` and `/server/index`, while the watcher
// catches up) in a way plain `router.push('/server')` calls can't route
// around. This is Expo Router's own documented escape hatch for that gap:
// a typed `Href` cast is correct at runtime regardless of what the dev-time
// cache currently thinks the route union looks like.
export const SERVER_MODAL_HREF = '/server' as Href;
