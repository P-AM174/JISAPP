"use client";

import { useEffect, useState } from "react";
import { localeFromPath, type Locale } from "@/lib/i18n/config";

/**
 * 画面が落ちたときの受け皿（app/[locale]/error.tsx と app/global-error.tsx から使う）。
 *
 * よくある原因は「更新より前に開いたままのタブ」（iPad の Safari などは何日もタブを持ち続ける）。
 * 古いページから別の画面に移ると、更新で入れ替わってもう無い部品を読みにいって落ちる。
 * この場合は自動で1回だけ読み込み直す（すぐ前にも読み込み直していたら、くり返さずに案内を出す）。
 * それ以外の原因では、英語のエラー画面ではなく、その言語で「再読み込み」を案内する。
 */

const RELOAD_KEY = "jisapp_crash_reload_at";

const TEXT: Record<Locale, { title: string; body: string; reload: string; home: string }> = {
  ja: {
    title: "問題が起きました",
    body: "ページを読み込み直すと直ることがほとんどです。",
    reload: "再読み込み",
    home: "トップへ",
  },
  en: {
    title: "Something went wrong",
    body: "Reloading the page usually fixes this.",
    reload: "Reload",
    home: "Home",
  },
  vi: {
    title: "Đã xảy ra sự cố",
    body: "Tải lại trang thường sẽ khắc phục được.",
    reload: "Tải lại",
    home: "Trang chủ",
  },
};

/** 更新で無くなった部品を読みにいって落ちたか */
function isStaleChunkError(error: Error): boolean {
  const text = `${error?.name ?? ""} ${error?.message ?? ""}`;
  return /ChunkLoadError|Loading (CSS )?chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(text);
}

/** 自動の読み込み直しを、すぐ前にしていなければする（くり返し読み込み直す事故を防ぐ） */
function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function CrashScreen({ error }: { error: Error & { digest?: string } }) {
  const [locale, setLocale] = useState<Locale>("ja");
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    setLocale(localeFromPath(window.location.pathname) ?? "ja");
    console.error("[crash]", error);
    if (isStaleChunkError(error) && reloadOnce()) setReloading(true);
  }, [error]);

  const s = TEXT[locale];
  const home = locale === "ja" ? "/" : `/${locale}`;

  if (reloading) {
    return <div style={{ minHeight: "100vh", background: "#f9fafb" }} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        background: "#f9fafb",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 700, color: "#374151", margin: 0 }}>{s.title}</p>
      <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>{s.body}</p>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 22px",
            borderRadius: 9999,
            border: "none",
            background: "#059669",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {s.reload}
        </button>
        <a
          href={home}
          style={{
            padding: "10px 22px",
            borderRadius: 9999,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#374151",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {s.home}
        </a>
      </div>
    </div>
  );
}
