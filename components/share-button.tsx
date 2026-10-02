"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Link2, Mail, X, Copy, CheckCircle2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import {
  canShareToMessenger,
  copyShareUrl,
  getFacebookShareUrl,
  getLineShareUrl,
  getMailShareUrl,
  getMessengerShareUrl,
  getTwitterShareUrl,
  nativeShare,
  openShareWindow,
  prefersNativeShare,
  shareToZalo,
  withUtm,
  type ShareSource,
} from "@/lib/share";
import { trackEvent } from "@/lib/analytics/client";

/**
 * 共有先の並び順。言語ごとに、その国でよく使われる SNS を先に出す。
 * ベトナムは Facebook・Zalo が人口の8割近く、X は1割未満（URL コピーは下に常に出す）
 */
const SHARE_ORDER: Record<Locale, ShareSource[]> = {
  ja: ["x", "line", "facebook", "mail"],
  en: ["x", "line", "facebook", "mail"],
  vi: ["facebook", "messenger", "zalo", "x"],
};

function MessengerBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.53-.04.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2Zm6 7.46-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
    </svg>
  );
}

/** ブランドマークは公式の形をインラインSVGで表示（文字での代用はしない） */
function XBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function FacebookBrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.45-4.92 8.45-9.94Z" />
    </svg>
  );
}

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
  const [zaloNote, setZaloNote] = useState(false);
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setZaloNote(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // 共有先ごとに計測用の UTM をつけた URL（日本語ページではつけない）
  const link = (source: ShareSource) => withUtm(url, source, locale);
  type Channel = { id: ShareSource; label: string; sub: string; icon: React.ReactNode; bg: string; action: () => void | Promise<void>; keepOpen?: boolean };
  const all: Partial<Record<ShareSource, Channel>> = {
    x: {
      id: "x",
      label: "X（Twitter）",
      sub: t("ポストする", "Post"),
      icon: <XBrandIcon className="h-4 w-4" />,
      bg: "bg-gray-900 text-white",
      action: () => openShareWindow(getTwitterShareUrl(link("x"), shareText)),
    },
    line: {
      id: "line",
      label: "LINE",
      sub: t("トーク・タイムライン", "Chats & timeline"),
      icon: <MessageCircle className="h-4 w-4" strokeWidth={2.5} />,
      bg: "bg-[#06C755] text-white",
      action: () => openShareWindow(getLineShareUrl(link("line"), shareText)),
    },
    facebook: {
      id: "facebook",
      label: "Facebook",
      sub: t("シェアする", "Share"),
      icon: <FacebookBrandIcon className="h-5 w-5" />,
      bg: "bg-[#1877F2] text-white",
      action: () => openShareWindow(getFacebookShareUrl(link("facebook"))),
    },
    messenger: canShareToMessenger()
      ? {
          id: "messenger",
          label: "Messenger",
          sub: t("メッセージで送る", "Send in a message"),
          icon: <MessengerBrandIcon className="h-5 w-5" />,
          bg: "bg-gradient-to-br from-[#0099FF] to-[#A033FF] text-white",
          action: () => {
            window.location.href = getMessengerShareUrl(link("messenger"));
          },
        }
      : undefined,
    zalo: {
      id: "zalo",
      label: "Zalo",
      sub: t("メッセージで送る", "Send in a message"),
      icon: <span className="text-[11px] font-black tracking-tight">Zalo</span>,
      bg: "bg-[#0068FF] text-white",
      // Zalo は ID なしで使える共有 URL がないため、OS の共有シートか URL のコピーで送る
      keepOpen: true,
      action: async () => {
        const result = await shareToZalo({ url: link("zalo"), title, text: shareText });
        if (result === "shared") onClose();
        else if (result === "copied") setZaloNote(true);
      },
    },
    mail: {
      id: "mail",
      label: t("メール", "Email"),
      sub: t("メールアプリで送る", "Send with your mail app"),
      icon: null,
      bg: "bg-emerald-600 text-white",
      action: () => {
        window.location.href = getMailShareUrl(link("mail"), title, shareText);
      },
    },
  };
  const channels = SHARE_ORDER[locale].map((id) => all[id]).filter((c): c is Channel => !!c);

  const sheet = (
    <div className="fixed inset-0 z-[500] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
      <div
        className="relative z-[501] w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-base font-black text-gray-900">{t("SNS・メッセージで共有", "Share on social or in a message")}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t("好きな媒体を選んでシェアできます", "Pick where you'd like to share")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            aria-label={t("閉じる", "Close")}
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
                trackEvent("share", { channel: ch.id });
                void ch.action();
                if (!ch.keepOpen) onClose();
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

        {zaloNote && (
          <p className="mx-5 -mt-1 mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
            {t("URLをコピーしました。Zaloを開いて、メッセージに貼り付けてください", "URL copied. Open Zalo and paste it into a message")}
          </p>
        )}
        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={async () => {
              trackEvent("share", { channel: "copy" });
              const ok = await copyShareUrl(link("copy"));
              if (ok) {
                setCopied(true);
                setTimeout(() => onClose(), 800);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Link2 className="h-4 w-4 text-emerald-600" />
            {copied ? t("URLをコピーしました！", "URL copied!") : t("URLをコピー", "Copy URL")}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}

export function ShareButton({
  url,
  title,
  text,
  className,
  size = "sm",
  variant = "outline",
  label,
}: ShareButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const t = useT();
  const locale = useLocale();
  if (label === undefined) label = t("共有する", "Share");
  const shareText = text ?? title ?? t("ジサップのアプリ", "A Jisapp app");
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (prefersNativeShare()) {
        const ok = await nativeShare({ url: withUtm(url, "native", locale), title, text: shareText });
        if (ok) {
          trackEvent("share", { channel: "native" });
          return;
        }
      }
      setSheetOpen(true);
    } finally {
      setSharing(false);
    }
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
        disabled={sharing}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-60",
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
        onClose={closeSheet}
        url={url}
        title={title}
        shareText={shareText}
      />
    </>
  );
}

type CopyUrlButtonProps = {
  url: string;
  className?: string;
  size?: "sm" | "md";
  variant?: "solid" | "outline" | "ghost";
  label?: string;
};

/** ワンタップでアプリURLをコピー */
export function CopyUrlButton({
  url,
  className,
  size = "sm",
  variant = "outline",
  label,
}: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useT();
  if (label === undefined) label = t("アプリURLをコピー", "Copy app URL");

  const handleCopy = async () => {
    const ok = await copyShareUrl(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pad = size === "sm" ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm";
  const base =
    variant === "solid"
      ? copied
        ? "bg-emerald-700 text-white"
        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
      : variant === "ghost"
        ? "bg-transparent text-gray-600 hover:bg-gray-100"
        : copied
          ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex w-full items-center justify-center gap-1.5 rounded-xl font-bold transition-all active:scale-[0.98]",
        pad,
        base,
        className
      )}
    >
      {copied ? (
        <>
          <CheckCircle2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {t("コピーしました", "Copied")}
        </>
      ) : (
        <>
          <Copy className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {label}
        </>
      )}
    </button>
  );
}

/** URL表示＋インラインコピーボタン */
export function AppUrlCopyField({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  const handleCopy = async () => {
    const ok = await copyShareUrl(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200",
        className
      )}
    >
      <span className="min-w-0 flex-1 break-all font-mono text-[11px] text-emerald-700 sm:text-xs">
        {url}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title={t("URLをコピー", "Copy URL")}
        aria-label={copied ? t("コピーしました", "Copied") : t("URLをコピー", "Copy URL")}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all active:scale-95 sm:text-xs",
          copied
            ? "bg-emerald-600 text-white"
            : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
        )}
      >
        {copied ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("コピー済", "Copied")}</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("コピー", "Copy")}</span>
          </>
        )}
      </button>
    </div>
  );
}

/** モーダル等で使うフル幅の共有ボタン（案C: 1ボタン＋シート） */
export function ShareButtonRow({
  url,
  title,
  text,
  className,
}: Omit<ShareButtonProps, "size" | "variant" | "label">) {
  const t = useT();
  return (
    <ShareButton
      url={url}
      title={title}
      text={text}
      size="md"
      variant="outline"
      label={t("SNS・メッセージで共有", "Share on social or in a message")}
      className={className}
    />
  );
}
