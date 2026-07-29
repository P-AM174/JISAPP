"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X, Send, MessageSquare } from "lucide-react";

type ContactFormModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ContactFormModal({ open, onClose }: ContactFormModalProps) {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email ?? "";
  const sessionName = session?.user?.name ?? "";

  const [name, setName] = useState(sessionName);
  const [email, setEmail] = useState(sessionEmail);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/support/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim(),
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "送信に失敗しました");
        return;
      }
      setDone(true);
      setSubject("");
      setBody("");
    } catch {
      setError("送信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">運営への問い合わせ</h2>
              <p className="text-[11px] text-gray-400">通常1〜3営業日以内に返信します</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-bold text-gray-900">お問い合わせを受け付けました</p>
            <p className="mt-2 text-xs text-gray-500">
              返信は登録メール、またはログイン中の場合はトップページの通知ベルから確認できます。
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              閉じる
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            {!sessionEmail && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">お名前（任意）</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">メールアドレス</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                    placeholder="you@example.com"
                  />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">件名</label>
              <input
                type="text"
                required
                maxLength={100}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                placeholder="問い合わせの件名"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">内容</label>
              <textarea
                required
                rows={5}
                maxLength={2000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                placeholder="お問い合わせ内容を入力してください"
              />
            </div>
            {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {loading ? "送信中..." : "送信する"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
