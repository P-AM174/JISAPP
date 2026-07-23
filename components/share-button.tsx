"use client";

import { useEffect, useState } from "react";
import { Share2, Link2, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  copyShareUrl,
  getFacebookShareUrl,
  getLineShareUrl,
  getMailShareUrl,
  getTwitterShareUrl,
  nativeShare,
  openShareWindow,
  prefersNativeShare,
} from "@/lib/share";

type ShareButtonProps = {
  url: string;
  title?: string;
  text?: string;
  className?: string;
  size?: "sm" | "md";
  variant?: "solid" | "outline" | "ghost";
  label?: string;
};

function ShareSheet({
  open,
  onClose,
  url,
  title,
  shareText,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  shareText: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const channels = [
    {
      id: "x",
      label: "X（Twitter）",
      sub: "ポストする",
      icon: "𝕏",
      bg: "bg-gray-900 text-white",
      action: () => openShareWindow(getTwitterShareUrl(url, shareText)),
    },
    {
      id: "line",
      label: "LINE",
      sub: "トーク・タイムライン",
      icon: "💬",
      bg: "bg-[#06C755] text-white",
      action: () => openShareWindow(getLineShareUrl(url, shareText)),
    },
    {
      id: "facebook",
      label: "Facebook",
      sub: "シェアする",
      icon: "f",
      bg: "bg-[#1877F2] text-white",
      action: () => openShareWindow(getFacebookShareUrl(url)),
    },
    {
      id: "mail",
      label: "メール",
      sub: "メールアプリで送る",
      icon: null,
      bg: "bg-emerald-600 text-white",
      action: () => {
        window.location.href = getMailShareUrl(url, title, shareText);
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-[401] w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-base font-black text-gray-900">SNS・メッセージで共有</p>
            <p className="mt-0.5 text-xs text-gray-500">好きな媒体を選んでシェアできます</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          {channels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                ch.action();
                onClose();
              }}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50 active:scale-[0.98]"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
                  ch.bg
                )}
              >
                {ch.icon ?? <Mail className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-gray-900">{ch.label}</span>
                <span className="block text-[10px] text-gray-400">{ch.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={async () => {
              const ok = await copyShareUrl(url);
              if (ok) {
                setCopied(true);
                setTimeout(() => onClose(), 800);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Link2 className="h-4 w-4 text-emerald-600" />
            {copied ? "URLをコピーしました！" : "URLをコピー"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShareButton({
  url,
  title,
  text,
  className,
  size = "sm",
  variant = "outline",
  label = "共有する",
}: ShareButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const shareText = text ?? title ?? "ジサップのアプリ";

  const handleShare = async () => {
    if (prefersNativeShare()) {
      const ok = await nativeShare({ url, title, text: shareText });
      if (ok) return;
    }
    setSheetOpen(true);
  };

  const pad = size === "sm" ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm";
  const base =
    variant === "solid"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
      : variant === "ghost"
        ? "bg-transparent text-gray-600 hover:bg-gray-100"
        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-xl font-bold transition-all active:scale-[0.98]",
          pad,
          base,
          className
        )}
      >
        <Share2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
      </button>

      <ShareSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        url={url}
        title={title}
        shareText={shareText}
      />
    </>
  );
}

/** モーダル等で使うフル幅の共有ボタン（案C: 1ボタン＋シート） */
export function ShareButtonRow({
  url,
  title,
  text,
  className,
}: Omit<ShareButtonProps, "size" | "variant" | "label">) {
  return (
    <ShareButton
      url={url}
      title={title}
      text={text}
      size="md"
      variant="outline"
      label="SNS・メッセージで共有"
      className={className}
    />
  );
}
