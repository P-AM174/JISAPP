"use client";

import Link from "next/link";
import { Cloud, LogIn, X, AlertTriangle, BookOpen, FolderOpen } from "lucide-react";

type Props = {
  open: boolean;
  action: "save" | "publish";
  onContinue: () => void;
  onClose: () => void;
};

export function StudioLoginPromptModal({ open, action, onContinue, onClose }: Props) {
  if (!open) return null;

  const actionLabel = action === "save" ? "保存" : "公開";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-violet-600 via-emerald-600 to-teal-600 px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 hover:bg-white/30"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">開発スタジオ</p>
          <h2 className="mt-1 text-lg font-black leading-snug">
            ログインすると、{actionLabel}したアプリをずっと管理できます
          </h2>
        </div>

        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-700">ログインするとできること</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span><strong>マイプロジェクト</strong>にクラウド保存（別の端末からも続きを編集）</span>
              </li>
              <li className="flex gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span><strong>マイライブラリ</strong>に自動登録（保存機能付きアプリが使える）</span>
              </li>
              <li className="flex gap-2">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>出品したアプリを<strong>マイページ</strong>から管理</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="flex items-start gap-2 font-bold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ログインしない場合
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-800">
              <li>・下書きは<strong>このブラウザだけ</strong>に保存されます。別端末や再インストール後は<strong>続きから編集できません</strong>。</li>
              <li>・<strong>URLのみ</strong>で公開したアプリは、<strong>2か月間誰も開かないと自動削除</strong>されます（マーケット出品は削除されません）。</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/login?callbackUrl=/playground"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700"
            >
              <LogIn className="h-4 w-4" />
              ログインする
            </Link>
            <button
              type="button"
              onClick={onContinue}
              className="rounded-2xl border border-gray-200 bg-gray-50 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100"
            >
              ログインせずに{actionLabel}する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
