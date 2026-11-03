"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, PenLine, Plus } from "lucide-react";
import Link, { useRouter } from "@/lib/i18n/navigation";
import { JisappLogo } from "@/components/jisapp-logo";
import { AdminMenu } from "@/components/admin/admin-menu";
import { AdminLogin } from "@/components/columns/admin-gate";
import type { Column } from "@/lib/columns/types";

function when(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** コラムの一覧（管理者だけ）。ここから新しく書く */
export default function AdminColumnsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/columns");
    if (res.status === 401) { setAuthed(false); return; }
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "読み込めませんでした（コラムの表がまだないかもしれません。scripts/add-columns.sql を実行してください）"); setAuthed(true); return; }
    setColumns(data.columns ?? []);
    setAuthed(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setCreating(true);
    const res = await fetch("/api/admin/columns", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (res.ok && data.id) router.push(`/admin/columns/${data.id}`);
    else setError(data.error ?? "作れませんでした（scripts/add-columns.sql を実行しましたか？）");
  };

  if (authed === null) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;
  if (!authed) return <AdminLogin title="コラム" onDone={load} />;

  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <JisappLogo href="/" />
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-700">コラム</span>
          <AdminMenu className="ml-auto" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <button onClick={create} disabled={creating} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-base font-bold text-white shadow-md active:scale-[.99] disabled:opacity-60">
          {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <PenLine className="h-5 w-5" />}新しく書く
        </button>
        {error && <p className="mt-3 whitespace-pre-line rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</p>}
        <div className="mt-6 space-y-2">
          {columns.length === 0 && !error && (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400 ring-1 ring-black/5">
              <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />まだ記事がありません
            </div>
          )}
          {columns.map((c) => (
            <Link key={c.id} href={`/admin/columns/${c.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition hover:ring-emerald-200">
              {c.coverImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={c.coverImage} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                : <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100"><FileText className="h-5 w-5 text-gray-300" /></div>}
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-gray-900">{c.title || "（タイトルなし）"}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <span className={`rounded-full px-2 py-0.5 font-bold ${c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c.status === "published" ? "公開中" : "下書き"}</span>
                  {c.locale === "en" && <span className="rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-700">英語</span>}
                  <span>{when(c.updatedAt)} 更新</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <button onClick={create} aria-label="新しく書く" className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg sm:hidden"><Plus className="h-6 w-6" /></button>
    </div>
  );
}
