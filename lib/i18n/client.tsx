"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, makeT, type Locale, type Translate } from "./config";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** const t = useT(); t("保存", "Save") */
export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => makeT(locale), [locale]);
}
