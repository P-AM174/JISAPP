import { makeT, toLocale, type Dictionary, type Locale, type Translate } from "./config";
import { getDictionary } from "./dictionaries";

/** サーバーコンポーネント用。params.locale から言語と t を得る */
export async function getI18n(
  params: Promise<{ locale?: string }> | { locale?: string }
): Promise<{ locale: Locale; t: Translate; dict: Dictionary | null }> {
  const { locale: raw } = await params;
  const locale = toLocale(raw);
  const dict = getDictionary(locale);
  return { locale, t: makeT(locale, dict), dict };
}

/** /api などで、言語の文字列から t を得る */
export function getServerT(locale: Locale): Translate {
  return makeT(locale, getDictionary(locale));
}
