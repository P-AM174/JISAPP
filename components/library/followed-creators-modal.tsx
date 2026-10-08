"use client";

import { useEffect } from "react";
import Link from "@/lib/i18n/navigation";
import { ChevronRight, UserRound, X } from "lucide-react";
import { displayCreatorName, getCreatorProfilePath } from "@/components/app-catalog/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/config";
import { CreatorAvatarContent } from "@/components/creator-avatar";

/** フォローしている作者の一覧（マイライブラリ上部の「フォロー中」をタップしたとき） */
export function FollowedCreatorsModal({ names, onClose }: { names: string[]; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("フォロー中の作者", "Creators you follow")}
        className="flex max-h-[80dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-black text-gray-900">
            {format(t("フォロー中の作者（{count}人）", "Creators you follow ({count})"), { count: names.length })}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("閉じる", "Close")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {names.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <UserRound className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              {t("まだ誰もフォローしていません。アプリの詳細から作者をフォローできます。", "You aren't following anyone yet. You can follow creators from an app's details.")}
            </p>
          </div>
        ) : (
          <ul className="overflow-y-auto p-2">
            {names.map((name) => (
              <li key={name}>
                <Link
                  href={getCreatorProfilePath(name)}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-emerald-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-black text-white">
                    <CreatorAvatarContent name={name} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">{displayCreatorName(name, locale)}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
