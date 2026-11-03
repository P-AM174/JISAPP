"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import {
  AppWindow, ArrowLeft, Bold, Check, ChevronLeft, Copy, ExternalLink, Eye, Heading2, Heading3, ImagePlus, Link2,
  List, ListOrdered, Loader2, Minus, MousePointerClick, PenLine, Quote, Send, Sparkles, Trash2, X, CirclePlay, ChevronsDownUp,
} from "lucide-react";
import Link, { useRouter } from "@/lib/i18n/navigation";
import { AdminLogin } from "@/components/columns/admin-gate";
import { ColumnBody } from "@/components/columns/column-body";
import { excerpt } from "@/lib/columns/markdown";
import { COLUMN_TAGS, normalizeTags } from "@/lib/columns/tags";
import type { Column } from "@/lib/columns/types";

/**
 * コラムの編集画面（note のように、タイトルと本文だけを広く書く）。
 * - 書いたものは自動で保存（下書き）
 * - 下のバーで見出し・太字・画像・アプリなどを入れる。スマホではキーボードのすぐ上に出る
 * - 「AIに頼む」で、スマホの AI アプリに送る文をコピー → 返ってきた文章をそのまま本文に貼れる
 * - 「公開設定」で URL の名前・説明・X の投稿文を決めて公開。公開したら「X に投稿」で X のアプリが開く（API は使わない）
 */

type SaveState = "saved" | "saving" | "dirty" | "error";

// 依頼文。くわしい決まりは docs/columns/writing-guide.md（英語の記事は writing-guide-en.md）。リポジトリを読める AI に、それを読んで書いてもらう
const AI_PROMPT_EN = (theme: string) => `Please write an official Jisapp column (this repository) in English.

Topic: ${theme || "(write the topic here)"}

The writing rules are in docs/columns/writing-guide-en.md. Read it first.
Above all:
- Check every Jisapp feature in the code before writing about it (no features that aren't in the code, no unverifiable numbers)
- Open with a moment that happened to someone. Headings start with "## ", and the first line is "# Title"
- Reply with the post only. Start with the ":::learn In this post" box, and at the end add the "説明：", "Xの投稿文：" and "タグ：" lines separately`;
const AI_PROMPT = (theme: string) => `ジサップ（このリポジトリ）の公式コラムを書いてください。

【テーマ】${theme || "（ここにテーマを書く）"}

書き方の決まりは docs/columns/writing-guide.md にあります。まずそれを読んでください。
特に次の3つを守ってください。
- ジサップの機能は、コードで確かめてから書く（コードにないこと・確かめられない数字は書かない）
- 1文目は「その人に起きた場面」から。見出しは「## 」、1行目は「# タイトル」
- 返事は記事の本文だけ。はじめに「:::learn この記事でわかること」の箱、最後に「説明：」「Xの投稿文：」「タグ：」を本文とは別に書く`;

function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

/** 写真を縮める（長い辺 1200px・WebP。WebP を作れないブラウザは JPEG）。だいたい 100〜200KB になる */
async function shrinkImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ng) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ng; i.src = url; });
    const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const make = (type: string, q: number) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, q));
    let q = 0.8;
    let blob = await make("image/webp", q);
    const type = blob?.type === "image/webp" ? "image/webp" : "image/jpeg";
    if (type === "image/jpeg") blob = await make(type, q);
    while (blob && blob.size > 900_000 && q > 0.4) { q -= 0.15; blob = await make(type, q); }
    if (!blob) throw new Error("写真を読み込めませんでした");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadImage(file: File, columnId: string): Promise<string> {
  const form = new FormData();
  form.append("file", await shrinkImage(file));
  form.append("columnId", columnId);
  const res = await fetch("/api/admin/columns/image", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error ?? "画像を保存できませんでした");
  return data.url as string;
}

function publicPath(c: Pick<Column, "slug" | "locale">) {
  return `${c.locale === "en" ? "/en" : ""}/column/${c.slug}`;
}

