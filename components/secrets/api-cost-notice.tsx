"use client";

import { useMemo } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/config";
import { detectApiUse } from "@/lib/secrets/detect-api-use";

type ApiCostNoticeProps = {
  /** 公開するアプリのコード */
  code: string;
  /** マーケットに出品するか（false は URL のみ） */
  listed: boolean;
  className?: string;
};

/**
 * 公開設定で出す、外部APIの費用の注意。
 * APIキーを使うアプリは、使われるたびに作った人のキーで呼ぶので、出品・共有で使う人が増えると料金も増えることがある
 */
export function ApiCostNotice({ code, listed, className = "" }: ApiCostNoticeProps) {
  const t = useT();
  const { usesApi, secretNames } = useMemo(() => detectApiUse(code), [code]);
  if (!usesApi) return null;

  const keys = secretNames.length > 0 ? secretNames.join("・") : t("登録したキー", "your registered key");

  // URL のみなら、使えるのは URL を知っている人だけなので、安心してよいことを伝える
  if (!listed) {
    return (
      <div
        role="note"
        className={`rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-950 ${className}`}
      >
        <p className="flex items-start gap-1.5 text-sm font-black">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
          {t("URLのみ発行なら、料金の心配はいりません", "With URL only, you don't need to worry about costs")}
        </p>
        <p className="mt-1.5">
          {format(
            t("このアプリは外部API（{keys}）を使いますが、使えるのはURLを知っている人だけです。知らない人に使われて料金が増えることはありません。", "This app uses an external API ({keys}), but only people with the URL can use it. Strangers won't run up your costs."),
            { keys }
          )}
        </p>
        <p className="mt-1 text-emerald-800">
          {t("※ SNS などで URL を広く共有すると、使う人が増えて料金がかかることがあります。", "* If you share the URL widely (on social media, etc.), more people may use it and you may be charged.")}
        </p>
      </div>
    );
  }

  return (
    <div
      role="note"
      className={`rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950 ${className}`}
    >
      <p className="flex items-start gap-1.5 text-sm font-black">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={2.5} />
        {t("このアプリは外部APIを使います。出品すると、APIの料金が増えることがあります", "This app uses an external API. Listing it may increase your API costs")}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          {format(
            t("アプリが使われるたびに、あなたのAPIキー（{keys}）で外部APIを呼びます。使う人は全員、あなたのキーを使います。", "Every time the app is used, it calls the API with your API key ({keys}). Everyone who uses the app uses your key."),
            { keys }
          )}
        </li>
        <li className="font-bold">
          {t("マーケットに出品すると、知らない人もふくめて使う人が増え、そのぶん料金が増えることがあります。", "Once it's listed in the market, more people (including strangers) may use it, and your costs may go up.")}
        </li>
        <li>
          {t("「URLのみ発行」にすれば、使えるのはURLを知っている人だけになります。", "With “URL only”, only people who have the URL can use it.")}
        </li>
        <li>
          {t("有料のAPIは、使われた分の料金があなたにかかります。無料のAPIも、無料の範囲を超えると止まったり、料金がかかったりします。", "For paid APIs, you pay for what is used. Free APIs may also stop or start charging once you go past the free limit.")}
        </li>
        <li>
          {t("心配なときは、APIのサービスの管理画面で、使える金額や回数の上限を設定しておいてください。", "If you're worried, set a spending or usage limit in the API service's dashboard.")}
        </li>
      </ul>
    </div>
  );
}
