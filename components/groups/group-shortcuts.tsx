"use client";

import { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { listLocalSessions } from "@/lib/groups/client";
import { useT } from "@/lib/i18n/client";

type Shortcut = { id: string; name: string };

/**
 * アプリのモーダル（一覧・マイライブラリ）に出す、グループへの近道。
 * この端末で参加したグループと、ログインして参加・作成したグループがあれば
 * 「（グループ名）のアプリを開く」と「別のグループを作る」を出す。なければ何も出さない
 */
export function GroupShortcuts({
  appId,
  onNavigate,
  onHasGroups,
}: {
  appId: string;
  /** 移動するとき（モーダルを閉じる・ページを移る） */
  onNavigate: (path: string) => void;
  /** グループがあるかどうか（呼び出し側で「グループを作る」を出すかの判断に使う） */
  onHasGroups?: (has: boolean) => void;
}) {
  const t = useT();
  const { status } = useSession();
  const [groups, setGroups] = useState<Shortcut[]>([]);

  useEffect(() => {
    const local: Shortcut[] = listLocalSessions(appId).map((s) => ({ id: s.groupId, name: s.groupName }));
    setGroups(local);
    if (status !== "authenticated") return;
    let cancelled = false;
    void fetch(`/api/app-groups?appId=${encodeURIComponent(appId)}`)
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d: { groups?: { id: string; name: string }[] }) => {
        if (cancelled) return;
        const merged = [...local];
        for (const g of d.groups ?? []) if (!merged.some((m) => m.id === g.id)) merged.push({ id: g.id, name: g.name });
        setGroups(merged);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [appId, status]);

  useEffect(() => {
    onHasGroups?.(groups.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-2">
      {groups.slice(0, 3).map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onNavigate(`/apps/${appId}?group=${encodeURIComponent(g.id)}`)}
          className="flex w-full items-center gap-3 rounded-xl bg-sky-600 px-4 py-2.5 text-left text-white shadow-md shadow-sky-200 transition-all hover:bg-sky-700 active:scale-[0.98]"
        >
          <Users className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black">{g.name}</span>
            <span className="block text-[11px] font-semibold text-sky-100">{t("このグループのアプリを開く", "Open the app in this group")}</span>
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => onNavigate(`/apps/${appId}?create=1`)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200 transition-colors hover:bg-sky-50"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("別のグループを作る", "Create another group")}
      </button>
    </div>
  );
}
