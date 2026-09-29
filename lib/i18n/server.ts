import { makeT, toLocale, type Locale, type Translate } from "./config";

/** サーバーコンポーネント用。params.locale から言語と t を得る */
export async function getI18n(
  params: Promise<{ locale?: string }> | { locale?: string }
): Promise<{ locale: Locale; t: Translate }> {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  return { locale, t: makeT(locale) };
}
