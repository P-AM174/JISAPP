"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { JisappLogo } from "@/components/jisapp-logo";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  if (!token) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-400" />
        <h2 className="text-lg font-black text-gray-900 mb-2">リンクが無効です</h2>
        <p className="text-sm text-gray-500 mb-6">
          パスワードリセットのリンクが正しくありません。
        </p>
        <Link href="/forgot-password" className="text-emerald-600 font-semibold hover:underline">
          再度リセットを申請する
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== password2) {
      setError("パスワードが一致しません"); return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください"); return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "リセットに失敗しました"); return; }
      setDone(true);
      setTimeout(() => router.replace("/login"), 3000);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-2">パスワードを変更しました</h2>
        <p className="text-sm text-gray-500">3秒後にログインページへ移動します...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">新しいパスワード（6文字以上）</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="新しいパスワード"
            required
            className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 transition"
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">パスワード（確認）</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showPw ? "text" : "password"}
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            placeholder="もう一度入力"
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
          : "パスワードを変更する"
        }
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
              <Lock className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">新しいパスワードを設定</h1>
            <p className="mt-1.5 text-sm text-gray-500">6文字以上で設定してください</p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
            <Suspense fallback={<div className="h-32 flex items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>}>
              <ResetPasswordContent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
