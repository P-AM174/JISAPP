"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, X } from "lucide-react";
import Link from "@/lib/i18n/navigation";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/config";

/**
 * ゲストで公開したアプリの「引き継ぎの印」を、この端末に覚えておく（公開した直後に呼ぶ）。
 * ログインしたら GuestClaimGate が自動で本人の作品にする
 */
const KEY = "jisapp_guest_claims";
type Claim = { appId: string; token: string; title: string };

function readClaims(): Claim[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((c) => c && typeof c.appId === "string" && typeof c.token === "string") : [];
  } catch {
    return [];
  }
}
function writeClaims(list: Claim[]) {
  try {
    if (list.length) localStorage.setItem(KEY, JSON.stringify(list.slice(-20)));
    else localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
export function rememberGuestClaim(claim: Claim) {
  writeClaims([...readClaims().filter((c) => c.appId !== claim.appId), claim]);
}

/** ログインしている人の端末に引き継ぎの印があれば、本人の作品にしてお知らせを出す */
export function GuestClaimGate() {
  const t = useT();
  const { data: session, status } = useSession();
  const [done, setDone] = useState<string[]>([]);
  const ready = status === "authenticated" && (session?.user as { usernameSet?: boolean } | undefined)?.usernameSet !== false;

  useEffect(() => {
    if (!ready) return;
    const claims = readClaims();
    if (!claims.length) return;
    let cancelled = false;
    fetch("/api/apps/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: claims.map(({ appId, token }) => ({ appId, token })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { claimed?: { id: string; title: string }[]; invalid?: string[] } | null) => {
        if (!d || cancelled) return;
        const gone = new Set([...(d.claimed ?? []).map((c) => c.id), ...(d.invalid ?? [])]);
        writeClaims(readClaims().filter((c) => !gone.has(c.appId)));
        if (d.claimed?.length) setDone(d.claimed.map((c) => c.title));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!done.length) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-24 z-[700] flex justify-center px-4 md:bottom-6">
      <div className="flex max-w-md items-start gap-3 rounded-2xl bg-emerald-700 px-4 py-3 text-sm text-white shadow-2xl">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 leading-relaxed">
          <p className="font-bold">
            {format(t("「{title}」をあなたの作品にしました", "“{title}” is now yours"), { title: done.join("」「") })}
          </p>
          <p className="text-emerald-100">
            {t("マイプロジェクトから、あとで直して上書き公開できます。", "You can edit and update it later from My projects.")}{" "}
            <Link href="/projects" className="font-bold underline">{t("マイプロジェクトへ", "Go to My projects")}</Link>
          </p>
        </div>
        <button type="button" onClick={() => setDone([])} aria-label={t("閉じる", "Close")} className="rounded-full p-1 hover:bg-white/15">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
