"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, PartyPopper } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { buildSrcDoc } from "@/lib/products/build-srcdoc";
import { buildMediaPosterHtml, detectMediaUsage, THUMBNAIL_IFRAME_ALLOW } from "@/lib/apps/media-usage";
import { IconArt } from "@/lib/apps/icon-art";
import { autoIcon } from "@/lib/apps/icon-catalog";
import { copyText } from "@/lib/playground/ai-launch";
import { trackEvent } from "@/lib/analytics/client";

/** 紙吹雪の色（ジサップの緑に、明るい色を足す） */
const CONFETTI_COLORS = ["#FDE047", "#F472B6", "#60A5FA", "#FFFFFF", "#A7F3D0", "#FB923C"];

/** 公開したときに上から舞う紙吹雪。数秒で止まり、動きを減らす設定の人には出さない */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 13) % 10) / 10,
        duration: 2.2 + ((i * 7) % 10) / 10,
        size: 5 + ((i * 5) % 5),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
        drift: ((i * 29) % 60) - 30,
      })),
    []
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      <style>{`@keyframes jisapp-confetti{0%{transform:translate3d(0,-20px,0) rotate(0);opacity:1}100%{transform:translate3d(var(--drift),420px,0) rotate(540deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            animation: `jisapp-confetti ${p.duration}s ease-in ${p.delay}s 2 both`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/** スマホの形の枠に、アプリの画面を縮めて見せる */
function PhonePreview({ html, onClick, label }: { html: string; onClick: () => void; label: string }) {
  const srcDoc = useMemo(() => {
    const media = detectMediaUsage(html);
    return media ? buildMediaPosterHtml(media) : buildSrcDoc(html, null, null);
  }, [html]);
  const width = 132;
  const height = 236;
  const scale = width / 390;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative shrink-0 rounded-[26px] bg-slate-900 p-[6px] shadow-2xl shadow-emerald-950/40 ring-1 ring-white/20 transition hover:-translate-y-0.5"
    >
      <span className="absolute left-1/2 top-[9px] z-10 h-[5px] w-10 -translate-x-1/2 rounded-full bg-slate-900" />
      <span className="relative block overflow-hidden rounded-[20px] bg-white" style={{ width, height }}>
        <iframe
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          allow={THUMBNAIL_IFRAME_ALLOW}
          tabIndex={-1}
          aria-hidden
          style={{ width: 390, height: height / scale, transform: `scale(${scale})`, transformOrigin: "top left", border: "none", pointerEvents: "none" }}
        />
      </span>
    </button>
  );
}

/**
 * 公開を終えた画面のいちばん上。「完成！」のお祝いと、アプリの名刺（見本・アイコン・名前・URL）。
 * どの種類のアプリでも、ここに「URLをコピー」と「アプリを開く」を同じ形で置く
 */
export function PublishHero({
  appId,
  url,
  title,
  code,
  overwrite,
  listed,
  onOpenApp,
}: {
  appId: string;
  url: string;
  title: string;
  code: string;
  overwrite: boolean;
  listed: boolean;
  onOpenApp: () => void;
}) {
  const t = useT();
  const [icon, setIcon] = useState(() => autoIcon(title));
  const [copied, setCopied] = useState(false);

  // ホーム画面のアイコン（公開したときに保存したもの。読めなければアプリ名から選んだもの）
  useEffect(() => {
    if (!appId) return;
    let alive = true;
    fetch(`/api/apps/${appId}/appearance`)
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => { if (alive && v?.icon) setIcon(v); })
      .catch(() => {});
    return () => { alive = false; };
  }, [appId]);

  const shortUrl = url.replace(/^https?:\/\//, "");

  return (
    <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-600 px-5 pb-5 pt-5 text-white">
      {/* 水玉の模様と、光のにじみ */}
      <div aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.9) 1px, transparent 1.5px)", backgroundSize: "14px 14px" }} />
      <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-yellow-200/40 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-sky-300/40 blur-3xl" />
      {!overwrite && <Confetti />}

      <div className="relative">
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-white/90">
          <PartyPopper className="h-4 w-4" />
          {overwrite ? t("上書きしました", "Updated") : listed ? t("出品しました", "Published") : t("URLを発行しました", "Your URL is ready")}
        </p>
        <p className="mt-0.5 text-center text-3xl font-black tracking-tight drop-shadow-sm">
          {overwrite ? t("新しくなりました！", "It's updated!") : t("完成！", "It's done!")}
        </p>

        <div className="mt-4 flex items-center gap-4">
          <PhonePreview html={code} onClick={onOpenApp} label={t("アプリを開く", "Open app")} />
          <div className="min-w-0 flex-1">
            <div className="rounded-2xl bg-white/95 p-1 shadow-lg ring-1 ring-black/5 w-fit">
              <IconArt icon={icon.icon} color={icon.color} size={56} />
            </div>
            <p className="mt-2 line-clamp-2 text-lg font-black leading-tight">{title}</p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-300" />
              </span>
              {listed ? t("公開中・だれでも見つけられます", "Live · anyone can find it") : t("公開中・URLで使えます", "Live · open it with the URL")}
            </p>
          </div>
        </div>

        {/* URL と「コピー」「開く」：どの種類のアプリでも同じ場所に置く */}
        <div className="mt-4 flex items-stretch gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl bg-white/95 py-1 pl-3 pr-1 text-slate-800 shadow-md">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-500">{shortUrl}</span>
            <button
              type="button"
              onClick={() => {
                void copyText(url).then((ok) => {
                  if (!ok) return;
                  trackEvent("share", { channel: "copy" });
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                });
              }}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-black transition active:scale-95 ${copied ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("コピー済み", "Copied") : t("URLをコピー", "Copy URL")}
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenApp}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-3.5 text-xs font-black text-white shadow-md transition hover:bg-slate-800 active:scale-95"
          >
            {t("アプリを開く", "Open app")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
