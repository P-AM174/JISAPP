"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Copy, ExternalLink, LifeBuoy, Mail, Send, X } from "lucide-react";
import { stuckDeliveryEmail } from "@/lib/admin/stuck-email";
import { copyText } from "@/lib/playground/ai-launch";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  prompt: string;
  locale: string | null;
  requested: boolean;
  resolved: boolean;
  status: "open" | "made" | "emailed" | "skipped";
  app_id: string | null;
  emailed_at: string | null;
  created_at: string;
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/**
 * 運営画面：「あきらめたプロンプト」
 * 開発スタジオでプロンプトを貼ったまま、アプリにならなかった人の文章。運営がアプリにして、本人にメールで届ける。
 * 流れ：プロンプトをコピー → AI でコードにする → コードを貼って「本人のアプリとして URL を発行」→ メールを送る
 */
export function StuckPromptsPanel({ notify }: { notify: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(true);
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(() => {
    fetch("/api/admin/stuck")
      .then((r) => r.json())
      .then((d: { ready?: boolean; items?: Item[] }) => {
        setReady(d.ready !== false);
        setItems(d.items ?? []);
      })
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const waiting = items.filter((i) => i.status === "open").length;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-violet-100 shadow-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <LifeBuoy className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-black text-gray-900">あきらめたプロンプト</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", waiting ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600")}>未対応 {waiting} 件</span>
        <span className="ml-1 hidden text-[11px] text-gray-400 sm:inline">プロンプトを貼ったまま、アプリにならなかった人。運営がアプリにしてメールで届ける</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-violet-50 px-4 pb-4 pt-3">
          {!ready && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">先に Supabase で scripts/add-claim-and-stuck-prompts.sql を実行してください。</p>
          )}
          {ready && items.length === 0 && <p className="text-xs text-gray-400">まだありません。</p>}
          {items.map((it) => (
            <StuckItem key={it.id} item={it} notify={notify} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function StuckItem({ item, notify, onChanged }: { item: Item; notify: (msg: string) => void; onChanged: () => void }) {
  const [full, setFull] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const lang = (item.locale === "en" || item.locale === "vi" ? item.locale : "ja") as "ja" | "en" | "vi";
  const tpl = stuckDeliveryEmail(lang, item.name);
  const [subject, setSubject] = useState(tpl.subject);
  const [text, setText] = useState(tpl.text);
  const appUrl = item.app_id ? `/apps/${item.app_id}` : null;

  const act = async (payload: Record<string, unknown>, done: string) => {
    setBusy(true);
    const res = await fetch(`/api/admin/stuck/${item.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      notify(d.error ?? "できませんでした");
      return;
    }
    notify(done);
    onChanged();
  };

  return (
    <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="font-bold text-gray-500">{fmt(item.created_at)}</span>
        <span className="font-bold text-gray-800">{item.name ?? (item.user_id ? "（名前なし）" : "ゲスト")}</span>
        <span className="text-gray-400">{item.email ?? ""}</span>
        {item.requested ? (
          <span className="rounded-full bg-violet-600 px-2 py-0.5 font-bold text-white">本人が頼んだ</span>
        ) : (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 font-bold text-gray-600">自動で記録</span>
        )}
        {item.status === "made" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">作成済み・メール未送信</span>}
        {item.status === "emailed" && <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-bold text-white">メール送信済み {item.emailed_at ? fmt(item.emailed_at) : ""}</span>}
        {item.resolved && item.requested && <span className="rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-700">そのあと自分でも動かせた</span>}
      </div>
      <p className={cn("mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-700", !full && "line-clamp-4")}>{item.prompt}</p>
      <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] font-bold">
        <button type="button" onClick={() => setFull((v) => !v)} className="text-gray-500 hover:text-gray-800">{full ? "閉じる" : "全文を見る"}</button>
        <button type="button" onClick={() => void copyText(item.prompt).then((ok) => notify(ok ? "プロンプトをコピーしました" : "コピーできませんでした"))} className="flex items-center gap-1 text-violet-700 hover:text-violet-900">
          <Copy className="h-3 w-3" />プロンプトをコピー
        </button>
        {item.status === "open" && (
          <button type="button" onClick={() => void act({ action: "skip" }, "対応しないにしました")} className="flex items-center gap-1 text-gray-400 hover:text-rose-600">
            <X className="h-3 w-3" />対応しない
          </button>
        )}
        {appUrl && (
          <a href={appUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900">
            <ExternalLink className="h-3 w-3" />作ったアプリを開く
          </a>
        )}
      </div>

      {item.status === "open" && (
        <div className="mt-3 space-y-2 rounded-lg bg-white p-2.5 ring-1 ring-gray-200">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="アプリ名" className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-violet-300" />
          <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={4} spellCheck={false} placeholder="AI が書いたコードをここに貼る" className="w-full resize-y rounded-lg border border-gray-200 bg-slate-950 p-2.5 font-mono text-[11px] text-amber-100 outline-none" />
          <button
            type="button"
            disabled={busy || !code.trim() || !title.trim()}
            onClick={() => void act({ action: "deliver", html: code, title }, "本人のアプリとして URL を発行しました。次はメールを送ってください")}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {item.user_id ? "本人のアプリとして URL を発行（マーケットには出さない）" : "アプリの URL を発行（ゲストのため、本人のマイプロジェクトには入りません）"}
          </button>
        </div>
      )}

      {item.status === "made" && (
        <div className="mt-3 space-y-2 rounded-lg bg-white p-2.5 ring-1 ring-gray-200">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs font-bold outline-none focus:border-violet-300" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} maxLength={5000} className="w-full resize-y rounded-lg border border-gray-200 p-2.5 text-xs leading-relaxed outline-none focus:border-violet-300" />
          <p className="text-[10px] text-gray-400">本文の {"{link}"} は、送るときにアプリの URL に置き換わります。送り先：{item.email ?? "本人の登録メール"}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act({ action: "email", subject, text }, "メールを送りました")}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Mail className="h-3.5 w-3.5" />
            メールを送る
          </button>
        </div>
      )}
    </div>
  );
}
