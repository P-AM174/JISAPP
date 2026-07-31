type SecurityNoticeProps = {
  className?: string;
};

export function SecurityNotice({ className = "" }: SecurityNoticeProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ${className}`}
      role="note"
    >
      <p className="font-bold">セキュリティに関するお知らせ</p>
      <p className="mt-1">
        外部API（HTTPS）との通信が利用できます。CORSで直接接続できないAPIは{" "}
        <code className="rounded bg-amber-100 px-1">window.Zisup.fetch(url)</code>{" "}
        をご利用ください。APIキーは「シークレット管理」に登録し、コードでは{" "}
        <code className="rounded bg-amber-100 px-1">{"{ secret: 'NAME' }"}</code>{" "}
        だけ指定してください。コードにキーを直接書くと閲覧者に見える可能性があります。
      </p>
    </div>
  );
}
