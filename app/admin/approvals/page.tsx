"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { JisappLogo } from "@/components/jisapp-logo";
import { AppRunner } from "@/components/app-runner";

type Safety = { ok?: boolean; reasons?: string[] };
type OfficialCreator = { id: string; email: string; name: string | null } | null;

type AgentTaskRow = {
  id: string;
  type: "x_post" | "game_generation";
  status: "pending" | "approved" | "rejected" | "executed";
  title: string;
  content: {
    text?: string;
    angle?: string;
    title?: string;
    description?: string;
    category?: string;
    html?: string;
  };
  previewData: { publishedAppId?: string } | null;
  safetyCheckResult: Safety | null;
  rejectionReason: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<AgentTaskRow["type"], string> = {
  x_post: "X投稿下書き",
  game_generation: "運営アプリ",
};

const STATUS_LABEL: Record<AgentTaskRow["status"], string> = {
  pending: "承認待ち",
  approved: "承認済み（公式Xへ投稿待ち）",
  rejected: "却下",
  executed: "完了",
};

export default function AdminApprovalsPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pwInput, setPwInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [tasks, setTasks] = useState<AgentTaskRow[]>([]);
  const [official, setOfficial] = useState<OfficialCreator>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<"x_post" | "game_generation" | null>(null);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [creatorPassword, setCreatorPassword] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/agent-tasks${filter === "pending" ? "?status=pending" : ""}`
    );
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setAuthed(true);
    setTasks(data.tasks ?? []);
    setOfficial(data.officialCreator ?? null);
  }, [filter]);

  useEffect(() => {
    load().finally(() => setChecking(false));
  }, [load]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwInput }),
    });
    if (res.ok) {
      setPwError(false);
      setAuthed(true);
      await load();
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  const createOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/official-creator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: creatorEmail, password: creatorPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "作成に失敗しました");
      return;
    }
    setOfficial(data.creator);
    setCreatorPassword("");
  };

  const generate = async (type: "x_post" | "game_generation") => {
    setGenerating(type);
    setError("");
    try {
      const res = await fetch("/api/admin/agent-tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setGenerating(null);
    }
  };

  const approve = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/agent-tasks/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "承認に失敗しました");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "承認に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const complete = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/agent-tasks/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "完了に失敗しました");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "完了に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/agent-tasks/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "却下に失敗しました");
      setRejecting(null);
      setRejectReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "却下に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f2]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f2] px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-bold text-gray-900">承認キュー</p>
          <div className="relative mt-4">
            <input
              type={showPw ? "text" : "password"}
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="管理者パスワード"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-label={showPw ? "パスワードを隠す" : "パスワードを表示"}
            >
              {showPw ? (
                <EyeOff className="h-4 w-4 shrink-0" strokeWidth={2} />
              ) : (
                <Eye className="h-4 w-4 shrink-0" strokeWidth={2} />
              )}
            </button>
          </div>
          {pwError && <p className="mt-2 text-xs text-rose-500">パスワードが正しくありません</p>}
          <button type="submit" className="mt-4 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white">
            ログイン
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f2]">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <JisappLogo href="/" />
          <span className="text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-700">承認キュー</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/review" className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">
              運営管理
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600"
            >
              <RefreshCw className="h-3 w-3 shrink-0" strokeWidth={2} />
              更新
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 pb-16">
        {!official && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-bold text-gray-900">運営出品用アカウントを作成</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              承認したアプリはこのアカウント名義で公開されます。メールとパスワードは控えてください。通常のログイン画面からも入れます。
            </p>
            <form onSubmit={createOfficial} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                type="email"
                required
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                placeholder="official@..."
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="password"
                required
                minLength={8}
                value={creatorPassword}
                onChange={(e) => setCreatorPassword(e.target.value)}
                placeholder="パスワード（8文字以上）"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white sm:col-span-2">
                アカウントを作成
              </button>
            </form>
          </section>
        )}

        {official && (
          <p className="text-xs text-gray-500">
            出品名義: {official.name}（{official.email}）
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!generating}
            onClick={() => void generate("x_post")}
            className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {generating === "x_post" ? "生成中…" : "X下書きを今すぐ作る"}
          </button>
          <button
            type="button"
            disabled={!!generating}
            onClick={() => void generate("game_generation")}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {generating === "game_generation" ? "生成中（最大1分）…" : "運営アプリを今すぐ作る"}
          </button>
          <button
            type="button"
            onClick={() => setFilter((v) => (v === "pending" ? "all" : "pending"))}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600"
          >
            {filter === "pending" ? "すべて表示" : "承認待ちだけ"}
          </button>
        </div>

        {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

        {tasks.length === 0 && (
          <p className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm ring-1 ring-black/5">
            いま表示するタスクはありません
          </p>
        )}

        {tasks.map((task) => {
          const safety = task.safetyCheckResult;
          const html = task.content.html ?? "";
          const postText = task.content.text ?? "";
          return (
            <article key={task.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {TYPE_LABEL[task.type]}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {STATUS_LABEL[task.status]}
                </span>
                <h2 className="text-sm font-bold text-gray-900">{task.title}</h2>
              </div>

              {safety && safety.ok === false && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                  <div>
                    <p className="font-bold">自動チェックで指摘があります</p>
                    <p className="mt-0.5">{(safety.reasons ?? []).join(" / ")}</p>
                  </div>
                </div>
              )}

              {task.type === "x_post" && (
                <div className="mt-3">
                  {task.content.angle && (
                    <p className="text-[11px] text-gray-400">狙い: {task.content.angle}</p>
                  )}
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-sm text-gray-800">
                    {postText}
                  </pre>
                  <button
                    type="button"
                    onClick={() => void copyText(task.id, postText)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
                  >
                    {copiedId === task.id ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    )}
                    {copiedId === task.id ? "コピーしました" : "投稿文をコピー"}
                  </button>
                  {task.status === "approved" && (
                    <p className="mt-2 text-xs text-gray-500">
                      公式X（@jisapp_app）に貼って投稿したら、「投稿した」を押してください。
                    </p>
                  )}
                </div>
              )}

              {task.type === "game_generation" && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500">{task.content.description}</p>
                  {html && (
                    <AppRunner
                      html={html}
                      title={task.title}
                      appId={`agent-preview-${task.id}`}
                      className="h-[420px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white"
                    />
                  )}
                  {task.previewData?.publishedAppId && (
                    <Link
                      href={`/apps/${task.previewData.publishedAppId}`}
                      className="text-xs font-semibold text-emerald-700"
                    >
                      公開ページを開く
                    </Link>
                  )}
                </div>
              )}

              {task.status === "approved" && task.type === "x_post" && (
                <button
                  type="button"
                  disabled={busyId === task.id}
                  onClick={() => void complete(task.id)}
                  className="mt-3 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  投稿した
                </button>
              )}

              {task.status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      busyId === task.id ||
                      (task.type === "game_generation" && !official)
                    }
                    onClick={() => void approve(task.id)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {task.type === "x_post"
                      ? "この文で投稿してよい"
                      : official
                        ? "プレイ確認したので公開する"
                        : "先に運営アカウントを作成"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejecting(task.id);
                      setRejectReason("");
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
                  >
                    却下
                  </button>
                </div>
              )}

              {task.status === "approved" && task.type === "game_generation" && (
                <button
                  type="button"
                  disabled={busyId === task.id}
                  onClick={() => void approve(task.id)}
                  className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800"
                >
                  公開を再実行
                </button>
              )}

              {rejecting === task.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="却下理由（次回の生成に渡します）"
                    className="w-full rounded-xl border border-gray-200 p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === task.id}
                      onClick={() => void reject(task.id)}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
                    >
                      却下する
                    </button>
                    <button type="button" onClick={() => setRejecting(null)} className="text-xs text-gray-400">
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </main>
    </div>
  );
}
