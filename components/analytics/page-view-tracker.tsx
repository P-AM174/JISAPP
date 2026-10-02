"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/client";

/** ページを表示するたびに page_view を送る（記録するかどうかはサーバーが決める） */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    // 運営画面は数えない
    if (/^\/(ja\/|en\/|vi\/)?admin(\/|$)/.test(pathname ?? "")) return;
    trackEvent("page_view");
  }, [pathname]);
  return null;
}
