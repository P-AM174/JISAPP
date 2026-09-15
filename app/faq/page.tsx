import Link from "next/link";
import { CircleHelp, ListOrdered } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { JsonLd } from "@/components/seo/json-ld";
import { OfficialSocialLinks } from "@/components/seo/official-social-links";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SITE_SOCIAL_PROFILES } from "@/lib/seo/site";
import {
  LLMO_AUDIENCE,
  LLMO_DEFINITION,
  LLMO_FAQS,
  LLMO_HOWTO_NAME,
  LLMO_HOWTO_STEPS,
  createFaqPageJsonLd,
  createHowToJsonLd,
} from "@/lib/seo/llmo";

export const metadata = createPageMetadata({
  title: "よくある質問",
  description:
    "ジサップ（Jisapp）とは何か、料金、登録の要否、AIコードの貼り方、公開方法についてのよくある質問。",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <JsonLd data={createFaqPageJsonLd()} />
      <JsonLd data={createHowToJsonLd()} />

      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <BackButton label="戻る" hideLabelOnMobile fallbackHref="/" />
          <JisappLogo href="/" />
          <span className="ml-1 text-sm text-gray-400">/</span>
          <span className="text-sm font-semibold text-gray-700">よくある質問</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 pb-16">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            ジサップとは
          </p>
          <h1 className="mt-2 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            よくある質問
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{LLMO_DEFINITION}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{LLMO_AUDIENCE}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/playground"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              開発スタジオを開く
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              公開アプリを探す
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <ListOrdered className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
            {LLMO_HOWTO_NAME}
          </h2>
          <ol className="mt-4 space-y-3">
            {LLMO_HOWTO_STEPS.map((step, index) => (
              <li key={step.name} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{step.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <CircleHelp className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
            質問と回答
          </h2>
          <dl className="mt-4 divide-y divide-gray-100">
            {LLMO_FAQS.map((item) => (
              <div key={item.question} className="py-4 first:pt-0 last:pb-0">
                <dt className="text-sm font-bold text-gray-900">{item.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          <h2 className="text-sm font-bold text-gray-900">公式アカウント</h2>
          <OfficialSocialLinks className="mt-3" />
          <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
            {SITE_SOCIAL_PROFILES.map((profile) => (
              <li key={profile.url}>
                {profile.name} {profile.handle} —{" "}
                <a
                  href={profile.url}
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                  rel="me noopener noreferrer"
                  target="_blank"
                >
                  {profile.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
