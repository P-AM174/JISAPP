"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/back-button";
import { JisappLogo, JisappLogoIcon } from "@/components/jisapp-logo";
import {
  MessageSquare,
  Tag,
  Send,
  CheckCircle2,
  X,
  ExternalLink,
  Terminal,
  Rocket,
} from "lucide-react";

type AppRequest = {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  createdAt: string;
  responses: number;
};

type ResponseItem = {
  id: string;
  creatorName: string;
  appUrl?: string;
  message: string;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ja-JP");
  } catch {
    return iso;
  }
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const reqId = params.id as string;

  const [request, setRequest] = useState<AppRequest | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [creatorName, setCreatorName] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${reqId}`);
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/requests/${reqId}`)}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setRequest(null);
        return;
      }
      setRequest(data.request);
      setResponses(data.responses ?? []);
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [reqId, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/requests/${reqId}`)}`);
      return;
    }
    setCreatorName(session?.user?.name ?? "");
    loadDetail();
  }, [status, session, reqId, router, loadDetail]);

  const handleResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("メッセージは必須です。");
      return;
    }
    if (appUrl.trim() && !appUrl.trim().startsWith("http")) {
      setError("アプリURLは http:// または https:// から入力してください。");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName: creatorName.trim() || undefined,
          message: message.trim(),
          appUrl: appUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました");

      setResponses((prev) => [...prev, data.response]);
      setSubmitted(true);
      setAppUrl("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4] text-sm text-gray-500">
        読み込み中…
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f6f4]">
        <p className="text-gray-500">リクエストが見つかりませんでした。</p>
        <Link href="/requests" className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
          リクエスト一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <BackButton label="戻る" fallbackHref="/requests" hideLabelOnMobile />
          <JisappLogo href="/" />
          <span className="text-sm text-gray-400">/</span>
          <span className="truncate text-sm font-semibold text-gray-700">{request.title}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">{request.category}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Tag className="h-3 w-3" /> {request.authorName}
                </span>
                <span className="ml-auto text-xs text-gray-400">{formatDate(request.createdAt)}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <MessageSquare className="h-3 w-3" /> {responses.length}件の返信
                </span>
              </div>
              <h1 className="text-lg font-black text-gray-900">{request.title}</h1>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">{request.content}</p>
            </section>

            {responses.length > 0 && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-900">
                  <Rocket className="h-4 w-4 text-emerald-500" />
                  作ってみました（{responses.length}件）
                </h2>
                <div className="space-y-4">
                  {responses.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                            {r.creatorName[0]}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{r.creatorName}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{r.message}</p>
                      {r.appUrl && (
                        <a
                          href={r.appUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          アプリを見る
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
              <JisappLogoIcon className="h-8 w-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800">このアプリを自分でも作れます</p>
                <p className="mt-0.5 text-xs text-gray-500">AIにアイデアを伝えてコードを生成してもらい、開発スタジオに貼るだけです。</p>
              </div>
              <Link
                href="/playground"
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                作ってみる
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
                    <Send className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900">作ってみた、と報告する</h2>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-gray-500">
                  開発スタジオでアプリを作ったら、URLを貼って共有しよう。
                </p>

                {submitted ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <p className="font-bold text-emerald-700">返信を送信しました</p>
                    <p className="text-xs text-emerald-600">リクエストした方に通知が届きます</p>
                    <button type="button" onClick={() => setSubmitted(false)} className="mt-1 text-xs text-emerald-600 underline">
                      別の返信をする
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResponse} className="space-y-3">
                    {error && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2">
                        <X className="h-4 w-4 text-rose-500" />
                        <p className="text-xs font-semibold text-rose-600">{error}</p>
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">ニックネーム（任意）</label>
                      <input
                        type="text"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="あなたのニックネーム"
                        maxLength={30}
                        className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">
                        作ったアプリのURL
                        <span className="ml-1 text-[10px] font-normal text-gray-400">（任意）</span>
                      </label>
                      <input
                        type="url"
                        value={appUrl}
                        onChange={(e) => setAppUrl(e.target.value)}
                        placeholder="https://jisapp.com/apps/..."
                        className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-gray-700">
                        メッセージ <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="どんなアプリを作ったか一言で教えてください。"
                        maxLength={200}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {submitting ? "送信中…" : "返信を送る"}
                    </button>
                    <Link
                      href="/playground"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      まず作ってみる
                    </Link>
                  </form>
                )}
              </section>

              <Link
                href="/requests"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-emerald-600"
              >
                リクエスト一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
