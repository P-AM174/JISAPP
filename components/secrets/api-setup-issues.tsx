"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, Plus } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/config";
import { copyText } from "@/lib/playground/ai-launch";
import { buildApiFixMessage } from "@/lib/secrets/api-fix-message";
import { checkApiSetup, detectApiUse, type ApiSetupCheck } from "@/lib/secrets/detect-api-use";

type ApiSetupPublishCheckProps = {
  code: string;
  /** キーを登録するアプリ。まだないとき（ゲスト・未準備）は null */
  appId?: string | null;
  isLoggedIn: boolean;
  onRegister?: (name: string) => void;
  /** 変わるたびに、登録されているキーを読み直す（APIキーの画面を閉じたときなど） */
  reloadKey?: unknown;
  className?: string;
};

/**
 * 公開設定で、外部APIがつながっていないところを知らせる（公開は止めない）。
 * 登録されているキーを読み、コードの secret 名・外部APIの呼び方と照らし合わせる
 */
export function ApiSetupPublishCheck({ code, appId, isLoggedIn, onRegister, reloadKey, className = "" }: ApiSetupPublishCheckProps) {
  const t = useT();
  // ?appid= などでキーを直接付けているだけのアプリも、確かめる対象にする
  const usesApi = useMemo(() => detectApiUse(code).usesApi || checkApiSetup(code, []).directKeyParam, [code]);
  const [registered, setRegistered] = useState<string[] | null>(null);

  useEffect(() => {
    if (!usesApi) return;
    if (!isLoggedIn || !appId) {
      setRegistered([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/secrets/app?appId=${encodeURIComponent(appId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { secrets?: { name: string }[] } | null) => {
        if (!cancelled) setRegistered((data?.secrets ?? []).map((s) => s.name));
      })
      .catch(() => {
        if (!cancelled) setRegistered(null);
      });
    return () => {
      cancelled = true;
    };
  }, [usesApi, appId, isLoggedIn, reloadKey]);

  const check = useMemo(() => (usesApi && registered ? checkApiSetup(code, registered) : null), [usesApi, registered, code]);
  if (!check || !registered) return null;

  return (
    <ApiSetupIssues
      code={code}
      check={check}
      registeredNames={registered}
      onRegister={isLoggedIn ? onRegister : undefined}
      cannotRegisterNote={
        !isLoggedIn
          ? t("APIキーを登録するには、ログインが必要です。ログインしてから、開発スタジオの「…」メニュー →「APIキーの登録」で登録してください。", "You need to sign in to register API keys. After signing in, register it from the “…” menu → “Register API key” in the Studio.")
          : !onRegister
            ? t("このアプリを開発スタジオで開き、「…」メニュー →「APIキーの登録」で登録してください。", "Open this app in the Studio and register it from the “…” menu → “Register API key”.")
            : undefined
      }
      className={className}
    />
  );
}

type ApiSetupIssuesProps = {
  code: string;
  check: ApiSetupCheck;
  registeredNames: string[];
  /** まだ登録されていない名前の「登録する」ボタン。渡さないときは出さない */
  onRegister?: (name: string) => void;
  /** ログインしていないなど、キーを登録できないとき */
  cannotRegisterNote?: string;
  className?: string;
};

/**
 * 外部APIがジサップの仕組みにつながっていないところを知らせる。
 * キーの登録が足りないときは登録へ、コードが合っていないときは AI に貼る直し方の文をコピーできるようにする
 */
export function ApiSetupIssues({ code, check, registeredNames, onRegister, cannotRegisterNote, className = "" }: ApiSetupIssuesProps) {
  const t = useT();
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const needsCodeFix = check.unused.length > 0 || check.aiWithoutSecret || check.directKeyParam;

  if (check.missing.length === 0 && !needsCodeFix) return null;

  return (
    <div role="note" className={`space-y-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-950 ${className}`}>
      <p className="flex items-start gap-1.5 text-sm font-black">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" strokeWidth={2.5} />
        {t("このままでは外部APIがつながりません", "The external API won't connect as is")}
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {check.missing.map((name) => (
          <li key={`missing-${name}`}>
            {format(t("コードは「{name}」というキーを使いますが、まだ登録されていません。", "The code uses a key named “{name}”, but it isn't registered yet."), { name })}
            {onRegister && (
              <button
                type="button"
                onClick={() => onRegister(name)}
                className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
              >
                <Plus className="h-3 w-3" strokeWidth={3} />
                {format(t("{name} を登録する", "Register {name}"), { name })}
              </button>
            )}
          </li>
        ))}
        {check.unused.map((name) => (
          <li key={`unused-${name}`}>
            {format(t("「{name}」を登録しましたが、コードはまだこのキーを使っていません（コードに secret: '{name}' がありません）。", "You registered “{name}”, but the code doesn't use this key yet (there's no secret: '{name}' in the code)."), { name })}
          </li>
        ))}
        {check.aiWithoutSecret && (
          <li>{t("コードは AI のサービスを呼んでいますが、ジサップに登録したキーを使う形（secret）になっていません。", "The code calls an AI service, but not in the way that uses a key registered on Jisapp (secret).")}</li>
        )}
        {check.directKeyParam && (
          <li>{t("URL に ?key= などを付けて、外部に直接送っているところがあります。キーはコードに書かず、ジサップに登録して secret で使ってください。", "Some URLs send a key directly with ?key= etc. Don't put keys in the code: register them on Jisapp and use secret.")}</li>
        )}
      </ul>
      {cannotRegisterNote && check.missing.length > 0 && <p className="font-bold">{cannotRegisterNote}</p>}
      {needsCodeFix && (
        <div className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-rose-100">
          <p>{t("コードを直す必要があります。下のボタンで直し方の文をコピーし、コードを作った AI（ChatGPT など）に貼って、出てきたコードを貼り直してください。", "The code needs fixing. Copy the fix request below, paste it into the AI that made the code (ChatGPT, etc.), then paste back the code it gives you.")}</p>
          <button
            type="button"
            onClick={() => {
              void copyText(buildApiFixMessage(code, check, registeredNames, locale)).then((ok) => {
                if (!ok) return;
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2500);
              });
            }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700"
          >
            {copied ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("コピーしました", "Copied") : t("AIに貼る直し方の文をコピー", "Copy the fix request for the AI")}
          </button>
        </div>
      )}
    </div>
  );
}
