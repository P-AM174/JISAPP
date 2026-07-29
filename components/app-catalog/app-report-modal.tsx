"use client";

import { useState } from "react";
import { Flag, X, CheckCircle2, AlertCircle } from "lucide-react";
import { APP_REPORT_REASONS } from "@/lib/reports/reasons";

export function AppReportModal({
  appId,
  appName,
  open,
  onClose,
}: {
  appId: string | number;
  appName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleClose = () => {
    setDone(false);
    setError("");
    setReason("");
    setDetail("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    if (!reason) {
      setError("理由を選択してください");
      return;
    }
    if (detail.trim().length < 5) {
      setError("詳細は5文字以上で入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/apps/${appId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, detail: detail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "送信に失敗しました");
        return;
      }
      setDone(true);
    } catch {
      setError("送信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
              <Flag className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-sm font-black text-gray-900">アプリを報告</span>
          </div>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="mb-1 font-bold text-gray-900">報告を受け付けました</p>
            <p className="mb-5 text-xs text-gray-500">内容を確認後、適切に対処します。</p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-2xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200"
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <p className="text-xs text-gray-500">報告対象: {appName}</p>
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-600">報告理由</label>
              <div className="space-y-2">
                {APP_REPORT_REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="radio"
                      name="report-reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-4 w-4 accent-rose-500"
                    />
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">詳細</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="具体的な問題点を入力してください"
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:bg-white"
              />
            </div>
            {error && (
              <p className="flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? "送信中..." : "報告を送信"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
