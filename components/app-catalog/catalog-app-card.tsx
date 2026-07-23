"use client";

import { CATEGORY_MAP } from "@/lib/categories";
import { MiniPreview } from "./mini-preview";
import { catalogToModalApp } from "./utils";
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
  const emoji = cat?.emoji ?? "✨";
  const tagColor = cat?.tagColor ?? "bg-gray-100 text-gray-500";
  const tagName = cat ? `${cat.emoji} ${cat.name}` : null;
  const modalApp = catalogToModalApp(app);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onSelect(modalApp)}
        className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all hover:shadow-md hover:ring-emerald-300 text-left w-full"
      >
        <MiniPreview id={app.id} fallbackGradient={gradient} fallbackEmoji={emoji} />
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="font-bold text-sm text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-1">
            {app.title}
          </p>
          {app.description && (
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{app.description}</p>
          )}
          <div className="mt-auto flex items-center gap-1.5 pt-1.5 flex-wrap">
            {tagName && (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tagColor}`}>
                {tagName}
              </span>
            )}
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
      <MiniPreview id={app.id} fallbackGradient={gradient} fallbackEmoji={emoji} height={140} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
          {cat?.name ?? app.category ?? "その他"}
        </span>
        <h3 className="text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700 line-clamp-2">
          {app.title}
        </h3>
        {app.description && (
          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-gray-500">{app.description}</p>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2.5">
          <span className="text-xs text-gray-400 truncate">by {app.creator_name ?? "匿名"}</span>
          {(app.stamp_count ?? 0) > 0 && (
            <span className="shrink-0 text-[11px] font-bold text-emerald-600">⚡ {app.stamp_count}</span>
          )}
        </div>
      </div>
    </button>
  );
}
