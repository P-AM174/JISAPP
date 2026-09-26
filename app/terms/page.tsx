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
          <h2 id="groups" className="scroll-mt-6 text-base font-bold text-gray-900">
            グループ共有機能について
          </h2>
          <p>
            グループ共有機能は、アプリのデータを招待したメンバーと共有する機能です。ご利用にあたり、次の点に同意いただいたものとみなします。
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              グループはログインしたユーザーが作成できます。作成したユーザー（以下「作成者」）は、招待リンクの作り直しとグループの削除ができます。
            </li>
            <li>
              招待リンクを知っている人は、ログインせずに表示名を入力するだけでグループに参加できます。招待リンクの管理は作成者の責任で行ってください。意図しない人に知られた場合は、招待リンクを作り直してください（古いリンクは使えなくなります。参加済みのメンバーは引き続き利用できます）。
            </li>
            <li>
              グループで共有したデータは、そのグループのメンバー全員が閲覧・書き込みできます。メンバーは自分が書き込んだ項目を、作成者はすべての項目を削除できます。
            </li>
            <li>
              住所・電話番号・パスワードなどの重要な個人情報や、他人の個人情報を本人の同意なく書き込まないでください。共有した内容について、運営は責任を負いません。
            </li>
            <li>
              ログインせずに参加した場合、参加の情報はご利用の端末のブラウザに保存されます。ブラウザのデータを消したり別の端末を使ったりすると、もう一度招待リンクから参加する必要があり、以前の書き込みを編集・削除できなくなることがあります。
            </li>
            <li>
              グループを削除すると、共有データもすべて削除され、元に戻せません。運営は共有データのバックアップを保証しません。
            </li>
            <li>
              共有できるデータの量には上限があります。法令や本規約に反する利用、迷惑行為、その他運営が不適切と判断した利用があった場合、運営は予告なくグループや共有データを削除することがあります。
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
