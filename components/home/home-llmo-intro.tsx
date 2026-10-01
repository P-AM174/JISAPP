import Link from "@/lib/i18n/navigation";
import { getLlmo } from "@/lib/seo/llmo";
import { pick, type Locale } from "@/lib/i18n/config";
import "@/lib/i18n/dictionaries";

/** トップに出す引用用の説明。サーバーコンポーネントとして HTML に含める */
export function HomeLlmoIntro({ locale }: { locale: Locale }) {
  const llmo = getLlmo(locale);
  return (
    <section className="border-b border-gray-100 bg-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
          {pick(
            locale,
            "ジサップ（Jisapp）は、AIのコードを貼るだけの無料開発スタジオです",
            "Jisapp is a free studio where you just paste AI-made code to build apps"
          )}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{llmo.definition}</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{llmo.audience}</p>
        <p className="mt-3">
          <Link
            href="/faq"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {pick(locale, "よくある質問を見る", "Read the FAQ")}
          </Link>
        </p>
      </div>
    </section>
  );
}
