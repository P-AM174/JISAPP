"use client";

import { AlertTriangle, Database, X } from "lucide-react";
import type { StorageChangeFinding } from "@/lib/playground/detect-storage-keys";

type Props = {
  open: boolean;
  findings: StorageChangeFinding[];
  onClose: () => void;
  onProceed: () => void;
  /** 「データをリセット」を自動でオンにする案内付きで進む */
  onProceedWithReset?: () => void;
};

export function StorageChangeWarningModal({
  open,
  findings,
  onClose,
  onProceed,
  onProceedWithReset,
}: Props) {
  if (!open) return null;

  const warnings = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-black text-gray-900">
            <Database className="h-5 w-5 shrink-0 text-amber-600" strokeWidth={2.5} />
            保存データが消える可能性があります
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2.5} />
            <p className="text-xs leading-relaxed text-amber-900">
              コードのアップデートで、データの保存先（識別名や保存方法）が変わっています。
              このまま上書きすると、ユーザーがこれまで保存したデータが読めなくなることがあります。
            </p>
          </div>

          {warnings.length > 0 && (
            <ul className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
              {warnings.map((f) => (
                <li key={f.title} className="text-xs leading-relaxed text-amber-950">
                  <p className="font-bold">{f.title}</p>
                  <p className="mt-0.5 text-amber-800">{f.detail}</p>
                </li>
              ))}
            </ul>
          )}

          {infos.length > 0 && (
            <ul className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              {infos.map((f) => (
                <li key={f.title} className="text-xs leading-relaxed text-gray-700">
                  <p className="font-bold">{f.title}</p>
                  <p className="mt-0.5 text-gray-500">{f.detail}</p>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs leading-relaxed text-gray-600">
            識別名を以前と同じに戻すか、意図した変更なら「アップデート時にデータをリセット」を選んでユーザーに案内してください。
          </p>

          <div className="flex flex-col gap-2">
            {onProceedWithReset && (
              <button
                type="button"
                onClick={onProceedWithReset}
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700"
              >
                データリセット付きでこのまま公開する
              </button>
            )}
            <button
              type="button"
              onClick={onProceed}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              理解したうえでこのまま公開する
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-center text-xs text-gray-400 hover:text-gray-600"
            >
              コードを見直す
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
