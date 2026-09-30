"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Database } from "lucide-react";
import { formatBytes } from "@/lib/app-data-limits";
import { useT } from "@/lib/i18n/client";

export type AppDataUsage = {
  available: boolean;
  usedBytes?: number;
  limitBytes: number;
  warnRatio?: number;
  /** アプリごとの内訳（byApp を付けて取得したとき） */
  apps?: Record<string, number>;
  /** アプリごとの、いちばん大きい保存データ（1回に保存できる量と比べる） */
  appsMaxKey?: Record<string, number>;
  valueLimitBytes?: number;
};

/** 自分の保存容量を取得する。byApp なら、アプリごとの内訳も取る。version を変えると取り直す */
export function useAppDataUsage(enabled = true, byApp = false, version = 0): AppDataUsage | null {
  const [usage, setUsage] = useState<AppDataUsage | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(byApp ? "/api/app-data/usage?byApp=1" : "/api/app-data/usage")
      .then((res) => (res.ok ? (res.json() as Promise<AppDataUsage>) : null))
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, byApp, version]);
  return usage;
}

/**
 * 保存容量メーター（マイページ・マイプロジェクト）。アプリが window.Jisapp で保存したデータの合計（全アプリ分・圧縮後）を表示する。
 * usage を渡すとそれを使い、渡さなければ自分で取得する。
 * 将来の有料プランでは、ここに「容量を増やす」への案内を置く想定。
 */
export function StorageMeter({ usage: given, children }: { usage?: AppDataUsage | null; children?: ReactNode } = {}) {
  const t = useT();
  const fetched = useAppDataUsage(given === undefined);
  const usage = given === undefined ? fetched : given;

  // 集計の準備ができていない・取得できないときは出さない
  if (!usage?.available || usage.usedBytes === undefined) return null;

  const ratio = Math.min(1, usage.usedBytes / usage.limitBytes);
  const warn = ratio > (usage.warnRatio ?? 0.8);
  const full = ratio >= 1;

  return (
    <div id="storage" className="scroll-mt-20 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-700">{t("アプリの保存容量", "App storage")}</h2>
        </div>
        <p className="text-sm font-bold text-gray-900">
          {formatBytes(usage.usedBytes)}
          <span className="font-medium text-gray-400"> / {formatBytes(usage.limitBytes)}</span>
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={full ? "h-full rounded-full bg-rose-500" : warn ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-emerald-500"}
          style={{ width: `${Math.max(ratio * 100, usage.usedBytes > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className={full ? "mt-2 text-xs font-semibold text-rose-600" : warn ? "mt-2 text-xs font-semibold text-amber-700" : "mt-2 text-xs text-gray-400"}>
        {full
          ? t("容量がいっぱいです。使っていないアプリのデータを消すと、また保存できます。", "Your storage is full. Delete data from apps you no longer use to save again.")
          : warn
            ? t("もうすぐいっぱいです。使っていないアプリのデータを消しておくと安心です。", "Almost full. It's safer to delete data from apps you no longer use.")
            : t("ログインして保存したアプリのデータ（全アプリ分）です。文字のデータだけ保存でき、画像・動画は保存できません。", "Data your apps saved while you were signed in (all apps). Only text can be saved — no images or videos.")}
      </p>
      {children}
    </div>
  );
}
