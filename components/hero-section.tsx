import Link from "next/link";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 py-12 sm:px-12 sm:py-16">
        {/* 背景の装飾 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -right-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 -left-8 h-32 w-32 rounded-full bg-emerald-300/20 blur-xl" />
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            ジサップ 開発スタジオ
          </span>

          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
            AIにコードを作ってもらって、<br className="hidden sm:block" />
            <span className="text-emerald-200">貼るだけで公開できる</span>
          </h1>

          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            サーバー設定もデータベースも不要。使い慣れたAI（ChatGPT・Claude など）でコードを生成して、ここに貼り付けるだけでアプリが完成します。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl active:scale-95"
            >
              無料で作ってみる →
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              アプリを探す
            </Link>
          </div>

          {/* 安心バッジ */}
          <div className="mt-8 flex flex-wrap gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1">✓ プログラミング知識不要</span>
            <span className="flex items-center gap-1">✓ サーバー・DB設定ゼロ</span>
            <span className="flex items-center gap-1">✓ AIが生成したコードをそのまま貼るだけ</span>
          </div>
        </div>
      </div>
    </section>
  );
}
