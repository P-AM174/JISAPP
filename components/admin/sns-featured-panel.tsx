"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Clapperboard, Plus, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Candidate = { id: string; appNumber: number; title: string; source?: "supabase" | "prisma"; isListed: boolean };
type Item = { id: string; title: string; app_number: number | null };

/**
 * 運営画面：「SNSで紹介したアプリ」（トップページの列・特集ページ /features/sns・ヒーロー）
 * 管理番号かアプリ名で探して追加し、↑↓ で並べ替え、× で外す。「保存」で反映する
 */
export function SnsFeaturedPanel({ candidates, notify }: { candidates: Candidate[]; notify: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [saved, setSaved] = useState<string>("[]");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/sns-featured")
      .then((r) => r.json())
      .then((d: { ready?: boolean; apps?: Item[] }) => {
        setReady(d.ready !== false);
        setItems(d.apps ?? []);
        setSaved(JSON.stringify((d.apps ?? []).map((a) => a.id)));
      })
      .catch(() => {});
  }, []);

  const dirty = JSON.stringify(items.map((a) => a.id)) !== saved;
  // 追加の候補：スタジオのアプリ（出品中）から、管理番号かアプリ名で探す
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const inList = new Set(items.map((a) => a.id));
    return candidates
      .filter((c) => c.source === "supabase" && !inList.has(c.id))
      .filter((c) => String(c.appNumber) === s.replace(/^#/, "") || c.title.toLowerCase().includes(s))
      .slice(0, 8);
  }, [q, candidates, items]);

  const move = (i: number, d: -1 | 1) =>
    setItems((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/sns-featured", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: items.map((a) => a.id) }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      notify(d.error ?? "保存できませんでした");
      return;
    }
    setSaved(JSON.stringify(items.map((a) => a.id)));
    notify("SNSで紹介したアプリを保存しました（トップページ・特集ページに反映）");
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-rose-100 shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <Clapperboard className="h-4 w-4 text-rose-500" />
        <span className="text-sm font-black text-gray-900">SNSで紹介したアプリ</span>
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">{items.length} 件</span>
        <span className="ml-1 hidden text-[11px] text-gray-400 sm:inline">トップページ（日本語）と特集ページ /features/sns に、この順で出ます</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-rose-50 px-4 pb-4 pt-3">
          {!ready && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
              先に Supabase で scripts/add-sns-featured.sql を実行してください。
            </p>
          )}
          <ol className="space-y-1.5">
            {items.map((a, i) => (
              <li key={a.id} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm">
                <span className="w-6 text-center text-xs font-black text-rose-500">{i + 1}</span>
                <span className="text-[11px] font-bold text-gray-400">#{a.app_number ?? "-"}</span>
                <span className="min-w-0 flex-1 truncate font-bold text-gray-800">{a.title}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="上へ" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="下へ" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setItems((list) => list.filter((x) => x.id !== a.id))} aria-label="外す" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button>
              </li>
            ))}
            {items.length === 0 && <li className="rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-400">まだありません。下から追加してください。</li>}
          </ol>
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="追加するアプリを、管理番号かアプリ名で探す"
              className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-rose-300"
            />
            {hits.length > 0 && (
              <ul className="absolute left-0 right-0 top-11 z-20 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-200">
                {hits.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setItems((list) => [...list, { id: c.id, title: c.title, app_number: c.appNumber }]);
                        setQ("");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-rose-50"
                    >
                      <Plus className="h-3.5 w-3.5 text-rose-500" />
                      <span className="text-[11px] font-bold text-gray-400">#{c.appNumber}</span>
                      <span className="truncate font-bold text-gray-800">{c.title}</span>
                      {!c.isListed && <span className="ml-auto shrink-0 text-[10px] text-gray-400">URLのみ</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            {dirty && <span className="text-[11px] font-bold text-amber-600">まだ保存していません</span>}
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving || !ready}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
