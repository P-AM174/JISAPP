"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import Link from "@/lib/i18n/navigation";

/** 管理者パスワードでログインする画面（ほかの管理画面と同じ） */
export function AdminLogin({ title, onDone }: { title: string; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (res.ok) onDone();
    else { setError(true); setPw(""); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f6f4] p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900">{title}</h1>
            <p className="mt-0.5 text-xs text-gray-400">管理者パスワードでログイン</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <input type={show ? "text" : "password"} value={pw} onChange={(e) => { setPw(e.target.value); setError(false); }} placeholder="管理者パスワード"
              className={`w-full rounded-2xl border px-4 py-3 pr-10 text-base outline-none ${error ? "border-rose-300 bg-rose-50" : "border-gray-200 bg-gray-50"}`} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="パスワードを表示">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-xs font-semibold text-rose-500">パスワードが正しくありません</p>}
          <button type="submit" className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700">ログイン</button>
        </form>
        <Link href="/admin/review" className="mt-4 block text-center text-xs text-gray-400 hover:text-emerald-600">← 運営管理に戻る</Link>
      </div>
    </div>
  );
}
