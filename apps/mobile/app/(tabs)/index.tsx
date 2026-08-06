import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useI18n } from '@/providers/I18nProvider';

export default function HomeScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('homeEmpty')}</Text>
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
