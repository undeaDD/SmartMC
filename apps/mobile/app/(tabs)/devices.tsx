import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function DevicesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Place an Alarm Controller block and it'll show up here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 17,
    textAlign: 'center',
    opacity: 0.6,
  },
});
