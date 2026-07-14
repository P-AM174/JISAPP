"use client";

import { useState } from "react";
import Link from "next/link";
import { JisappLogo } from "@/components/jisapp-logo";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "送信に失敗しました"); return; }
      setSent(true);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <JisappLogo href="/" />
          <Link href="/login" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
            ログインに戻る
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
              <Mail className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">パスワードをお忘れですか？</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              登録したメールアドレスを入力してください
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-lg font-black text-gray-900 mb-2">メールを送信しました</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  <span className="font-semibold text-emerald-700">{email}</span> に<br />
                  パスワードリセット用のリンクを送りました。<br />
                  メールをご確認ください（迷惑メールフォルダも）。
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-700 hover:to-green-600 transition-all"
                >
                  ログインページへ
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">メールアドレス</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 transition"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <><ArrowRight className="h-4 w-4" />リセットメールを送信</>
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
