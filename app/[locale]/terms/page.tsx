import { SecurityNotice } from "@/components/security-notice";
import { JisappLogo } from "@/components/jisapp-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "@/lib/i18n/navigation";
import { getI18n } from "@/lib/i18n/server";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await getI18n(params);
  return (
    <div className="min-h-screen bg-[#f3f4f2]">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <JisappLogo href="/" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/" className="text-sm text-gray-500 hover:text-emerald-600">
              {t("トップへ", "Home")}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <h1 className="text-2xl font-black text-gray-900">{t("利用規約", "Terms of Service")}</h1>
        {locale === "en" && (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-600">
            This is an English translation provided for convenience. If there is any difference between this translation
            and the{" "}
            <a href="/ja/terms" lang="ja" className="font-semibold text-emerald-700 underline underline-offset-2">
              Japanese version
            </a>
            , the Japanese version prevails.
          </p>
        )}
        <SecurityNotice />
        {locale === "en" ? <TermsEn /> : <TermsJa />}
      </main>
    </div>
  );
}

function TermsJa() {
  return (
    <section className="space-y-3 text-sm leading-relaxed text-gray-700">
      <p>
        ジサップ（Jisapp）は個人開発のアプリ・ツールを共有・配布するプラットフォームです。
        本サービスのご利用にあたり、以下の内容に同意いただいたものとみなします。
      </p>
      <h2 className="text-base font-bold text-gray-900">アプリ実行環境について</h2>
      <p>
        アプリはサンドボックス内で実行されます。外部API（HTTPS）への通信が可能です。
        CORSで直接接続できない場合は window.Jisapp.fetch を利用してください。
        ブラウザ内で完結するツール、外部API連携、window.Jisapp API によるデータ保存が利用できます（以前の名前 window.Zisup も使えます）。
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
          180日間だれにも使われていないグループは、共有データごと自動で削除されます。
        </li>
        <li>
          作成者はメンバーをグループから外せます。外されたメンバーは、そのグループのデータを見たり書き込んだりできなくなります（それまでの書き込みは「退出したメンバー」として残ります）。
        </li>
        <li>
          共有できるデータの量には上限があります。法令や本規約に反する利用、迷惑行為、その他運営が不適切と判断した利用があった場合、運営は予告なくグループや共有データを削除することがあります。
        </li>
      </ul>
    </section>
  );
}

function TermsEn() {
  return (
    <section className="space-y-3 text-sm leading-relaxed text-gray-700">
      <p>
        Jisapp is a platform for sharing and distributing apps and tools made by individuals. By using this service, you
        are deemed to have agreed to the following.
      </p>
      <h2 className="text-base font-bold text-gray-900">The app environment</h2>
      <p>
        Apps run inside a sandbox and can communicate with external APIs over HTTPS. If an API can&apos;t be reached
        directly because of CORS, use window.Jisapp.fetch. You can build tools that run entirely in the browser,
        connect to external APIs, and save data with the window.Jisapp API (the older name window.Zisup also works).
      </p>
      <h2 className="text-base font-bold text-gray-900">Publishing and purchasing</h2>
      <p>
        The source code of a listing is distributed only after purchase is complete or when the conditions for free
        publication are met. Obtaining or redistributing the code of paid items without authorization is prohibited.
      </p>
      <h2 id="groups" className="scroll-mt-6 text-base font-bold text-gray-900">
        Group sharing
      </h2>
      <p>
        Group sharing lets you share an app&apos;s data with members you invite. By using it, you are deemed to have
        agreed to the following.
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Groups can be created by signed-in users. The user who creates a group (the &quot;creator&quot;) can make a
          new invite link and delete the group.
        </li>
        <li>
          Anyone who knows the invite link can join the group without signing in, just by entering a display name. The
          creator is responsible for managing the invite link. If it becomes known to people you didn&apos;t intend,
          make a new invite link (the old link stops working; members who already joined can keep using the group).
        </li>
        <li>
          Data shared in a group can be viewed and written by every member of that group. Members can delete the items
          they wrote, and the creator can delete any item.
        </li>
        <li>
          Do not post important personal information such as addresses, phone numbers or passwords, or other
          people&apos;s personal information without their consent. Jisapp is not responsible for shared content.
        </li>
        <li>
          If you join without signing in, your membership is saved in the browser on your device. If you clear your
          browser data or use another device, you&apos;ll need to join again from the invite link, and you may no
          longer be able to edit or delete what you wrote before.
        </li>
        <li>
          Deleting a group also deletes all of its shared data, and this can&apos;t be undone. Jisapp does not
          guarantee backups of shared data.
        </li>
        <li>Groups that nobody has used for 180 days are deleted automatically, together with their shared data.</li>
        <li>
          The creator can remove members from the group. Removed members can no longer view or write the group&apos;s
          data (their earlier posts remain, shown as a &quot;member who left&quot;).
        </li>
        <li>
          There is a limit on how much data can be shared. If a group is used in violation of the law or these terms,
          for nuisance, or in any other way Jisapp considers inappropriate, Jisapp may delete the group or its shared
          data without notice.
        </li>
      </ul>
    </section>
  );
}