export default function ColumnEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [col, setCol] = useState<Column | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("saved");
  const [preview, setPreview] = useState(false);
  const [sheet, setSheet] = useState<null | "publish" | "ai" | "app" | "link" | "youtube" | "button" | "prompt">(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const sel = useRef<[number, number]>([0, 0]);
  const loaded = useRef(false);
  useAutoGrow(titleRef, title);
  useAutoGrow(bodyRef, body);

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2600); };

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/columns/${id}`);
    if (res.status === 401) { setAuthed(false); return; }
    if (!res.ok) { setAuthed(true); say("記事が見つかりません"); return; }
    const { column } = (await res.json()) as { column: Column };
    setCol(column); setTitle(column.title); setBody(column.body); setCover(column.coverImage);
    loaded.current = true;
    setAuthed(true);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  /** 変えたところだけ保存する */
  const put = useCallback(async (patch: Partial<Column>) => {
    setSave("saving");
    const res = await fetch(`/api/admin/columns/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setSave("error"); say(data.error ?? "保存できませんでした"); return null; }
    setCol(data.column);
    setSave("saved");
    return data.column as Column;
  }, [id]);

  // タイトル・本文・見出し画像は、書くのをやめて1秒たったら自動で保存
  useEffect(() => {
    if (!loaded.current || !col) return;
    if (title === col.title && body === col.body && cover === col.coverImage) return;
    setSave("dirty");
    const t = setTimeout(() => { put({ title, body, coverImage: cover }); }, 1000);
    return () => clearTimeout(t);
  }, [title, body, cover, col, put]);

  // 保存していないまま閉じようとしたら止める
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (save === "dirty" || save === "saving") { e.preventDefault(); } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [save]);

  // スマホのキーボードが出ているとき、下のバーをキーボードのすぐ上に出す
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const f = () => setKbOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener("resize", f); vv.addEventListener("scroll", f);
    return () => { vv.removeEventListener("resize", f); vv.removeEventListener("scroll", f); };
  }, []);

  const remember = () => { const el = bodyRef.current; if (el) sel.current = [el.selectionStart, el.selectionEnd]; };

  /** 本文のカーソルの位置に入れる。block のときは前後を空行にする */
  const insert = (make: (selected: string) => string, block = false, cursorBack = 0) => {
    const el = bodyRef.current;
    const [a, b] = el && document.activeElement === el ? [el.selectionStart, el.selectionEnd] : sel.current;
    const selected = body.slice(a, b);
    let text = make(selected);
    if (block) {
      const before = body.slice(0, a), after = body.slice(b);
      if (before && !before.endsWith("\n\n")) text = (before.endsWith("\n") ? "\n" : "\n\n") + text;
      if (!after.startsWith("\n")) text += "\n\n"; else if (!after.startsWith("\n\n")) text += "\n";
    }
    const next = body.slice(0, a) + text + body.slice(b);
    setBody(next);
    const pos = a + text.length - cursorBack;
    requestAnimationFrame(() => { const e = bodyRef.current; if (e) { e.focus(); e.setSelectionRange(pos, pos); } });
  };

  /** 行のはじめに記号をつける（見出し・箇条書き・引用） */
  const linePrefix = (prefix: string) => {
    const el = bodyRef.current;
    const [a, b] = el && document.activeElement === el ? [el.selectionStart, el.selectionEnd] : sel.current;
    const start = body.lastIndexOf("\n", a - 1) + 1;
    const end = body.indexOf("\n", b) === -1 ? body.length : body.indexOf("\n", b);
    const lines = body.slice(start, end).split("\n").map((l, i) => {
      const clean = l.replace(/^(#{1,3}\s+|[-*]\s+|\d+\.\s+|>\s?)/, "");
      return l.startsWith(prefix.replace("1. ", `${i + 1}. `)) ? clean : (prefix === "1. " ? `${i + 1}. ` : prefix) + clean;
    });
    const text = lines.join("\n");
    setBody(body.slice(0, start) + text + body.slice(end));
    requestAnimationFrame(() => { const e = bodyRef.current; if (e) { e.focus(); e.setSelectionRange(start + text.length, start + text.length); } });
  };

  const pickImage = async (file: File | undefined, asCover: boolean) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file, id);
      if (asCover) setCover(url);
      else insert(() => `![](${url})`, true);
    } catch (e) {
      say((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /**
   * AI の返事を貼ったとき：1行目の「# タイトル」はタイトル欄へ、
   * 最後の「説明：」「Xの投稿文：」は公開設定へ移して、本文には残さない
   */
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    let text = e.clipboardData.getData("text").replace(/\r\n?/g, "\n");
    const moved: string[] = [];
    const patch: Partial<Column> = {};
    const t = text.match(/^\s*#\s+(.+)\n/);
    if (t && !title.trim()) { setTitle(t[1].trim()); text = text.slice(t[0].length); moved.push("タイトル"); }
    const d = text.match(/^[*\s-]*説明[*]*\s*[:：]\s*(.+)$/m);
    if (d) { patch.description = d[1].trim().slice(0, 300); text = text.replace(d[0], ""); moved.push("説明"); }
    const x = text.match(/^[*\s-]*X\s*の?投稿文[*]*\s*[:：]\s*([\s\S]+?)\s*$/m);
    if (x) { patch.xText = x[1].trim().slice(0, 256); text = text.slice(0, x.index) + text.slice((x.index ?? 0) + x[0].length); moved.push("Xの投稿文"); }
    const g = text.match(/^[*\s-]*タグ[*]*\s*[:：]\s*(.+)$/m);
    if (g) { patch.tags = normalizeTags(g[1]); text = text.replace(g[0], ""); moved.push("タグ"); }
    if (!moved.length) return;
    e.preventDefault();
    insert(() => text.replace(/^\s+/, "").replace(/\s+$/, ""));
    if (patch.description !== undefined || patch.xText !== undefined || patch.tags !== undefined) put(patch);
    say(`${moved.join("・")}を分けて入れました`);
  };

  if (authed === null) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;
  if (!authed) return <AdminLogin title="コラム" onDone={load} />;
  if (!col) return <div className="p-8 text-center text-sm text-gray-500">記事が見つかりません。<Link href="/admin/columns" className="text-emerald-700 underline">一覧へ</Link></div>;

  const tools: { icon: React.ReactNode; label: string; run: () => void }[] = [
    { icon: <Heading2 className="h-5 w-5" />, label: "見出し", run: () => linePrefix("## ") },
    { icon: <Heading3 className="h-5 w-5" />, label: "小見出し", run: () => linePrefix("### ") },
    { icon: <Bold className="h-5 w-5" />, label: "太字", run: () => insert((s) => `**${s || "太字"}**`, false, 2) },
    { icon: <List className="h-5 w-5" />, label: "箇条書き", run: () => linePrefix("- ") },
    { icon: <ListOrdered className="h-5 w-5" />, label: "番号", run: () => linePrefix("1. ") },
    { icon: <Quote className="h-5 w-5" />, label: "引用", run: () => linePrefix("> ") },
    { icon: <ImagePlus className="h-5 w-5" />, label: "画像", run: () => fileRef.current?.click() },
    { icon: <Link2 className="h-5 w-5" />, label: "リンク", run: () => setSheet("link") },
    { icon: <AppWindow className="h-5 w-5" />, label: "アプリ", run: () => setSheet("app") },
    { icon: <ChevronsDownUp className="h-5 w-5" />, label: "プロンプト", run: () => setSheet("prompt") },
    { icon: <CirclePlay className="h-5 w-5" />, label: "動画", run: () => setSheet("youtube") },
    { icon: <MousePointerClick className="h-5 w-5" />, label: "ボタン", run: () => setSheet("button") },
    { icon: <Minus className="h-5 w-5" />, label: "区切り", run: () => insert(() => "---", true) },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3">
          <button onClick={() => router.push("/admin/columns")} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100" aria-label="一覧に戻る"><ArrowLeft className="h-5 w-5" /></button>
          <span className={`whitespace-nowrap text-xs font-semibold ${save === "error" ? "text-rose-500" : "text-gray-400"}`}>
            {save === "saving" ? "保存中…" : save === "dirty" ? "編集中" : save === "error" ? "保存エラー" : col.status === "published" ? "公開中" : "保存済み"}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setSheet("ai")} className="flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50"><Sparkles className="h-4 w-4" />AIに頼む</button>
            <button onClick={() => setPreview((v) => !v)} className="flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50">
              {preview ? <><PenLine className="h-4 w-4" />書く</> : <><Eye className="h-4 w-4" />見る</>}
            </button>
            <button onClick={() => setSheet("publish")} className="flex h-9 items-center gap-1 whitespace-nowrap rounded-full bg-gray-900 px-3.5 text-xs font-bold text-white">{col.status === "published" ? "公開設定" : "公開へ"}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-5 pb-40 pt-6">
        {/* 見出し画像 */}
        {cover ? (
          <div className="relative mb-6 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="aspect-[1.91/1] w-full object-cover" />
            {!preview && <button onClick={() => setCover(null)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white" aria-label="見出し画像を外す"><X className="h-4 w-4" /></button>}
          </div>
        ) : !preview ? (
          <button onClick={() => coverRef.current?.click()} className="mb-6 flex aspect-[3.5/1] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-emerald-300 hover:text-emerald-600">
            <ImagePlus className="h-5 w-5" />見出し画像を入れる
          </button>
        ) : null}

        {preview ? (
          <article>
            <h1 className="mb-8 text-[1.75rem] font-black leading-snug text-gray-900">{title || "（タイトルなし）"}</h1>
            <ColumnBody body={body} toc en={col.locale === "en"} />
          </article>
        ) : (
          <>
            <textarea ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))} placeholder="記事タイトル" rows={1} maxLength={120}
              className="w-full resize-none overflow-hidden border-0 bg-transparent text-[1.75rem] font-black leading-snug text-gray-900 placeholder:text-gray-300 focus:outline-none" />
            <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} onSelect={remember} onBlur={remember} onPaste={onPaste}
              placeholder={"ご自由にお書きください。\n\nAI に書いてもらった文章も、そのまま貼れます（右上の「AIに頼む」）。\n見出しや画像は、下のバーから入れられます。"}
              className="mt-4 min-h-[50vh] w-full resize-none overflow-hidden border-0 bg-transparent text-[17px] leading-[1.95] text-gray-800 placeholder:text-gray-300 focus:outline-none" />
          </>
        )}
      </main>

      {/* 書くための道具（スマホではキーボードのすぐ上） */}
      {!preview && (
        <div className="fixed inset-x-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur" style={{ bottom: kbOffset }}>
          <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none]">
            {tools.map((t) => (
              <button key={t.label} onMouseDown={(e) => e.preventDefault()} onClick={t.run}
                className="flex min-w-[52px] shrink-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-gray-600 active:bg-gray-100">
                {t.icon}<span className="text-[10px] font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0], false); e.target.value = ""; }} />
      <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0], true); e.target.value = ""; }} />

      {busy && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/60"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>}
      {toast && <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</div>}

      {sheet === "publish" && <PublishSheet col={col} title={title} body={body} put={put} onClose={() => setSheet(null)} say={say}
        onDeleted={() => router.push("/admin/columns")} />}
      {sheet === "ai" && <AiSheet onClose={() => setSheet(null)} say={say} initialTheme={title} locale={col.locale} onLocale={(l) => { if (l !== col.locale) put({ locale: l }); }} />}
      {sheet === "app" && <AppSheet onClose={() => setSheet(null)} onPick={(appId) => { insert(() => `::app[${appId}]`, true); setSheet(null); }} />}
      {sheet === "link" && <FieldsSheet title="リンクを入れる" fields={[["文字", "例：開発スタジオ"], ["URL", "https:// か / で始まる"]]}
        onClose={() => setSheet(null)} onOk={([label, url]) => { insert((s) => `[${s || label || url}](${url})`); setSheet(null); }} />}
      {sheet === "prompt" && <FieldsSheet title="プロンプトを折りたたんで入れる" fields={[["見出し", "このアプリのプロンプト"], ["プロンプト（AI に送った文）", "旅行で誰かが立て替えたものを入れると…"]]}
        defaults={["このアプリのプロンプト"]} multiline={1}
        onClose={() => setSheet(null)} onOk={([label, text]) => { insert(() => `:::prompt ${label || "このアプリのプロンプト"}\n${text.replace(/^:::$/gm, "：：：")}\n:::`, true); setSheet(null); }} />}
      {sheet === "youtube" && <FieldsSheet title="YouTube の動画を入れる" fields={[["動画の URL", "https://youtube.com/shorts/…"]]}
        onClose={() => setSheet(null)} onOk={([url]) => { insert(() => `::youtube[${url}]`, true); setSheet(null); }} />}
      {sheet === "button" && <FieldsSheet title="ボタンを入れる" fields={[["ボタンの文字", "ジサップでアプリを作る"], ["行き先", "/playground"]]}
        defaults={["ジサップでアプリを作る", "/playground"]}
        onClose={() => setSheet(null)} onOk={([label, url]) => { insert(() => `::button[${label}](${url})`, true); setSheet(null); }} />}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-black text-gray-900">{title}</h2>
          <button onClick={onClose} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100" aria-label="閉じる"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-base outline-none focus:border-emerald-400 focus:bg-white";

function FieldsSheet({ title, fields, defaults = [], multiline, onOk, onClose }: { title: string; fields: [string, string][]; defaults?: string[]; multiline?: number; onOk: (v: string[]) => void; onClose: () => void }) {
  const [v, setV] = useState<string[]>(fields.map((_, i) => defaults[i] ?? ""));
  return (
    <Sheet title={title} onClose={onClose}>
      <div className="space-y-3">
        {fields.map(([label, ph], i) => (
          <label key={label} className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">{label}</span>
            {multiline === i
              ? <textarea className={`${inputCls} resize-y`} rows={8} placeholder={ph} value={v[i]} onChange={(e) => setV(v.map((x, k) => (k === i ? e.target.value : x)))} />
              : <input className={inputCls} placeholder={ph} value={v[i]} onChange={(e) => setV(v.map((x, k) => (k === i ? e.target.value : x)))} autoFocus={i === 0} />}
          </label>
        ))}
        <button onClick={() => onOk(v.map((x) => x.trim()))} disabled={!v[v.length - 1].trim()} className="w-full rounded-xl bg-gray-900 py-3 font-bold text-white disabled:opacity-40">入れる</button>
      </div>
    </Sheet>
  );
}

function AppSheet({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [apps, setApps] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => {
    const id = q.trim().match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (id) { setApps([{ id: id[0].toLowerCase(), title: "この ID のアプリ" }]); return; }
    if (!q.trim()) { setApps([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch("/api/admin/hero", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q }) });
      const data = await res.json().catch(() => ({}));
      setApps(data.apps ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <Sheet title="アプリを入れる" onClose={onClose}>
      <input className={inputCls} placeholder="アプリの名前、またはアプリの URL" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="mt-3 space-y-1.5">
        {apps.map((a) => (
          <button key={a.id} onClick={() => onPick(a.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-emerald-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/apps/${a.id}/icon?size=180`} alt="" className="h-10 w-10 rounded-xl" />
            <span className="truncate font-bold text-gray-800">{a.title}</span>
          </button>
        ))}
        {q.trim() && apps.length === 0 && <p className="py-4 text-center text-sm text-gray-400">見つかりません（公開中のアプリだけ出ます）</p>}
      </div>
    </Sheet>
  );
}

function AiSheet({ onClose, say, initialTheme, locale, onLocale }: { onClose: () => void; say: (t: string) => void; initialTheme: string; locale: Column["locale"]; onLocale: (l: Column["locale"]) => void }) {
  const [theme, setTheme] = useState(initialTheme);
  const text = locale === "en" ? AI_PROMPT_EN(theme.trim()) : AI_PROMPT(theme.trim());
  const copy = async () => { try { await navigator.clipboard.writeText(text); say("コピーしました。AI のアプリに貼ってください"); } catch { say("コピーできませんでした"); } };
  return (
    <Sheet title="AI に書いてもらう" onClose={onClose}>
      <ol className="mb-4 space-y-1 text-sm text-gray-600">
        <li>1. テーマを書いて「頼む文をコピー」</li>
        <li>2. ChatGPT・Claude・Gemini のアプリに貼って送る</li>
        <li>3. 返ってきた文章を全部コピーして、本文に貼る（1行目の「# 〜」はタイトルになります）</li>
      </ol>
      <div className="mb-3">
        <span className="mb-1 block text-xs font-bold text-gray-500">記事の言語</span>
        <div className="flex gap-2">
          {(["ja", "en"] as const).map((l) => (
            <button key={l} onClick={() => onLocale(l)} className={`flex-1 rounded-xl py-2 text-sm font-bold ring-1 ${locale === l ? "bg-violet-50 text-violet-700 ring-violet-300" : "text-gray-500 ring-gray-200"}`}>{l === "ja" ? "日本語" : "英語（/en/column に出ます）"}</button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-gray-500">テーマ（日本語で書いてもよい）</span>
        <input className={inputCls} placeholder="例：旅行の立て替え精算を、送金2回で終わらせるアプリ" value={theme} onChange={(e) => setTheme(e.target.value)} />
      </label>
      <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">{text}</pre>
      <button onClick={copy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-bold text-white"><Copy className="h-4 w-4" />頼む文をコピー</button>
    </Sheet>
  );
}

function PublishSheet({ col, title, body, put, onClose, say, onDeleted }: {
  col: Column; title: string; body: string; put: (p: Partial<Column>) => Promise<Column | null>; onClose: () => void; say: (t: string) => void; onDeleted: () => void;
}) {
  const [slug, setSlug] = useState(col.slug.startsWith("draft-") ? "" : col.slug);
  const [locale, setLocale] = useState(col.locale);
  const [description, setDescription] = useState(col.description || excerpt(body));
  const [xText, setXText] = useState(col.xText || title);
  const [tags, setTags] = useState<string[]>(col.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : normalizeTags([...cur, t])));
  const [saving, setSaving] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${publicPath({ slug: slug || col.slug, locale })}` : "";
  const xHref = `https://x.com/intent/post?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(url)}`;
  const xLen = [...xText].length + 24; // URL は 23 文字として数えられる

  const submit = async (status: Column["status"]) => {
    if (status === "published" && !/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) { say("URL の名前を、半角の小文字・数字・ハイフンで入れてください"); return; }
    setSaving(true);
    const c = await put({ title, body, slug: slug || col.slug, locale, description, xText, status, tags: normalizeTags([...tags, ...tagInput.split(/[,、\s]+/)]) });
    setTagInput("");
    setSaving(false);
    if (c) say(status === "published" ? "公開しました" : "下書きに戻しました");
  };
  const remove = async () => {
    if (!confirm("この記事を消しますか？もとに戻せません")) return;
    const res = await fetch(`/api/admin/columns/${col.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(); else say("消せませんでした");
  };

  return (
    <Sheet title={col.status === "published" ? "公開設定" : "公開に進む"} onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-gray-500">URL の名前（半角英数字とハイフン）</span>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-emerald-400">
            <span className="shrink-0 text-sm text-gray-400">{locale === "en" ? "/en" : ""}/column/</span>
            <input className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none" placeholder="travel-split" value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80))} />
          </div>
        </label>
        <div>
          <span className="mb-1 block text-xs font-bold text-gray-500">言語</span>
          <div className="flex gap-2">
            {(["ja", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLocale(l)} className={`flex-1 rounded-xl py-2 text-sm font-bold ring-1 ${locale === l ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "text-gray-500 ring-gray-200"}`}>{l === "ja" ? "日本語" : "英語"}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-bold text-gray-500">タグ（5つまで。一覧の表紙の色と「次に読む」に使う）</span>
          <div className="flex flex-wrap gap-1.5">
            {[...COLUMN_TAGS.map((x) => (locale === "en" ? x.en : x.name)), ...tags.filter((x) => !COLUMN_TAGS.some((c) => c.name === x || c.en === x))].map((name) => {
              const on = tags.includes(name);
              const emoji = COLUMN_TAGS.find((c) => c.name === name || c.en === name)?.emoji;
              return (
                <button key={name} type="button" onClick={() => toggleTag(name)}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${on ? "bg-emerald-600 text-white ring-emerald-600" : "text-gray-600 ring-gray-200"}`}>
                  {emoji ? `${emoji} ` : "#"}{name}
                </button>
              );
            })}
          </div>
          <input className={`${inputCls} mt-2`} placeholder="ほかのタグ（例：合宿）" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); setTags((cur) => normalizeTags([...cur, tagInput])); setTagInput(""); } }} />
        </div>
        <label className="block">
          <span className="mb-1 flex items-center text-xs font-bold text-gray-500">説明（検索結果やシェアのカードに出る）
            <button onClick={() => setDescription(excerpt(body))} className="ml-auto text-emerald-600">本文から作る</button></span>
          <textarea className={`${inputCls} resize-none`} rows={3} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 flex text-xs font-bold text-gray-500">X に投稿する文<span className={`ml-auto ${xLen > 280 ? "text-rose-500" : "text-gray-400"}`}>{xLen}/280（URL込み）</span></span>
          <textarea className={`${inputCls} resize-none`} rows={4} maxLength={256} value={xText} onChange={(e) => setXText(e.target.value)} placeholder="記事のリンクは自動でつきます" />
        </label>

        {col.status === "published" ? (
          <div className="space-y-2">
            <button onClick={() => submit("published")} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}設定を保存
            </button>
            <a href={xHref} target="_blank" rel="noopener noreferrer" onClick={() => put({ xText })}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-bold text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L.1 1.2h7.6l5.2 6.9 6-6.9Zm-1.3 19.4h2L6.5 3.3H4.3l13.3 17.3Z" /></svg>
              X に投稿（X のアプリが開きます）
            </a>
            <div className="flex gap-2">
              <a href={publicPath(col)} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-bold text-gray-600 ring-1 ring-gray-200"><ExternalLink className="h-4 w-4" />記事を見る</a>
              <button onClick={() => { navigator.clipboard.writeText(url).then(() => say("URL をコピーしました")).catch(() => {}); }} className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-bold text-gray-600 ring-1 ring-gray-200"><Copy className="h-4 w-4" />URL をコピー</button>
            </div>
            <button onClick={() => submit("draft")} disabled={saving} className="flex w-full items-center justify-center gap-1 py-2 text-sm font-bold text-gray-400"><ChevronLeft className="h-4 w-4" />下書きに戻す（非公開）</button>
          </div>
        ) : (
          <button onClick={() => submit("published")} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}公開する
          </button>
        )}
        <button onClick={remove} className="flex w-full items-center justify-center gap-1 pt-2 text-xs font-bold text-rose-400"><Trash2 className="h-3.5 w-3.5" />この記事を消す</button>
      </div>
    </Sheet>
  );
}
