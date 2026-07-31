"use client";

import { AlertTriangle, Key, X } from "lucide-react";
import type { EmbeddedSecretFinding } from "@/lib/playground/detect-embedded-secrets";

type Props = {
  open: boolean;
  findings: EmbeddedSecretFinding[];
  onClose: () => void;
  onOpenSecrets: () => void;
  onProceed: () => void;
};

export function EmbeddedSecretWarningModal({
  open,
  findings,
  onClose,
  onOpenSecrets,
  onProceed,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-black text-gray-900">APIキーがコードに含まれています</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-xs leading-relaxed text-amber-900">
              <p className="font-bold">公開すると、アプリを開いた人がキーを使える可能性があります</p>
              <p className="mt-1">
                URLのみ発行でも、コードは配信されます。キーが埋め込まれていると、他人の利用や不正利用の原因になります。
              </p>
            </div>
          </div>
          {findings.length > 0 && (
            <ul className="space-y-1 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-700">
              {findings.map((f) => (
                <li key={f.label}>・{f.label}</li>
              ))}
            </ul>
          )}
          <p className="text-xs leading-relaxed text-gray-600">
            「APIキー」にキーを登録し、コードでは{" "}
            <code className="rounded bg-gray-100 px-1">secret: &apos;NAME&apos;</code>{" "}
            だけ指定する方法が安全です。
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenSecrets}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700"
            >
              <Key className="h-4 w-4" />
              APIキーを開く
            </button>
            <button
              type="button"
              onClick={onProceed}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              理解したうえでこのまま公開する
            </button>
            <button type="button" onClick={onClose} className="text-center text-xs text-gray-400 hover:text-gray-600">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
