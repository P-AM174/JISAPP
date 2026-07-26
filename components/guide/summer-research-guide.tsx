"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Copy,
  HelpCircle,
  Lightbulb,
  Rocket,
  Terminal,
} from "lucide-react";
import { JisappLogo } from "@/components/jisapp-logo";
import { cn } from "@/lib/utils";
import { PROMPT_TEMPLATE, REPORT_TEMPLATE } from "@/lib/playground/prompt-template";

function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* noop */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98]",
        copied
          ? "bg-emerald-600 text-white"
          : "bg-emerald-600 text-white hover:bg-emerald-700",
        className
      )}
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          コピーしました
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}

const STEPS = [
  {
    id: "theme",
    num: "1",
    title: "テーマ（研究テーマ）を決める",
    body: [
      "毎日「面倒だな」と思うことを1つ書き出します。",
      "「アプリにしたら楽になる？」と考えて、10文字以内のタイトルを決めます。",
    ],
    examples: ["おこづかいメモ", "読書記録", "勉強タイマー", "九九ドリル", "ペットの世話チェック"],
    tip: "最初はシンプルな1機能（ボタン1つで記録するなど）から始めるとうまくいきます。",
  },
  {
    id: "login",
    num: "2",
    title: "ジサップにログインする",
    body: [
      "アプリを作って保存・公開するには、ログインが必要です。",
      "保護者の方と一緒にアカウントを作るか、ログインしてください。",
    ],
    link: { href: "/login", label: "ログイン・新規登録" },
    tip: "ログインしなくてもプレイグラウンドで試すことはできますが、公開するときはログインが必要です。",
  },
  {
    id: "prompt",
    num: "3",
    title: "AIへの指示文をコピーする",
    body: [
      "下のボタンで指示文をコピーします。",
      "「【ここに作りたいアプリ名を入れる】」の部分だけ、Step 1で決めた名前（例：おこづかいメモ）に書き換えます。",
    ],
    tip: "指示文はジサップ専用のルールが入っているので、そのまま使うのがおすすめです。",
    hasPrompt: true,
  },
  {
    id: "ai",
    num: "4",
    title: "AIに送って、質問に答える",
    body: [
      "ChatGPT、Gemini、Claude など、使えるAIを開きます。",
      "書き換えた指示文をそのまま送信します。",
      "AIが「保存機能は必要ですか？」など質問してきたら、はい/いいえで答えます（このときコードはまだ出ません）。",
      "答えると、ジサップ用のHTMLコードが返ってきます（1〜2分かかることもあります）。",
    ],
    tip: "保存機能が不要なアプリ（電卓など）なら「いいえ」と答えると、シンプルなコードになります。",
  },
  {
    id: "paste",
    num: "5",
    title: "プレイグラウンドに貼り付ける",
    body: [
      "ジサップのプレイグラウンドを開きます。",
      "AIが出したHTMLコードをすべて貼り付けます。",
      "「プレビュー更新」ボタンを押すと、右側（スマホでは下）にアプリが表示されます。",
    ],
    link: { href: "/playground", label: "プレイグラウンドを開く" },
    tip: "画面が真っ白なときは、コードの最初に <!DOCTYPE html> があるか確認してください。",
  },
  {
    id: "fix",
    num: "6",
    title: "動かして、直す",
    body: [
      "ボタンを押したり、文字を入力して、思い通りに動くか試します。",
      "直したいところがあれば、AIに「ボタンの色を青にして」「文字を大きくして」と追加で頼みます。",
      "新しいコードをもらったら、また貼り付けてプレビューを更新します。",
    ],
    tip: "何度か繰り返して直すのも、自由研究の大事な工程です。",
  },
  {
    id: "publish",
    num: "7",
    title: "公開してURLをもらう",
    body: [
      "プレイグラウンドの「公開する」ボタンを押します。",
      "アプリの名前、説明、カテゴリを入力して公開します。",
      "公開が完了すると、アプリ専用のURL（インターネット上のアドレス）が発行されます。",
    ],
    link: { href: "/playground", label: "公開する（プレイグラウンド）" },
    tip: "URLはレポートの「提出物」欄に書きます。メモ帳に控えておきましょう。",
  },
  {
    id: "report",
    num: "8",
    title: "自由研究レポートを書く",
    body: [
      "テーマ・目的・方法・結果・感想をまとめます。",
      "下のテンプレートをコピーして、空欄を埋めてください。",
      "最後に、Step 7で取得したアプリのURLを書いて提出します。",
    ],
    tip: "提出の形式（ノート・Word・Googleドキュメントなど）は、先生の指示に従ってください。",
    hasReport: true,
  },
] as const;

const FAQ = [
  {
    q: "データを別の端末でも使いたい",
    a: "保存機能付きのアプリで、端末をまたいでデータを残したい場合は、ログインしたうえでマイライブラリに追加してください。追加後は Supabase に保存され、別端末でも同じデータが読み込めます。",
  },
  {
    q: "プログラミングが初めてでも大丈夫？",
    a: "大丈夫です。コードはAIが書きます。あなたがやるのは「アイデアを考える」「AIに頼む」「貼り付けて試す」ことです。",
  },
  {
    q: "パソコンがなくてもできる？",
    a: "スマホやタブレットだけでもできます。ただし、長いコードのコピー＆貼り付けは、パソコンの方がやりやすい場合があります。",
  },
  {
    q: "お金はかかる？",
    a: "ジサップでアプリを作る・公開するのは無料です。AI（ChatGPTなど）は、使うサービスによって無料枠や料金が異なります。",
  },
  {
    q: "工作の宿題と違う？",
    a: "紙や材料を使う工作とは違いますが、「自分で考えて、自分で作ったものを提出する」点は同じです。提出形式は先生に確認してください。",
  },
  {
    q: "人のアプリをコピーしていい？",
    a: "ダメです。自分で考えたテーマで、AIと一緒に作ったアプリを提出しましょう。",
  },
] as const;

