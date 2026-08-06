import { Stack } from "expo-router";
import { useMemo } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { useStackScreenOptions } from "@/components/useStackScreenOptions";

const ProfileStackLayout = () => {
	const { t } = useI18n();
	const screenOptions = useStackScreenOptions();
	const indexOptions = useMemo(() => ({ title: t("tabProfile") }), [t]);

	const serverOptions = useMemo(() => ({ title: t("settingsServer"), presentation: "modal" as const }), [t]);

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen name="index" options={indexOptions} />
			<Stack.Screen name="server" options={serverOptions} />
		</Stack>
	);
};

export default ProfileStackLayout;
