"use client";

import { AlertCircle, Database, Download, X } from "lucide-react";

export type PendingUpdateInfo = {
  code_version: number;
  reset_user_data: boolean;
  app_title: string;
  update_notes?: string | null;
  created_at: string;
  /** 今使っているコードと比べて、データの保存先が変わっているか */
  storage_changed?: boolean;
};

type Props = {
  open: boolean;
  pending: PendingUpdateInfo;
  appTitle: string;
  processing: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function AppUpdateModal({
  open,
  pending,
  appTitle,
  processing,
  onAccept,
  onDecline,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-black text-gray-900">アップデートの確認</h2>
          <button
            type="button"
            onClick={onDecline}
            disabled={processing}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2.5} />
            <div className="text-xs leading-relaxed text-amber-900">
              <p className="font-bold">「{appTitle || pending.app_title}」のコードが変更されました</p>
              <p className="mt-1">
                アップデートすると新しいコードでアプリが動作します。
                {pending.reset_user_data
                  ? " 出品者の設定により、保存していたデータは初期化されます。"
                  : " 保存データは基本的に引き継がれますが、コード変更の内容によっては表示できなくなる場合があります。"}
              </p>
            </div>
          </div>

          {pending.storage_changed && (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" strokeWidth={2.5} />
              <div className="space-y-1.5 text-xs leading-relaxed text-rose-900">
                <p className="font-bold">データの保存先が変更されています</p>
                <p>
                  アップデートすると、これまで保存した内容が失われる可能性が高いです。
                  アプリは保存するデータに名前をつけて管理していますが、新しいコードではその名前や保存場所が
                  変わっているため、これまでのデータをアプリが見つけられません。
                </p>
                <p>
                  残しておきたい内容がある場合は、アップデートする前に画面を確認して控えておくことをおすすめします。
                </p>
              </div>
            </div>
          )}
          {pending.update_notes && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="mb-1.5 text-xs font-bold text-gray-700">更新内容</p>
              <p className="whitespace-pre-line text-xs leading-relaxed text-gray-600">{pending.update_notes}</p>
            </div>
          )}
          <p className="text-xs leading-relaxed text-gray-500">
            「後で」を選ぶと、今まで使っていたバージョンのまま利用できます。いつでもアップデートできます。
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDecline}
              disabled={processing}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              後で
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={processing}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 ${
                pending.storage_changed
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  更新中…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  アップデートする
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
