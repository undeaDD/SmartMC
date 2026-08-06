import { NativeTabs } from 'expo-router/unstable-native-tabs';
import TabIcons, { TabIconName } from '@/components/TabIcons';
import { useI18n } from '@/providers/I18nProvider';
import { useTheme } from '@/providers/ExtendedThemeProvider';
import AppPlatform from '@/components/AppPlatform';
import { usePreferences } from '@/providers/AppPreferences';
import { createContext, useState } from 'react';

export const TabBarContext = createContext<{
	setIsTabBarHidden: (hidden: boolean) => void;
}>({
	setIsTabBarHidden: () => {
		// no-op
	},
});

const vectorIconSrc = (name: TabIconName) => (AppPlatform.isIOS ? undefined : <NativeTabs.Trigger.VectorIcon family={TabIcons} name={name} />);

export default function TabLayout() {
  const { t } = useI18n();
  const { theme } = useTheme();	
  const { minimizeTabBarOnScroll, hideTabLabels } = usePreferences();
	const [isTabBarHidden, setIsTabBarHidden] = useState(false);
	const labelsHidden = AppPlatform.isAndroid ? false : hideTabLabels[0];

  return (
		<TabBarContext value={{ setIsTabBarHidden }}>
			<NativeTabs
				sidebarAdaptable={false}
				backBehavior="history"
				hidden={isTabBarHidden}
				indicatorColor="#5ccf68"
				rippleColor="#5ccf68"
				labelVisibilityMode="labeled"
				{...(AppPlatform.isIOS ? {} : { blurEffect: "none" as const, backgroundColor: theme.colors.card })}
				minimizeBehavior={AppPlatform.OS === "iosnew" && minimizeTabBarOnScroll[0] ? "onScrollDown" : "never"}
				iconColor={{
					default: theme.colors.textSecondary,
					selected: theme.colors.primary,
				}}
				labelStyle={{
					default: { color: theme.colors.textSecondary },
					selected: { color: theme.colors.primary },
				}}
			>
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon renderingMode="template" xcasset="tab-home" src={vectorIconSrc("home")} />
          <NativeTabs.Trigger.Label hidden={labelsHidden}>{t('tabHome')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="devices">
          <NativeTabs.Trigger.Icon renderingMode="template" xcasset="tab-devices" src={vectorIconSrc("devices")} />
          <NativeTabs.Trigger.Label hidden={labelsHidden}>{t('tabDevices')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon renderingMode="template" xcasset="tab-profile" src={vectorIconSrc("profile")} />
          <NativeTabs.Trigger.Label hidden={labelsHidden}>{t('tabProfile')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext>
  );
}
