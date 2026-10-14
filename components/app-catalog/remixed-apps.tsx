"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/i18n/navigation";
import { Sparkles } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icon";
import { CATEGORY_MAP } from "@/lib/categories";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type Remix = { id: string; title: string; category: string | null; creator_name: string | null };

/**
 * 「このアプリをもとに作られたアプリ」（もとのアプリの詳しい表示の下に横に並べる）。
 * トップの新着には出さない代わりに、ここで見つけてもらう。1件もなければ何も出さない
 */
export function RemixedApps({ appId }: { appId: string }) {
  const t = useT();
  const [apps, setApps] = useState<Remix[]>([]);

  useEffect(() => {
    setApps([]);
    if (!/^[0-9a-f-]{36}$/i.test(appId)) return;
    let cancelled = false;
    fetch(`/api/apps/${appId}/remixes`)
      .then((r) => r.json())
      .then((d: { apps?: Remix[] }) => {
        if (!cancelled) setApps(d.apps ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [appId]);

  if (apps.length === 0) return null;

  return (
    <div className="mt-1 border-t border-gray-100 pt-4">
      <p className="mb-2.5 flex items-center gap-1.5 px-0.5 text-sm font-black text-gray-900">
        <Sparkles className="h-4 w-4 text-violet-500" />
        {t("このアプリをもとに作られたアプリ", "Apps built from this one")}
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-600">{apps.length}</span>
      </p>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {apps.map((a) => (
          <Link
            key={a.id}
            href={`/apps/${a.id}`}
            className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200"
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white", CATEGORY_MAP[a.category ?? ""]?.gradient ?? "from-violet-500 to-fuchsia-500")}>
              <CategoryIcon categoryId={a.category} className="h-5 w-5" />
            </span>
            <span className="line-clamp-2 text-xs font-bold leading-snug text-gray-900">{a.title}</span>
            <span className="truncate text-[11px] text-gray-400">{format(t("作：{name}", "by {name}"), { name: a.creator_name || t("ゲスト", "Guest") })}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
