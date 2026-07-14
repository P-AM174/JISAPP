"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { JisappLogo } from "@/components/jisapp-logo";
import {
  Sparkles, Eye, EyeOff, X, CheckCircle2, Mail, Lock, User,
  ArrowRight, AlertCircle, RefreshCw, ShieldCheck,
} from "lucide-react";

// ─── Google SVG アイコン ───────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

type Mode  = "login" | "register";
type Stage = "form" | "verify" | "done";

function LoginContent() {
  const { status } = useSession();
  const router      = useRouter();
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [mode,    setMode]    = useState<Mode>("login");
  const [stage,   setStage]   = useState<Stage>("form");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ─── 登録フォーム ───
  const [regName,  setRegName]  = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPw,    setRegPw]    = useState("");

  // ─── 認証コード入力 ───
  const codeRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);

  // ─── ログインフォーム ───
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw,    setLoginPw]    = useState("");

  // ─── リダイレクト ───
  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  // ─── Google ログイン ───
  const handleGoogle = () => {
    setLoading(true);
    signIn("google", { callbackUrl });
  };

  // ─── 新規登録フォーム送信 → Resend でメール送信 ───
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regName.trim() || !regEmail.trim() || !regPw.trim()) {
      setError("すべての項目を入力してください"); return;
    }
    if (regPw.length < 6) {
      setError("パスワードは6文字以上にしてください"); return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/send-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: regName, email: regEmail, password: regPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "送信に失敗しました"); return; }
      setStage("verify");
      setCodeDigits(["", "", "", "", "", ""]);
      setTimeout(() => codeRefs[0].current?.focus(), 100);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ─── コード入力ハンドラ（6桁分割入力） ───
  const handleDigitChange = (i: number, val: string) => {
    const d = val.replace(/\D/, "").slice(-1);
    const next = [...codeDigits];
    next[i] = d;
    setCodeDigits(next);
    setError("");
    if (d && i < 5) codeRefs[i + 1].current?.focus();
  };
  const handleDigitKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[i] && i > 0) {
      codeRefs[i - 1].current?.focus();
    }
    if (e.key === "Enter") handleVerify();
  };
  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...codeDigits];
    for (let i = 0; i < 6; i++) next[i] = text[i] ?? "";
    setCodeDigits(next);
    const last = Math.min(text.length, 5);
    codeRefs[last].current?.focus();
  };

  // ─── コード検証 → アカウント作成 → サインイン ───
  const handleVerify = async () => {
    const code = codeDigits.join("");
    if (code.length < 6) { setError("6桁のコードを入力してください"); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/verify-code", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: regEmail, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "認証に失敗しました"); return; }

      // 本登録完了 → 自動ログイン
      setStage("done");
      await signIn("credentials", {
        email: regEmail, password: regPw,
        callbackUrl, redirect: true,
      });
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ─── メール再送信 ───
  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/send-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: regName, email: regEmail, password: regPw }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "再送信に失敗しました");
      else {
        setCodeDigits(["", "", "", "", "", ""]);
        setTimeout(() => codeRefs[0].current?.focus(), 50);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── 通常ログイン ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: loginEmail, password: loginPw, redirect: false,
      });
      if (res?.error) setError("メールアドレスまたはパスワードが正しくありません");
      else router.replace(callbackUrl);
    } finally {
      setLoading(false);
    }
  };

  // ─── ローディング ───
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     認証コード入力画面
  ══════════════════════════════════════════════════════════ */
  if (mode === "register" && stage === "verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
        <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

        <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <JisappLogo href="/" />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md" style={{ animation: "fadeInUp .3s ease-out" }}>

            {/* アイコン */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
                <Mail className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900">メールを確認してください</h1>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                <span className="font-semibold text-emerald-700">{regEmail}</span> に<br />
                6桁の認証コードを送信しました
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">

              {/* エラー */}
              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* 6桁入力 */}
              <div className="mb-6">
                <label className="mb-3 block text-center text-sm font-semibold text-gray-600">
                  認証コードを入力
                </label>
                <div className="flex justify-center gap-2" onPaste={handleDigitPaste}>
                  {codeDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={codeRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKey(i, e)}
                      className={`h-14 w-12 rounded-2xl border-2 text-center text-xl font-black outline-none transition-all
                        ${d
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-gray-50 text-gray-900"}
                        focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-400/20`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || codeDigits.join("").length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <><ShieldCheck className="h-4 w-4" />認証して登録完了</>
                }
              </button>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button
                  onClick={() => { setStage("form"); setError(""); }}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />戻る
                </button>
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />コードを再送信
                </button>
              </div>

              <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-700 ring-1 ring-amber-200">
                メールが届かない場合は迷惑メールフォルダもご確認ください
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     メインのログイン・新規登録画面
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* ヘッダー */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <JisappLogo href="/" />
          <Link href="/" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
            トップに戻る
          </Link>
        </div>
      </header>

      {/* カード */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md" style={{ animation: "fadeInScale .25s ease-out" }}>

          {/* タイトル */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-200">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              {mode === "login" ? "おかえりなさい" : "アカウントを作成"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "login"
                ? "ジサップへログインしてください"
                : "クリエイターとして参加しましょう"}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">

            {/* タブ */}
            <div className="mb-6 flex rounded-2xl bg-gray-100 p-1">
              {(["login", "register"] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); setStage("form"); }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    mode === m
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "login" ? "ログイン" : "新規登録"}
                </button>
              ))}
            </div>

            {/* Google ボタン */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <GoogleIcon />
              Google でログイン
            </button>

            {/* 区切り */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">または</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* エラー */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ─── ログインフォーム ─── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field
                  label="メールアドレス"
                  icon={<Mail className="h-4 w-4 text-gray-400" />}
                  type="email"
                  value={loginEmail}
                  onChange={setLoginEmail}
                  placeholder="your@email.com"
                />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">パスワード</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={loginPw}
                      onChange={e => setLoginPw(e.target.value)}
                      placeholder="パスワードを入力"
                      required
                      className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 transition"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <SubmitBtn loading={loading} label="ログイン" icon={<ArrowRight className="h-4 w-4" />} />
                <div className="text-center">
                  <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">
                    パスワードをお忘れですか？
                  </Link>
                </div>
              </form>
            )}

            {/* ─── 新規登録フォーム ─── */}
            {mode === "register" && stage === "form" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <Field
                  label="ユーザーネーム"
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  type="text"
                  value={regName}
                  onChange={setRegName}
                  placeholder="あなたのニックネーム"
                />
                <Field
                  label="メールアドレス"
                  icon={<Mail className="h-4 w-4 text-gray-400" />}
                  type="email"
                  value={regEmail}
                  onChange={setRegEmail}
                  placeholder="your@email.com"
                />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">パスワード（6文字以上）</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={regPw}
                      onChange={e => setRegPw(e.target.value)}
                      placeholder="パスワードを設定"
                      required
                      className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 transition"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <SubmitBtn loading={loading} label="確認メールを送信" icon={<Mail className="h-4 w-4" />} />
              </form>
            )}

            <p className="mt-5 text-center text-[11px] text-gray-400">
              登録・ログインすることで
              <Link href="/" className="text-emerald-600 hover:underline mx-1">利用規約</Link>および
              <Link href="/" className="text-emerald-600 hover:underline mx-1">プライバシーポリシー</Link>
              に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>

      {/* 登録完了スプラッシュ */}
      {stage === "done" && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">登録完了！</h2>
            <p className="text-sm text-gray-500">ジサップへようこそ。ログイン中...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Suspense ラッパー（useSearchParams 対応） ── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

/* ── 共通 Field コンポーネント ── */
function Field({
  label, icon, type, value, onChange, placeholder,
}: {
  label: string; icon: React.ReactNode;
  type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 transition"
        />
      </div>
    </div>
  );
}

/* ── 送信ボタン ── */
function SubmitBtn({ loading, label, icon }: { loading: boolean; label: string; icon: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-green-600 transition-all active:scale-[0.98] disabled:opacity-60"
    >
      {loading
        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        : <>{icon}{label}</>
      }
    </button>
  );
}
