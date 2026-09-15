import Link from "next/link";
import { LLMO_AUDIENCE, LLMO_DEFINITION } from "@/lib/seo/llmo";

/** トップに出す引用用の説明。サーバーコンポーネントとして HTML に含める */
export function HomeLlmoIntro() {
  return (
    <section className="border-b border-gray-100 bg-white px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
          ジサップ（Jisapp）は、AIのコードを貼るだけの無料開発スタジオです
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{LLMO_DEFINITION}</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{LLMO_AUDIENCE}</p>
        <p className="mt-3">
          <Link
            href="/faq"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            よくある質問を見る
          </Link>
        </p>
      </div>
    </section>
  );
}
