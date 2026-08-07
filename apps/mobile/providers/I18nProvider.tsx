import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from 'react';
import de from '@/assets/locales/de.json';
import en from '@/assets/locales/en.json';

function normalizeLocale(tag: string | undefined): 'en' | 'de' {
  if (tag?.startsWith('de')) return 'de';
  return 'en';
}

const i18n = new I18n({ en, de });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = normalizeLocale(Localization.getLocales()[0]?.languageTag);

type I18nContextValue = {
  t: (scope: string, options?: object) => string;
};

const I18nContext = createContext<I18nContextValue>({ t: (scope) => scope });

export function I18nProvider({ children }: PropsWithChildren) {
  const t = useCallback((scope: string, options?: object) => i18n.t(scope, options), []);
  const value = useMemo(() => ({ t }), [t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
