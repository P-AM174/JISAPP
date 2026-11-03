"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/**
 * スマホでは X のアプリの投稿画面を直接開く。
 * https://x.com/intent/post だと X のアプリは開くが、アプリの中のブラウザで投稿画面が出てしまうため、
 * アプリ用の twitter://post を使う。アプリが入っていない・開けなかったとき（画面が残っている）は、ブラウザの投稿画面を開く
 */
function openXApp(e: React.MouseEvent<HTMLAnchorElement>, text: string, url: string) {
  if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;
  e.preventDefault();
  const web = e.currentTarget.href;
  let left = false;
  const onHide = () => { if (document.visibilityState === "hidden") left = true; };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);
  window.location.href = `twitter://post?message=${encodeURIComponent(`${text}\n${url}`)}`;
  setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
    if (!left && document.visibilityState === "visible") window.location.href = web;
  }, 1500);
}

/** 記事を X でシェア（スマホでは X のアプリの投稿画面が開く）・URL をコピー */
export function ColumnShare({ url, text, en }: { url: string; text: string; en?: boolean }) {
  const [copied, setCopied] = useState(false);
  const xHref = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  return (
    <div className="flex items-center gap-2">
      <a href={xHref} onClick={(e) => openXApp(e, text, url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden><path d="M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L.1 1.2h7.6l5.2 6.9 6-6.9Zm-1.3 19.4h2L6.5 3.3H4.3l13.3 17.3Z" /></svg>
        {en ? "Share" : "ポスト"}
      </a>
      <button data-column-click="copy" onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {})}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-gray-600 ring-1 ring-gray-200">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}{copied ? (en ? "Copied" : "コピーしました") : (en ? "Copy link" : "リンクをコピー")}
      </button>
    </div>
  );
}
