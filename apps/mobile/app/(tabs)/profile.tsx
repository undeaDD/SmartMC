import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

// Placeholder shell only -- no real settings/pairing logic yet. Sections per
// CLAUDE.md's "App navigation & UX states": paired-server management,
// notification preferences, and links out to the landing page/docs/GitHub.
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.section}>Paired servers</Text>
      <Text style={styles.section}>Notification preferences</Text>
      <Text style={styles.section}>About & links</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  section: {
    fontSize: 17,
    opacity: 0.6,
  },
});
