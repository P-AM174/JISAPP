"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, makeT, type Locale, type Translate } from "./config";
import { installApiMessageTranslation } from "./api-messages";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // 英語ページでは、サーバーが返す日本語のエラー文を英語にして受け取る（最初の fetch より前に入れる）
  if (locale === "en") installApiMessageTranslation();
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
