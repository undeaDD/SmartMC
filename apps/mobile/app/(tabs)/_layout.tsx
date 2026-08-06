import { NativeTabs } from 'expo-router/unstable-native-tabs';
import TabIcons from '@/components/TabIcons';
import { useI18n } from '@/providers/I18nProvider';

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={TabIcons} name="home" />} />
        <NativeTabs.Trigger.Label>{t('tabHome')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="devices">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={TabIcons} name="devices" />} />
        <NativeTabs.Trigger.Label>{t('tabDevices')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={TabIcons} name="profile" />} />
        <NativeTabs.Trigger.Label>{t('tabProfile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
