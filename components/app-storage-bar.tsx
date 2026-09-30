"use client";

import { Database, Trash2 } from "lucide-react";
import { APP_DATA_LIMITS, formatBytes } from "@/lib/app-data-limits";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * アプリ1つ分の保存データの横棒グラフ（マイプロジェクトのカード・マイライブラリの詳細シート）。
 * 上限はアプリごとではなく「1回（1つの識別名）に保存できる量 2MB」なので、
 * 棒はいちばん大きい保存データがその 2MB のどこまで来ているかを表す。合計は文字で添える
 */
export function AppStorageBar({
  bytes,
  maxKeyBytes,
  limitBytes = APP_DATA_LIMITS.valueBytes,
  onDelete,
  className,
}: {
  /** このアプリに保存しているデータの合計 */
  bytes: number;
  /** いちばん大きい保存データ */
  maxKeyBytes: number;
  limitBytes?: number;
  /** 渡すと「データを消す」ボタンを出す */
  onDelete?: () => void;
  className?: string;
}) {
  const t = useT();
  const ratio = Math.min(1, maxKeyBytes / limitBytes);
  const warn = ratio > APP_DATA_LIMITS.warnRatio;
  const full = ratio >= 1;

  return (
    <div className={cn("rounded-xl bg-gray-50 px-3 py-2.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-gray-600">
          <Database className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">{t("このアプリの保存データ", "Data saved in this app")}</span>
        </span>
        <span className="shrink-0 font-bold text-gray-900">
          {formatBytes(maxKeyBytes)}
          <span className="font-medium text-gray-400"> / {formatBytes(limitBytes)}</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full", full ? "bg-rose-500" : warn ? "bg-amber-500" : "bg-emerald-500")}
          style={{ width: `${Math.max(ratio * 100, maxKeyBytes > 0 ? 2 : 0)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-2">
        <p className={cn("text-[10px] leading-snug", full ? "font-semibold text-rose-600" : warn ? "font-semibold text-amber-700" : "text-gray-400")}>
          {full
            ? t("1回に保存できる量を超えています。このままでは保存できません", "Over the amount that can be saved at once. Saving will fail")
            : warn
              ? t("もうすぐ1回に保存できる量に届きます", "Almost at the amount that can be saved at once")
              : t("1回に保存できる量（2MB）に対して", "Compared with the amount that can be saved at once (2MB)")}
          {bytes !== maxKeyBytes && (
            <span className="text-gray-400">{t(`・合計 ${formatBytes(bytes)}`, ` · ${formatBytes(bytes)} in total`)}</span>
          )}
        </p>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 className="h-3 w-3" />
            {t("データを消す", "Delete data")}
          </button>
        )}
      </div>
    </div>
  );
}
