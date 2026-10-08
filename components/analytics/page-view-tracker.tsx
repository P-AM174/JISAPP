"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/client";
import { recordNavigation } from "@/lib/nav-history";

/** ページを表示するたびに page_view を送る（記録するかどうかはサーバーが決める） */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    // 「戻る」ボタンでログイン画面を飛ばせるよう、見たページを覚えておく
    recordNavigation(`${window.location.pathname}${window.location.search}`);
    // 運営画面は数えない
    if (/^\/(ja\/|en\/|vi\/)?admin(\/|$)/.test(pathname ?? "")) return;
    trackEvent("page_view");
  }, [pathname]);
  return null;
}
