"use client";

import { Heart } from "lucide-react";
import { CATEGORY_MAP, categoryName } from "@/lib/categories";
import { OFFICIAL_CREATOR_NAME } from "@/lib/agent/official-creator";
import { useLocale, useT } from "@/lib/i18n/client";
import { CategoryIcon } from "@/lib/category-icon";
import { MiniPreview } from "./mini-preview";
import { GroupAppBadge } from "./group-app-badge";
import { AppLangTag } from "./app-lang-tag";
import { catalogToModalApp, displayCreatorName } from "./utils";
import type { CatalogCardApp, ModalApp } from "./types";

export function CatalogAppCard({
  app,
  onSelect,
  compact = false,
}: {
  app: CatalogCardApp;
  onSelect: (app: ModalApp) => void;
  compact?: boolean;
}) {
  const cat = app.category ? CATEGORY_MAP[app.category] : null;
  const gradient = cat?.gradient ?? "from-emerald-500 to-teal-600";
  const tagColor = cat?.tagColor ?? "bg-gray-100 text-gray-500";
  const locale = useLocale();
  const t = useT();
  const modalApp = catalogToModalApp(app, locale);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onSelect(modalApp)}
        className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all hover:shadow-md hover:ring-emerald-300 text-left w-full"
      >
        <div className="relative">
          <MiniPreview id={app.id} fallbackGradient={gradient} fallbackCategoryId={app.category} />
          {app.group_sharing && <GroupAppBadge />}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="font-bold text-sm text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1">
            {app.title}
          </p>
          {app.description && (
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{app.description}</p>
          )}
          <div className="mt-auto flex items-center gap-1.5 pt-1.5 flex-wrap">
            {cat && (
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tagColor}`}>
                <CategoryIcon categoryId={cat.id} className="h-3 w-3" />
                {categoryName(cat, locale)}
              </span>
            )}
            <AppLangTag title={app.title} description={app.description} className="ml-auto" />
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 ml-auto">
              FREE
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(modalApp)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/60 hover:ring-emerald-200 text-left w-full"
    >
      <div className="relative">
        <MiniPreview id={app.id} fallbackGradient={gradient} fallbackCategoryId={app.category} height={140} />
        {app.group_sharing && <GroupAppBadge className="right-2.5 px-2.5 text-[11px]" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="flex items-center gap-1.5">
          <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
            {cat ? categoryName(cat, locale) : app.category ?? t("その他", "Other")}
          </span>
          <AppLangTag title={app.title} description={app.description} />
        </span>
        <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700 line-clamp-2">
          {app.title}
        </h3>
        {app.description && (
          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">{app.description}</p>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2.5">
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-gray-400">
            <span className="truncate">by {displayCreatorName(app.creator_name, locale)}</span>
            {app.creator_name === OFFICIAL_CREATOR_NAME && (
              <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                {t("公式", "Official")}
              </span>
            )}
          </span>
          {(app.stamp_count ?? 0) > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-emerald-600">
              <Heart className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              {app.stamp_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
