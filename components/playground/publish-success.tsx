"use client";

import { useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { Check, ChevronDown, Copy, LogIn, MessageCircle, Send, Smartphone, SquarePlus, User, Users, X } from "lucide-react";
import Link from "@/lib/i18n/navigation";
import { LineBrandIcon, ShareButton, XBrandIcon } from "@/components/share-button";
import { PublishHero } from "@/components/playground/publish-hero";
import { PublishGroupInvite } from "@/components/playground/publish-group-invite";
import { copyText } from "@/lib/playground/ai-launch";
import { useLocale, useT } from "@/lib/i18n/client";
import { format, localizePath } from "@/lib/i18n/config";
import { AddToHomeSteps } from "@/components/add-to-home-guide";
import { getTwitterShareUrl, openLineShare, openShareWindow, withUtm } from "@/lib/share";
import { trackEvent } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";
import { buildSharedConvertMessage } from "@/lib/playground/prompt-template";
import { ShareActions } from '@/components/engagement/share-actions';
import { appSavesData } from '@/lib/apps/saves-data';
import { engagement } from '@/lib/analytics/engagement';
import { useEffect, useRef } from 'react';

/** このアプリを誰と使うか（公開した直後に聞く） */
type Audience = "me" | "friends" | "group";

/**
 * 公開した直後の画面。
 * 1. 作れたら見せたくなる：アプリの画面を大きく見せ、いちばん上に「URLをコピー」、その下に「LINEで送る」「Xでシェア」を並べる
 * 2. 「誰と使う？」を聞いて、その使い方に合った次の一歩（ホーム画面に置く・LINEで送る・グループを作る）まで案内する。
 *    調査（2026-10-15）：使われ続けたのは、作者が人に送ったアプリだけ。公開した人のうち送ったのは7人に1人だった
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
  sharesData = false,
  onKeepEditing,
  onOpenApp,
  onAddToHome,
  onHome,
}: {
  url: string;
  title: string;
  code: string;
  overwrite: boolean;
  listed: boolean;
  isGuest: boolean;
  groupBlock?: ReactNode;
  /** グループで同じデータを見る作りのアプリか（そうなら最初から「部活・グループ」を選んでおく） */
  sharesData?: boolean;
  onKeepEditing: () => void;
  onOpenApp: () => void;
  /** アプリのページを開き、「ホーム画面に追加」のシートを出す */
  onAddToHome?: () => void;
  onHome: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [postCopied, setPostCopied] = useState(false);
  const [audience, setAudience] = useState<Audience | null>(sharesData ? "group" : appSavesData(code) ? "me" : "friends");
  const appId = url.match(/\/apps\/([^/?#]+)/)?.[1] ?? '';
  const branch = sharesData ? 'group' : appSavesData(code) ? 'saved' : 'public';
  const exposure = useRef('');
  useEffect(()=>{if(appId && exposure.current!==appId){exposure.current=appId;engagement('publish_shown',appId,{branch});if(branch==='saved')engagement('home_shown',appId,{surface:'publish'});}},[appId,branch]);
  const [askCopied, setAskCopied] = useState(false);
  const name = title || t("アプリ", "my app");
  const postText = format(
    t("ジサップで「{title}」を作った！使ってみて👇\n{url}\n#ジサップ #個人開発", "I made “{title}” on Jisapp! Try it 👇\n{url}\n#Jisapp #buildinpublic"),
    { title: name, url }
  );

  // LINE・X・共有で送る文（どんなアプリにも合うように「使ってみて」）
  const shareText = format(t("ジサップで「{title}」を作った！使ってみて", "I made “{title}” on Jisapp! Try it"), { title: name });

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
    // 上の「完成！」も一緒にスクロールする（上を固定すると、下の招待などの欄が狭くなり分かりにくかった）
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <PublishHero appId={appId} url={url} title={name} code={code} overwrite={overwrite} listed={listed} showUrl={!(appId && sharesData)} compact={!!(appId && sharesData)} onOpenApp={onOpenApp} />

      <div className="space-y-4 p-6">
        {/* 次の一歩は1つだけ大きく出す：保存するアプリは「ホーム画面に追加」、シェア向けは「送る」、グループは「招待」。
            ホーム画面への追加とアイコンの確認は、アプリのページ（?home=1）でシートを出して案内する
            （この画面で Safari の「ホーム画面に追加」をすると、アプリではなくスタジオのページが追加されてしまうため） */}
        {appId && (sharesData ? <PublishGroupInvite appId={appId} title={name} isGuest={isGuest} onLogin={loginAndKeep} /> : appSavesData(code) ? (
          <section className="space-y-3">
            <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm"><Smartphone className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="text-base font-black text-sky-950">{t('ホーム画面に追加して、また使おう','Add it to your home screen')}</p>
                  <p className="text-xs text-sky-800/80">{t('次からは、アイコンから1タップで開けます','Next time, open it in one tap from the icon')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { engagement('home_cta', appId, { surface: 'publish' }); (onAddToHome ?? onOpenApp)(); }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-base font-black text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98]"
              >
                <SquarePlus className="h-5 w-5" />
                {t('ホーム画面に追加', 'Add to home screen')}
              </button>
            </div>
            <details className="group rounded-2xl bg-white ring-1 ring-slate-200">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
                <Send className="h-4 w-4 text-emerald-600" />
                <span className="flex-1">{t('友だちや家族にも送る', 'Send it to friends and family')}</span>
                <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-slate-100 p-3"><ShareActions appId={appId} url={url} title={name}/></div>
            </details>
          </section>
        ) : (
          <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="flex items-center gap-2 text-base font-black text-slate-900">
              <Send className="h-5 w-5 text-emerald-600" />
              {t('作ったアプリを送ろう', 'Send your new app')}
            </p>
            <ShareActions appId={appId} url={url} title={name}/>
          </section>
        ))}
        {/* いちばん上：URL をコピー、その下に LINE と X を同じ大きさで並べる */}
        {!appId && <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {locale === "ja" ? (
              <button
                type="button"
                onClick={() => {
                  // 先に記録する（スマホでは、このあと LINE アプリに切り替わってページを離れるため）
                  trackEvent("share", { channel: "line" });
                  openLineShare(withUtm(url, "line", locale), shareText);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 text-sm font-black text-white hover:brightness-95"
              >
                <LineBrandIcon className="h-5 w-5" />
                {t("LINEで送る", "Send on LINE")}
              </button>
            ) : (
              <ShareButton url={url} title={name} text={shareText} variant="solid" size="md" label={t("共有", "Share")} />
            )}
            <button
              type="button"
              onClick={() => {
                openShareWindow(getTwitterShareUrl(withUtm(url, "x", locale), `${shareText}\n${t("#ジサップ #個人開発", "#Jisapp #buildinpublic")}`));
                trackEvent("share", { channel: "x" });
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-black text-white hover:bg-slate-700"
            >
              <XBrandIcon className="h-4 w-4" />
              {t("Xでシェア", "Share on X")}
            </button>
          </div>
          {locale === "ja" && (
            <ShareButton url={url} title={name} text={shareText} variant="ghost" size="sm" label={t("ほかの方法で送る", "Other ways to send")} className="text-xs text-gray-500" />
          )}
          <p className="text-center text-[11px] text-gray-400">{t("URLを知っている人なら誰でもアクセス・使用できます", "Anyone with the URL can open and use it")}</p>
        </div>}

        {/* ゲストで公開した人へ：このままだと困ることを具体的に伝え、Google で1タップのログインを勧める。
            送るボタンのすぐ下に置く（下にあるとスクロールしないと見えず、押されていなかった：ChatGPT から来て公開した人の登録が0件だった） */}
        {/* グループのアプリでは、招待の欄（PublishGroupInvite）にログインの案内をまとめるので、ここには出さない */}
        {isGuest && !overwrite && !(appId && sharesData) && (
          <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="text-sm font-black leading-snug text-amber-950">
              {t("ログインしないと、このあと困ること", "If you don't sign in")}
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-950">
              {[
                t("直したくなっても、このアプリは直せません", "You can't edit this app later, even if you want to"),
                ...(listed ? [] : [t("2か月だれも開かないと、アプリが消えます", "The app is deleted if nobody opens it for 2 months")]),
                t("ほかのスマホやパソコンでは、続きを使えません", "You can't pick up where you left off on another phone or computer"),
                t("ホーム画面のアイコンを、自分で選べません", "You can't choose your own home screen icon"),
              ].map((x) => (
                <li key={x} className="flex gap-1.5">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" strokeWidth={3} />
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-xs font-bold text-amber-900">
              {t("Googleで1タップ・無料。ログインすると、このアプリはそのままあなたの作品になります。", "One tap with Google, free. Sign in and this app becomes yours as it is.")}
            </p>
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

        {/* 誰と使う？（選んだ人に、使い方のコツを出す。上書きのときは聞かない） */}
        {!appId && !overwrite && (
          <div className="rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
            <p className="text-sm font-black text-slate-900">{t("このアプリ、誰と使う？", "Who will use this app?")}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{t("選ぶと、使い方のコツが出ます", "Pick one to see tips")}</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {([
                { id: "me", icon: User, label: t("自分だけ", "Just me") },
                { id: "friends", icon: MessageCircle, label: t("友だち・家族", "Friends & family") },
                { id: "group", icon: Users, label: t("部活・グループ", "Club or group") },
              ] as const).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setAudience(o.id);
                    trackEvent("audience", { who: o.id });
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-xs font-bold ring-1 transition touch-manipulation",
                    audience === o.id ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-emerald-50"
                  )}
                >
                  <o.icon className="h-5 w-5" />
                  {o.label}
                </button>
              ))}
            </div>

            {audience === "me" && (
              <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-sky-100">
                <p className="flex items-center gap-1.5 text-sm font-black text-sky-900">
                  <Smartphone className="h-4 w-4" />
                  {t("ホーム画面に置いて、すぐ開けるようにしよう", "Put it on your home screen so you can open it any time")}
                </p>
                <p className="mb-2.5 mt-1 text-xs leading-relaxed text-slate-500">
                  {t("URLを覚えていなくても、アイコンから開けます。", "You can open it from an icon without remembering the URL.")}
                </p>
                <AddToHomeSteps openFirst />
              </div>
            )}

            {audience === "friends" && (
              <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-relaxed text-slate-700 ring-1 ring-emerald-100">
                {locale === "ja"
                  ? t("上の「LINEで送る」で、トークにそのまま送れます。一緒に使う人がいると、アプリはずっと使われ続けます。", "Send it from the buttons above. Apps keep getting used when someone uses them with you.")
                  : t("上のボタンから送れます。一緒に使う人がいると、アプリはずっと使われ続けます。", "Send it from the buttons above. Apps keep getting used when someone uses them with you.")}
              </p>
            )}

            {audience === "group" && (
              <div className="mt-3">
                {groupBlock || (
                  <div className="rounded-xl bg-white p-3 text-xs leading-relaxed text-slate-700 ring-1 ring-sky-100">
                    <p className="text-sm font-black text-sky-900">{t("グループのトークにURLを送ろう", "Send the URL to your group chat")}</p>
                    <p className="mt-1">
                      {t(
                        "このアプリは、データが一人ひとりの端末に保存される作りです。出欠や集金のように「みんなで同じデータを見たい」ときは、AIに次の文を送って作り直すと、グループで使えるようになります。",
                        "This app saves data separately on each person's device. If everyone should see the same data (like attendance or payments), send the message below to the AI and rebuild it to use it as a group."
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void copyText(buildSharedConvertMessage(code, locale)).then((ok) => {
                          if (!ok) return;
                          setAskCopied(true);
                          window.setTimeout(() => setAskCopied(false), 2000);
                        });
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-50 py-2 font-bold text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100"
                    >
                      {askCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {askCopied ? t("コピーしました。AIに貼って送ってください", "Copied. Paste it to the AI and send") : t("AIに送る文をコピー", "Copy the message for the AI")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {!appId && overwrite && groupBlock}

        {/* SNS に投稿する文（ホーム画面に追加・グループ招待が主役の画面では出さない。グループのアプリはアプリの URL を見せない） */}
        {!(appId && (sharesData || appSavesData(code))) && <div className="space-y-2">
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
        </div>}

        <button onClick={onKeepEditing} className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          {t("編集を続ける", "Keep editing")}
        </button>
        <button type="button" onClick={onHome} className="w-full py-1 text-xs font-semibold text-gray-400 transition-colors hover:text-emerald-600">
          {t("トップに戻る", "Back to home")}
        </button>
      </div>
    </div>
  );
}
