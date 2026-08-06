import * as SecureStore from "expo-secure-store";
import type React from "react";
import { createContext, type Dispatch, type ReactNode, type SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AppPlatform from "@/components/AppPlatform";

export type SystemStyle = "light" | "dark" | "system";
export type AppLocale = "english" | "german" | "system";
export type StartTab = "start" | "search" | "alarms" | "profile";
// The tab bar's "search" trigger shows as "Explore" everywhere else in the UI (it has no visible
// tab label of its own — see search/_layout.tsx), so its translation key differs from its tab name.
export const START_TAB_LABEL_KEYS: Record<StartTab, string> = {
	start: "start",
	search: "explore",
	alarms: "alarms",
	profile: "settings",
};

type PreferenceContextType = {
	appIcon: [string, Dispatch<SetStateAction<string>>];
	systemStyle: [SystemStyle, Dispatch<React.SetStateAction<SystemStyle>>];
	appLocale: [AppLocale, Dispatch<React.SetStateAction<AppLocale>>];
	startTab: [StartTab, Dispatch<React.SetStateAction<StartTab>>];

	showDeals: [boolean, Dispatch<React.SetStateAction<boolean>>];
	openForaumExternally: [boolean, Dispatch<React.SetStateAction<boolean>>];
	openShopsExternally: [boolean, Dispatch<React.SetStateAction<boolean>>];
	hideDashboard: [boolean, Dispatch<React.SetStateAction<boolean>>];
	minimizeTabBarOnScroll: [boolean, Dispatch<React.SetStateAction<boolean>>];
	hideTabLabels: [boolean, Dispatch<React.SetStateAction<boolean>>];
	autoOpenLink: [boolean, Dispatch<React.SetStateAction<boolean>>];
	skipCartAnimation: [boolean, Dispatch<React.SetStateAction<boolean>>];
	// Generic accessibility toggle — currently adds icons to the in-stock/out-of-stock dots, but is meant
	// as a shared home for other accessibility-related tweaks added later, not just this one.
	accessibilityMode: [boolean, Dispatch<React.SetStateAction<boolean>>];

	resetAll: () => Promise<void>;
};

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

const keys = {
	icon: "app_icon",
	style: "app_style",
	locale: "app_locale",
	startTab: "start_tab",

	showDeals: "show_deals",
	openForaumExternally: "open_forum_externally",
	openShopsExternally: "open_shops_externally",
	hideDashboard: "mod_hide_dashboard",
	minimizeTabBarOnScroll: "minimize_tab_bar_on_scroll",
	hideTabLabels: "hide_tab_labels",
	autoOpenLink: "auto_open_link",
	skipCartAnimation: "skip_cart_animation",
	accessibilityMode: "accessibility_mode",
};

const defaults = {
	appIcon: "default",
	systemStyle: "system" as SystemStyle,
	appLocale: "system" as AppLocale,
	startTab: "start" as StartTab,

	showDeals: true,
	openForaumExternally: true,
	openShopsExternally: true,
	hideDashboard: true,
	minimizeTabBarOnScroll: AppPlatform.isIOS,
	hideTabLabels: false,
	autoOpenLink: true,
	skipCartAnimation: false,
	accessibilityMode: false,
};

const getStored = async <T,>(key: string, fallback: T): Promise<T> => {
	const val = await SecureStore.getItemAsync(key);
	if (typeof fallback === "boolean") {
		// Unset key → honor the declared default; only a stored value overrides it. Comparing
		// null against "true" would silently force every unset boolean to false.
		return (val === null ? fallback : val === "true") as T;
	}
	return (val as T) ?? fallback;
};

export const AppPreferencesProvider = ({ children }: { children: ReactNode }) => {
	const [appIcon, setAppIcon] = useState<string | undefined>(undefined);
	const [systemStyle, setSystemStyle] = useState<SystemStyle | undefined>(undefined);
	const [appLocale, setAppLocale] = useState<AppLocale | undefined>(undefined);
	const [startTab, setStartTab] = useState<StartTab | undefined>(undefined);

	const [showDeals, setShowDeals] = useState<boolean | undefined>(undefined);
	const [openForaumExternally, setOpenForaumExternally] = useState<boolean | undefined>(undefined);
	const [openShopsExternally, setOpenShopsExternally] = useState<boolean | undefined>(undefined);
	const [hideDashboard, setHideDashboard] = useState<boolean | undefined>(undefined);
	const [minimizeTabBarOnScroll, setMinimizeTabBarOnScroll] = useState<boolean | undefined>(undefined);
	const [hideTabLabels, setHideTabLabels] = useState<boolean | undefined>(undefined);
	const [autoOpenLink, setAutoOpenLink] = useState<boolean | undefined>(undefined);
	const [skipCartAnimation, setSkipCartAnimation] = useState<boolean | undefined>(undefined);
	const [accessibilityMode, setAccessibilityMode] = useState<boolean | undefined>(undefined);


	useEffect(() => {
		(async () => {
			setAppIcon(await getStored(keys.icon, defaults.appIcon));

			const storedLocale: AppLocale = await getStored(keys.locale, defaults.appLocale);
			setAppLocale(storedLocale);

			const storedStyle: SystemStyle = await getStored(keys.style, defaults.systemStyle);
			setSystemStyle(storedStyle);

			const storedStartTab: StartTab = await getStored(keys.startTab, defaults.startTab);
			setStartTab(storedStartTab);

			const storedShowDeals: boolean = await getStored(keys.showDeals, defaults.showDeals);
			setShowDeals(storedShowDeals);

			const storedOpenForaumExternally: boolean = await getStored(keys.openForaumExternally, defaults.openForaumExternally);
			setOpenForaumExternally(storedOpenForaumExternally);

			// const storedOpenShopsExternally: boolean = await getStored(keys.openShopsExternally, defaults.openShopsExternally);
			setOpenShopsExternally(true);

			const storedHideDashboard: boolean = await getStored(keys.hideDashboard, defaults.hideDashboard);
			setHideDashboard(storedHideDashboard);

			const storedMinimizeTabBarOnScroll: boolean = await getStored(keys.minimizeTabBarOnScroll, defaults.minimizeTabBarOnScroll);
			setMinimizeTabBarOnScroll(storedMinimizeTabBarOnScroll);

			const storedHideTabLabels: boolean = await getStored(keys.hideTabLabels, defaults.hideTabLabels);
			setHideTabLabels(storedHideTabLabels);

			const storedAutoOpenLink: boolean = await getStored(keys.autoOpenLink, defaults.autoOpenLink);
			setAutoOpenLink(storedAutoOpenLink);

			const storedSkipCartAnimation: boolean = await getStored(keys.skipCartAnimation, defaults.skipCartAnimation);
			setSkipCartAnimation(storedSkipCartAnimation);

			const storedAccessibilityMode: boolean = await getStored(keys.accessibilityMode, defaults.accessibilityMode);
			setAccessibilityMode(storedAccessibilityMode);
		})();
	}, []);

	useEffect(() => {
		if (appIcon === undefined) return;
		SecureStore.setItemAsync(keys.icon, appIcon);
	}, [appIcon]);

	useEffect(() => {
		if (systemStyle === undefined) return;
		SecureStore.setItemAsync(keys.style, systemStyle);
	}, [systemStyle]);

	useEffect(() => {
		if (appLocale === undefined) return;
		SecureStore.setItemAsync(keys.locale, appLocale);
	}, [appLocale]);

	useEffect(() => {
		if (startTab === undefined) return;
		SecureStore.setItemAsync(keys.startTab, startTab);
	}, [startTab]);

	useEffect(() => {
		if (showDeals === undefined) return;
		SecureStore.setItemAsync(keys.showDeals, showDeals.toString());
	}, [showDeals]);

	useEffect(() => {
		if (openForaumExternally === undefined) return;
		SecureStore.setItemAsync(keys.openForaumExternally, openForaumExternally.toString());
	}, [openForaumExternally]);

	useEffect(() => {
		if (openShopsExternally === undefined) return;
		SecureStore.setItemAsync(keys.openShopsExternally, openShopsExternally.toString());
	}, [openShopsExternally]);

	useEffect(() => {
		if (hideDashboard === undefined) return;
		SecureStore.setItemAsync(keys.hideDashboard, hideDashboard.toString());
	}, [hideDashboard]);

	useEffect(() => {
		if (minimizeTabBarOnScroll === undefined) return;
		SecureStore.setItemAsync(keys.minimizeTabBarOnScroll, minimizeTabBarOnScroll.toString());
	}, [minimizeTabBarOnScroll]);

	useEffect(() => {
		if (hideTabLabels === undefined) return;
		SecureStore.setItemAsync(keys.hideTabLabels, hideTabLabels.toString());
	}, [hideTabLabels]);

	useEffect(() => {
		if (autoOpenLink === undefined) return;
		SecureStore.setItemAsync(keys.autoOpenLink, autoOpenLink.toString());
	}, [autoOpenLink]);

	useEffect(() => {
		if (skipCartAnimation === undefined) return;
		SecureStore.setItemAsync(keys.skipCartAnimation, skipCartAnimation.toString());
	}, [skipCartAnimation]);

	useEffect(() => {
		if (accessibilityMode === undefined) return;
		SecureStore.setItemAsync(keys.accessibilityMode, accessibilityMode.toString());
	}, [accessibilityMode]);

	const resetAll = useCallback(async () => {
		setAppIcon(defaults.appIcon);
		await SecureStore.setItemAsync(keys.icon, defaults.appIcon);

		setSystemStyle(defaults.systemStyle);
		await SecureStore.setItemAsync(keys.style, defaults.systemStyle);

		setAppLocale(defaults.appLocale);
		await SecureStore.setItemAsync(keys.locale, defaults.appLocale);

		setStartTab(defaults.startTab);
		await SecureStore.setItemAsync(keys.startTab, defaults.startTab);

		setShowDeals(defaults.showDeals);
		await SecureStore.setItemAsync(keys.showDeals, defaults.showDeals.toString());

		setOpenForaumExternally(defaults.openForaumExternally);
		await SecureStore.setItemAsync(keys.openForaumExternally, defaults.openForaumExternally.toString());

		setOpenShopsExternally(defaults.openShopsExternally);
		await SecureStore.setItemAsync(keys.openShopsExternally, defaults.openShopsExternally.toString());

		setHideDashboard(defaults.hideDashboard);
		await SecureStore.setItemAsync(keys.hideDashboard, defaults.hideDashboard.toString());

		setMinimizeTabBarOnScroll(defaults.minimizeTabBarOnScroll);
		await SecureStore.setItemAsync(keys.minimizeTabBarOnScroll, defaults.minimizeTabBarOnScroll.toString());

		setHideTabLabels(defaults.hideTabLabels);
		await SecureStore.setItemAsync(keys.hideTabLabels, defaults.hideTabLabels.toString());

		setAutoOpenLink(defaults.autoOpenLink);
		await SecureStore.setItemAsync(keys.autoOpenLink, defaults.autoOpenLink.toString());

		setSkipCartAnimation(defaults.skipCartAnimation);
		await SecureStore.setItemAsync(keys.skipCartAnimation, defaults.skipCartAnimation.toString());

		setAccessibilityMode(defaults.accessibilityMode);
		await SecureStore.setItemAsync(keys.accessibilityMode, defaults.accessibilityMode.toString());
	}, []);

	const value = useMemo<PreferenceContextType>(
		() => ({
			appIcon: [appIcon as string, setAppIcon as Dispatch<SetStateAction<string>>],
			systemStyle: [systemStyle as SystemStyle, setSystemStyle as Dispatch<React.SetStateAction<SystemStyle>>],
			appLocale: [appLocale as AppLocale, setAppLocale as Dispatch<React.SetStateAction<AppLocale>>],
			startTab: [startTab as StartTab, setStartTab as Dispatch<React.SetStateAction<StartTab>>],
			showDeals: [showDeals as boolean, setShowDeals as Dispatch<React.SetStateAction<boolean>>],
			openForaumExternally: [openForaumExternally as boolean, setOpenForaumExternally as Dispatch<React.SetStateAction<boolean>>],
			openShopsExternally: [openShopsExternally as boolean, setOpenShopsExternally as Dispatch<React.SetStateAction<boolean>>],
			hideDashboard: [hideDashboard as boolean, setHideDashboard as Dispatch<React.SetStateAction<boolean>>],
			minimizeTabBarOnScroll: [minimizeTabBarOnScroll as boolean, setMinimizeTabBarOnScroll as Dispatch<React.SetStateAction<boolean>>],
			hideTabLabels: [hideTabLabels as boolean, setHideTabLabels as Dispatch<React.SetStateAction<boolean>>],
			autoOpenLink: [autoOpenLink as boolean, setAutoOpenLink as Dispatch<React.SetStateAction<boolean>>],
			skipCartAnimation: [skipCartAnimation as boolean, setSkipCartAnimation as Dispatch<React.SetStateAction<boolean>>],
			accessibilityMode: [accessibilityMode as boolean, setAccessibilityMode as Dispatch<React.SetStateAction<boolean>>],
			resetAll,
		}),
		[
			appIcon,
			systemStyle,
			appLocale,
			startTab,
			showDeals,
			openForaumExternally,
			openShopsExternally,
			hideDashboard,
			minimizeTabBarOnScroll,
			hideTabLabels,
			autoOpenLink,
			skipCartAnimation,
			accessibilityMode,
			resetAll,
		],
	);

	if (
		appIcon === undefined ||
		systemStyle === undefined ||
		appLocale === undefined ||
		startTab === undefined ||
		hideDashboard === undefined ||
		minimizeTabBarOnScroll === undefined ||
		hideTabLabels === undefined ||
		autoOpenLink === undefined ||
		skipCartAnimation === undefined ||
		accessibilityMode === undefined
	) {
		return null;
	}

	return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
};

export const usePreferences = () => {
	const ctx = useContext(PreferenceContext);
	if (!ctx) throw new Error("usePreferences must be used within AppPreferencesProvider");
	return ctx;
};
