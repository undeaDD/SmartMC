import { Redirect } from 'expo-router';

// (tabs)/home/index.tsx resolves to the URL segment "/home", not "/" --
// nothing maps bare "/" to a screen without this, which is exactly what an
// "Unmatched Route" screen on smartmc:/// means. Kept as a plain redirect
// rather than renaming home/ back to index.tsx, since the home tab was
// deliberately restructured into its own directory to get a nested Stack.
export default function RootIndex() {
  return <Redirect href="/(tabs)/home" />;
}