const TOC = [
  { id: "why", label: "アプリが自由研究に向いている理由" },
  { id: "themes", label: "テーマの決め方" },
  { id: "steps", label: "作り方（8ステップ）" },
  { id: "faq", label: "よくある質問" },
] as const;

export function SummerResearchGuide() {
  return (
    <div className="min-h-screen bg-[#f3f4f2]">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <JisappLogo href="/" />
          <Link href="/" className="text-sm text-gray-500 hover:text-emerald-600">
            トップへ
          </Link>
        </div>
      </header>

      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl text-white">
          <p className="text-xs font-semibold tracking-wide text-white/80">夏休み自由研究ガイド</p>
          <h1 className="mt-2 text-2xl font-black leading-snug sm:text-3xl">
            夏休みの自由研究に、
            <br className="sm:hidden" />
            自分だけのアプリを提出しよう
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
            プログラミングが初めてでも大丈夫。AIと一緒なら、1日で形にできます。
            このページのとおりに進めれば、テーマ決めから提出まで完了します。
          </p>
          <p className="mt-4 text-xs text-white/70">
            目安時間：2〜3時間 ／ 必要なもの：スマホまたはパソコン、AI（ChatGPT・Geminiなど）
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <nav className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">目次</p>
          <ul className="mt-3 space-y-2">
            {TOC.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <ChevronRight className="h-4 w-4 shrink-0" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section id="why" className="scroll-mt-6 space-y-3">
          <h2 className="text-lg font-black text-gray-900">アプリが自由研究に向いている理由</h2>
          <p className="text-sm leading-relaxed text-gray-600">
            自由研究は「観察 → 仮説 → 実験 → まとめ」の流れが大切です。アプリ制作も同じ流れで進められます。
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold text-emerald-600">・</span>
              「生活の不便を解決する」など、テーマが立てやすい
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-600">・</span>
              完成したアプリのURLを、そのまま提出物にできる
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-600">・</span>
              コードより「何を作って、なぜ作ったか」が評価の中心になる
            </li>
          </ul>
        </section>

        <section id="themes" className="scroll-mt-6 space-y-4">
          <h2 className="text-lg font-black text-gray-900">テーマの決め方</h2>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-2 text-sm text-amber-900">
                <p className="font-bold">3ステップで決めよう</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>毎日「面倒だな」と思うことを1つ書く</li>
                  <li>「アプリにしたら楽になる？」と考える</li>
                  <li>10文字以内のタイトルを決める</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { grade: "低学年向け", items: ["九九ドリル", "好きな色カウンター", "今日の気分メモ"] },
              { grade: "中高学年向け", items: ["おこづかいメモ", "読書記録", "勉強タイマー", "オリジナルクイズ"] },
            ].map((block) => (
              <div key={block.grade} className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-bold text-gray-400">{block.grade}</p>
                <ul className="mt-2 space-y-1">
                  {block.items.map((item) => (
                    <li key={item} className="text-sm text-gray-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="steps" className="scroll-mt-6 space-y-5">
          <h2 className="text-lg font-black text-gray-900">作り方（8ステップ）</h2>
          <p className="text-sm text-gray-600">上から順番に進めてください。</p>

          {STEPS.map((step) => (
            <article
              key={step.id}
              id={step.id}
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
              </div>
              <div className="space-y-4 px-5 py-4">
                <ul className="space-y-2">
                  {step.body.map((line) => (
                    <li key={line} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      {line}
                    </li>
                  ))}
                </ul>

                {"examples" in step && step.examples && (
                  <div className="flex flex-wrap gap-2">
                    {step.examples.map((ex) => (
                      <span
                        key={ex}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                )}

                {"hasPrompt" in step && step.hasPrompt && (
                  <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <p className="text-xs font-bold text-sky-800">AIへの指示文（ジサップ専用）</p>
                    <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-700">
                      {PROMPT_TEMPLATE}
                    </pre>
                    <CopyButton text={PROMPT_TEMPLATE} label="指示文をコピーする" />
                  </div>
                )}

                {"hasReport" in step && step.hasReport && (
                  <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-xs font-bold text-violet-800">レポートテンプレート</p>
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs leading-relaxed text-slate-700">
                      {REPORT_TEMPLATE}
                    </pre>
                    <CopyButton text={REPORT_TEMPLATE} label="テンプレートをコピーする" />
                  </div>
                )}

                {"link" in step && step.link && (
                  <Link
                    href={step.link.href}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    {step.link.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600">
                  <span className="font-bold text-gray-800">うまくいかないとき：</span>
                  {step.tip}
                </p>
              </div>
            </article>
          ))}
        </section>

        <section id="faq" className="scroll-mt-6 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
            <HelpCircle className="h-5 w-5 text-emerald-600" />
            よくある質問
          </h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-90" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-center text-white sm:p-8">
          <Rocket className="mx-auto h-8 w-8 text-white/90" />
          <h2 className="mt-3 text-lg font-black">準備ができたら、作り始めよう</h2>
          <p className="mt-2 text-sm text-white/85">Step 3 から順番に進めれば、今日中に提出できる形まで持っていけます。</p>
          <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/playground"
              className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
            >
              <Terminal className="h-4 w-4" />
              プレイグラウンドで作る
            </Link>
            <Link
              href="/search"
              className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
            >
              みんなのアプリを見る
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
