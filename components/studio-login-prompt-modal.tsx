"use client";

import Link from "@/lib/i18n/navigation";
import { useT } from "@/lib/i18n/client";
import { Cloud, LogIn, X, AlertTriangle, BookOpen, FolderOpen } from "lucide-react";
import { rich } from "@/lib/i18n/rich";

type Props = {
  open: boolean;
  action: "save" | "publish";
  onContinue: () => void;
  onClose: () => void;
};

export function StudioLoginPromptModal({ open, action, onContinue, onClose }: Props) {
  const t = useT();
  if (!open) return null;

  const isSave = action === "save";

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
            aria-label={t("閉じる", "Close")}
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">{t("開発スタジオ", "Jisapp Studio")}</p>
          <h2 className="mt-1 text-lg font-black leading-snug">
            {isSave
              ? t("ログインすると、保存したアプリをずっと管理できます", "Sign in to keep and manage the apps you save")
              : t("ログインすると、公開したアプリをずっと管理できます", "Sign in to keep and manage the apps you publish")}
          </h2>
        </div>

        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-700">{t("ログインするとできること", "What you get when you sign in")}</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rich(t("<t0>マイプロジェクト</t0>にクラウド保存（別の端末からも続きを編集）", "Saved to <t0>My projects</t0> in the cloud (keep editing from other devices)"), { t0: (c) => <strong>{c}</strong> })}</span>
              </li>
              <li className="flex gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rich(t("<t0>マイライブラリ</t0>に自動登録（保存機能付きアプリが使える）", "Added to <t0>My library</t0> automatically (apps that save data just work)"), { t0: (c) => <strong>{c}</strong> })}</span>
              </li>
              <li className="flex gap-2">
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rich(t("出品したアプリを<t0>マイページ</t0>から管理", "Manage your published apps from <t0>My page</t0>"), { t0: (c) => <strong>{c}</strong> })}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="flex items-start gap-2 font-bold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {t("ログインしない場合", "If you don't sign in")}
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-800">
              <li>{rich(t("・下書きは<t0>このブラウザだけ</t0>に保存されます。別端末や再インストール後は<t0>続きから編集できません</t0>。", "• Drafts are saved <t0>only in this browser</t0>. You <t0>can’t continue editing</t0> on another device or after reinstalling."), { t0: (c) => <strong>{c}</strong> })}</li>
              <li>{rich(t("・<t0>URLのみ</t0>で公開したアプリは、<t0>2か月間誰も開かないと自動削除</t0>されます（マーケット出品は削除されません）。", "• Apps published <t0>by URL only</t0> are <t0>deleted automatically if nobody opens them for 2 months</t0> (apps listed in the market are kept)."), { t0: (c) => <strong>{c}</strong> })}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/login?callbackUrl=/playground"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white shadow-md hover:bg-emerald-700"
            >
              <LogIn className="h-4 w-4" />
              {t("ログインする", "Sign in")}
            </Link>
            <button
              type="button"
              onClick={onContinue}
              className="rounded-2xl border border-gray-200 bg-gray-50 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100"
            >
              {isSave ? t("ログインせずに保存する", "Save without signing in") : t("ログインせずに公開する", "Publish without signing in")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
