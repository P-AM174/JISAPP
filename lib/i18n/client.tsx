"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, makeT, registerDictionary, type Dictionary, type Locale, type Translate } from "./config";
import { installApiMessageTranslation } from "./api-messages";

type LocaleState = { locale: Locale; dict: Dictionary | null };

const LocaleContext = createContext<LocaleState>({ locale: DEFAULT_LOCALE, dict: null });

/** React の外（fetch の置き換えなど）から使う、表示中の言語と辞書 */
let current: LocaleState = { locale: DEFAULT_LOCALE, dict: null };

export function getClientLocaleState(): LocaleState {
  return current;
}

export function LocaleProvider({
  locale,
  dict = null,
  children,
}: {
  locale: Locale;
  /** ベトナム語ページのときだけサーバーから渡す（日本語・英語ページでは読み込まない） */
  dict?: Dictionary | null;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  current = value;
  registerDictionary(dict);
  // 英語・ベトナム語ページでは、サーバーが返す日本語のエラー文を訳して受け取る（最初の fetch より前に入れる）
  if (locale !== "ja") installApiMessageTranslation(value);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

/** ベトナム語の辞書（日本語・英語ページでは null） */
export function useDictionary(): Dictionary | null {
  return useContext(LocaleContext).dict;
}

/** const t = useT(); t("保存", "Save") */
export function useT(): Translate {
  const { locale, dict } = useContext(LocaleContext);
  return useMemo(() => makeT(locale, dict), [locale, dict]);
}
