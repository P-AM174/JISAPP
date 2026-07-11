"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, X } from "lucide-react";

interface PurchaseBarProps {
  appName: string;
  priceLabel: string;
  isFree: boolean;
  dummyCode: string;
}

export function PurchaseBar({ appName, priceLabel, isFree, dummyCode }: PurchaseBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dummyCode);
    } catch {
      // fallback for environments without clipboard API
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ── 固定購入バー ── */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-2xl shadow-black/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">{appName}</p>
            <p className="text-xl font-black tracking-tight text-gray-900">{priceLabel}</p>
            {!isFree && <p className="text-[11px] text-gray-400">税込 · 買い切り</p>}
            {isFree && <p className="text-[11px] font-semibold text-emerald-600">永久無料</p>}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-300/50 transition-all hover:bg-emerald-700 hover:shadow-emerald-400/50 active:scale-[0.97]"
          >
            {isFree ? "今すぐ無料で使う" : "今すぐ購入する"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── 購入完了モーダル ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-black/20">
            {/* 閉じるボタン */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/30 p-1.5 backdrop-blur-sm transition-colors hover:bg-white/50"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            {/* ヘッダー */}
            <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 px-6 pb-8 pt-8 text-center">
              {/* 装飾 */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="relative">
                <div className="mb-3 text-5xl">🎉</div>
                <h2 className="text-xl font-black text-white">ご購入ありがとうございました！</h2>
                <p className="mt-1.5 text-sm text-emerald-100">
                  「{appName}」のソースコードを取得しました
                </p>
              </div>
            </div>

            {/* ボディ */}
            <div className="p-5">
              {/* コードブロックヘッダー */}
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">📦 ソースコード</p>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                    copied
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  }`}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "コピーしました！" : "コードをコピー"}
                </button>
              </div>

              {/* コードブロック */}
              <pre className="max-h-56 overflow-y-auto overflow-x-auto rounded-xl bg-gray-900 p-4 font-mono text-xs leading-relaxed text-emerald-300">
                {dummyCode}
              </pre>

              {/* 次のアクション */}
              <div className="mt-5 flex flex-col gap-2.5">
                <Link
                  href="/mypage"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
                >
                  マイページで購入済みアプリを確認する
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  閉じて詳細画面に戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
