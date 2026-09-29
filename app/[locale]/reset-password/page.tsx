"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import Link from "@/lib/i18n/navigation";
import { JisappLogo } from "@/components/jisapp-logo";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
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
        <h2 className="text-lg font-black text-gray-900 mb-2">{t("リンクが無効です", "This link isn't valid")}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {t("パスワードリセットのリンクが正しくありません。", "The password reset link is incorrect.")}
        </p>
        <Link href="/forgot-password" className="text-emerald-600 font-semibold hover:underline">
          {t("再度リセットを申請する", "Request a new reset link")}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== password2) {
      setError(t("パスワードが一致しません", "The passwords don't match")); return;
    }
    if (password.length < 6) {
      setError(t("パスワードは6文字以上にしてください", "Your password needs at least 6 characters")); return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("リセットに失敗しました", "Couldn't reset your password")); return; }
      setDone(true);
      setTimeout(() => router.replace("/login"), 3000);
    } catch {
      setError(t("ネットワークエラーが発生しました", "A network error occurred"));
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
        <h2 className="text-lg font-black text-gray-900 mb-2">{t("パスワードを変更しました", "Password changed")}</h2>
        <p className="text-sm text-gray-500">{t("3秒後にログインページへ移動します...", "Taking you to sign in in 3 seconds...")}</p>
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
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">{t("新しいパスワード（6文字以上）", "New password (6+ characters)")}</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t("新しいパスワード", "New password")}
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
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">{t("パスワード（確認）", "Confirm password")}</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={showPw ? "text" : "password"}
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            placeholder={t("もう一度入力", "Type it again")}
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
          : t("パスワードを変更する", "Change password")
        }
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <JisappLogo href="/" />
          <Link href="/login" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
            {t("ログインに戻る", "Back to sign in")}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
              <Lock className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{t("新しいパスワードを設定", "Set a new password")}</h1>
            <p className="mt-1.5 text-sm text-gray-500">{t("6文字以上で設定してください", "Use at least 6 characters")}</p>
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
