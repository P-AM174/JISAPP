"use client";

import { useT } from "@/lib/i18n/client";

type SecurityNoticeProps = {
  className?: string;
};

export function SecurityNotice({ className = "" }: SecurityNoticeProps) {
  const t = useT();
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ${className}`}
      role="note"
    >
      <p className="font-bold">{t("セキュリティに関するお知らせ", "A note on security")}</p>
      <p className="mt-1">
        {t(
          <>
            外部API（HTTPS）との通信が利用できます。CORSで直接接続できないAPIは{" "}
            <code className="rounded bg-amber-100 px-1">window.Jisapp.fetch(url)</code>{" "}
            をご利用ください。APIキーは「シークレット管理」に登録し、コードでは{" "}
            <code className="rounded bg-amber-100 px-1">{"{ secret: 'NAME' }"}</code>{" "}
            だけ指定してください。コードにキーを直接書くと閲覧者に見える可能性があります。
          </>,
          <>
            Apps can talk to external HTTPS APIs. For APIs that block direct access (CORS), use{" "}
            <code className="rounded bg-amber-100 px-1">window.Jisapp.fetch(url)</code>. Register API keys under
            “Secrets” and only reference them in code as{" "}
            <code className="rounded bg-amber-100 px-1">{"{ secret: 'NAME' }"}</code>. A key written directly in
            the code may be visible to anyone viewing it.
          </>
        )}
      </p>
    </div>
  );
}
