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
        ※初期バージョンのジサップでは、セキュリティのため外部APIとの通信（fetch/axios等）を行うアプリは動作しないか、審査対象外となります。ブラウザ内で完結するツールや、window.Zisup
        APIを用いた保存機能をご利用ください。
      </p>
    </div>
  );
}
