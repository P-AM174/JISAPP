"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";

/**
 * プロンプトを貼ってしまったときの案内の下に出す「運営にアプリを作ってもらう（無料）」。
 * ログインしている人はボタンだけ、ログインしていない人はメールアドレスを書いてもらう（その人の分だけ残す）
 */
export function StuckRequest({ prompt, isLoggedIn }: { prompt: string; isLoggedIn: boolean }) {
  const t = useT();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const send = async () => {
    setState("sending");
    const res = await fetch("/api/studio/stuck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, locale, requested: true, ...(isLoggedIn ? {} : { email }) }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  };

  if (state === "done") {
    return (
      <p className="rounded-xl bg-violet-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-violet-800 ring-1 ring-violet-100">
        {t("受け付けました。運営がアプリにして、できあがったらメールでお知らせします。", "Got it. The Jisapp team will build it and email you when it's ready.")}
      </p>
    );
  }
  return (
    <div className="rounded-xl bg-violet-50 p-3 ring-1 ring-violet-100">
      <p className="flex items-center gap-1.5 text-xs font-black text-violet-900">
        <Sparkles className="h-3.5 w-3.5" />
        {t("うまくいかないときは、運営が代わりにアプリにします（無料）", "Stuck? The Jisapp team can build it for you (free)")}
      </p>
      {!isLoggedIn && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-white px-2.5 ring-1 ring-violet-200">
          <Mail className="h-3.5 w-3.5 shrink-0 text-violet-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("できあがりを受け取るメールアドレス", "Email to receive your app")}
            className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => void send()}
        disabled={state === "sending" || (!isLoggedIn && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))}
        className="mt-2 w-full rounded-lg bg-violet-600 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {state === "sending" ? t("送っています…", "Sending…") : t("運営にアプリを作ってもらう", "Ask the team to build it")}
      </button>
      {state === "error" && <p className="mt-1 text-[11px] text-rose-600">{t("送れませんでした。少し待ってからもう一度お試しください。", "Couldn't send. Please try again in a moment.")}</p>}
      <p className="mt-1.5 text-[10px] leading-relaxed text-violet-700/80">
        {t("貼った文章を運営が確認して、アプリにしてお届けします。", "The team will read the text you pasted and send you the app.")}
        {isLoggedIn && t("ログインしている場合、うまく作れなかったときの文章は、頼まなくても運営が確認してお届けすることがあります。", " When you're signed in, the team may also check text that didn't work and send you an app.")}
      </p>
    </div>
  );
}
