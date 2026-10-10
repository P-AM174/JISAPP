"use client";

import { useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, Check, CheckCircle2, Copy, LogIn, PartyPopper } from "lucide-react";
import Link from "@/lib/i18n/navigation";
import { AppUrlCopyField, ShareButton } from "@/components/share-button";
import { MiniPreview } from "@/components/app-catalog/mini-preview";
import { copyText } from "@/lib/playground/ai-launch";
import { useLocale, useT } from "@/lib/i18n/client";
import { format, localizePath } from "@/lib/i18n/config";

/**
 * 公開した直後の画面。
 * 1. 作れたら見せたくなる：アプリの画面を大きく見せ、「友だちに送って遊んでもらう」をいちばん目立たせる
 * 3. ゲストで公開した人には、ログインしないとあとから直せないことと、ログインの良さを伝える
 *    （ログインすると、このアプリはそのまま本人の作品として引き継がれる：GuestClaimGate）
 */
export function PublishSuccess({
  url,
  title,
  code,
  overwrite,
  listed,
  isGuest,
  groupBlock,
  onKeepEditing,
  onOpenApp,
  onHome,
}: {
  url: string;
  title: string;
  code: string;
  overwrite: boolean;
  listed: boolean;
  isGuest: boolean;
  groupBlock?: ReactNode;
  onKeepEditing: () => void;
  onOpenApp: () => void;
  onHome: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [postCopied, setPostCopied] = useState(false);
  const name = title || t("アプリ", "my app");
  const postText = format(
    t("ジサップで「{title}」を作った！遊んでみて👇\n{url}\n#ジサップ #個人開発", "I made “{title}” on Jisapp! Try it 👇\n{url}\n#Jisapp #buildinpublic"),
    { title: name, url }
  );

  const loginAndKeep = () => {
    // ログインしたらスタジオに戻ってくる。引き継ぎは GuestClaimGate が自動でする
    const back = localizePath("/playground?load=1", locale);
    try {
      sessionStorage.setItem("jisapp_login_return", back);
      sessionStorage.setItem("jisapp_signup_from", "publish_done");
    } catch { /* noop */ }
    void signIn("google", { callbackUrl: back });
  };

  return (
    <>
      <div className="shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pb-5 pt-5 text-center text-white">
        <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-white/85">
          <PartyPopper className="h-4 w-4" />
          {overwrite ? t("上書きしました", "Updated") : listed ? t("出品しました", "Published") : t("URLを発行しました", "Your URL is ready")}
        </p>
        <p className="mt-1 text-2xl font-black">{overwrite ? t("新しくなりました！", "It's updated!") : t("完成！", "It's done!")}</p>
        <div className="mx-auto mt-3 max-w-[260px] overflow-hidden rounded-xl bg-white shadow-lg ring-4 ring-white/30">
          <MiniPreview id="publish-done" html={code} fallbackGradient="from-emerald-500 to-teal-600" height={150} />
        </div>
        <p className="mt-2 truncate text-sm font-bold">{name}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6">
        {groupBlock}

        {/* いちばん目立たせる：友だちに送る */}
        <div className="space-y-2">
          <ShareButton
            url={url}
            title={name}
            text={format(t("ジサップで「{title}」を作った！遊んでみて", "I made “{title}” on Jisapp! Try it"), { title: name })}
            variant="solid"
            size="md"
            label={t("友だちに送って遊んでもらう", "Send it to friends to try")}
            className="py-3.5 text-base"
          />
          <button
            type="button"
            onClick={() => {
              void copyText(postText).then((ok) => {
                if (!ok) return;
                setPostCopied(true);
                window.setTimeout(() => setPostCopied(false), 2000);
              });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
          >
            {postCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {postCopied ? t("コピーしました。SNSに貼って投稿できます", "Copied. Paste it into a post") : t("SNSに投稿する文をコピー", "Copy a post for social media")}
          </button>
          <p className="whitespace-pre-line rounded-xl bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">{postText}</p>
        </div>

        {/* ゲストで公開した人へ：ログインしないと、あとから直せない */}
        {isGuest && !overwrite && (
          <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-sm font-black leading-snug text-amber-950">
              {t("ログインしないと、このアプリはあとから直せません", "Without signing in, you can't edit this app later")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900">
              {t("今ログインすると、このアプリはそのままあなたの作品になります。", "Sign in now and this app becomes yours as it is.")}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-900">
              {[
                t("あとから直して、同じURLのまま上書きできる", "Edit it later and update it at the same URL"),
                t("作ったアプリを、マイプロジェクトでまとめて管理できる", "Keep all your apps in My projects"),
                t("アプリのデータが、ほかの端末にも残る", "Your app data stays on your other devices too"),
                t("応援バッジをもらうと、お知らせが届く", "Get notified when people cheer for your app"),
              ].map((x) => (
                <li key={x} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />{x}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={loginAndKeep}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-black text-white shadow-sm hover:bg-amber-600"
            >
              <LogIn className="h-4 w-4" />
              {t("Googleでログインして、自分の作品にする", "Sign in with Google and keep it")}
            </button>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent("/playground?load=1")}`}
              onClick={() => { try { sessionStorage.setItem("jisapp_signup_from", "publish_done"); } catch { /* noop */ } }}
              className="mt-2 block text-center text-xs font-bold text-amber-800 underline"
            >
              {t("メールアドレスでログイン・登録する", "Sign in or sign up with email")}
            </Link>
          </div>
        )}

        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(format(t("ジサップで「{title}」を作った！遊んでみて👇\n#ジサップ #個人開発", "I made “{title}” on Jisapp! Try it 👇\n#Jisapp #buildinpublic"), { title: name }))}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {t("Xでシェアする", "Share on X")}
        </a>
        <div>
          <p className="mb-2 text-xs font-bold text-gray-600">{t("アプリの URL", "App URL")}</p>
          <AppUrlCopyField url={url} className="border border-emerald-200 py-2.5" />
          <p className="mt-1.5 text-[11px] text-gray-400">{t("URLを知っている人なら誰でもアクセス・使用できます", "Anyone with the URL can open and use it")}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onKeepEditing} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {t("編集を続ける", "Keep editing")}
          </button>
          <button onClick={onOpenApp} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700">
            {t("アプリを開く", "Open app")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={onHome} className="w-full py-1 text-xs font-semibold text-gray-400 transition-colors hover:text-emerald-600">
          {t("トップに戻る", "Back to home")}
        </button>
      </div>
    </>
  );
}
