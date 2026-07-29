import { SecurityNotice } from "@/components/security-notice";
import { JisappLogo } from "@/components/jisapp-logo";
import Link from "next/link";

export default function TermsPage() {
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
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <h1 className="text-2xl font-black text-gray-900">利用規約</h1>
        <SecurityNotice />
        <section className="space-y-3 text-sm leading-relaxed text-gray-700">
          <p>
            ジサップ（Zisup）は個人開発のアプリ・ツールを共有・配布するプラットフォームです。
            本サービスのご利用にあたり、以下の内容に同意いただいたものとみなします。
          </p>
          <h2 className="text-base font-bold text-gray-900">アプリ実行環境について</h2>
          <p>
            アプリはサンドボックス内で実行されます。外部API（HTTPS）への通信が可能です。
            CORSで直接接続できない場合は window.Zisup.fetch を利用してください。
            ブラウザ内で完結するツール、外部API連携、window.Zisup API によるデータ保存が利用できます。
          </p>
          <h2 className="text-base font-bold text-gray-900">出品・購入</h2>
          <p>
            出品物のソースコードは、購入完了後または無料公開の条件を満たした場合にのみ配布されます。
            有料商品のコードを不正に取得・再配布する行為は禁止します。
          </p>
        </section>
      </main>
    </div>
  );
}
