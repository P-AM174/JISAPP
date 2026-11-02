"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { EXCLUDED_BROWSER_KEY, isExcludedAccount } from "@/lib/analytics/excluded";

/**
 * 運営・本人（lib/analytics/excluded.ts）がログインしたブラウザと、運営画面を開いたブラウザに
 * 「計測しない」の印を付ける。ログアウトしたあとの確認操作も数えないため
 */
export function AnalyticsOptOut() {
  const { data: session } = useSession();
  const pathname = usePathname();
  useEffect(() => {
    const user = session?.user as { name?: string | null; role?: string } | undefined;
    const admin = /^\/(ja\/|en\/|vi\/)?admin(\/|$)/.test(pathname ?? "");
    if (!isExcludedAccount(user) && !admin) return;
    try {
      localStorage.setItem(EXCLUDED_BROWSER_KEY, "1");
    } catch { /* noop */ }
  }, [session, pathname]);
  return null;
}
