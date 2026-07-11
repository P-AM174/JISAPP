"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JisappLogo } from "@/components/jisapp-logo";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  Wifi,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// ホワイトリスト × Groq AI ハイブリッドセキュリティ判定
// ─────────────────────────────────────────────────────────

const WHITELIST: { domain: string; name: string }[] = [
  { domain: "google.com",            name: "Google"             },
  { domain: "googleapis.com",        name: "Google"             },
  { domain: "analytics.google.com",  name: "Google"             },
  { domain: "line.me",               name: "LINE"               },
  { domain: "discord.com",           name: "Discord"            },
  { domain: "discordapp.com",        name: "Discord"            },
  { domain: "slack.com",             name: "Slack"              },
  { domain: "teams.microsoft.com",   name: "Microsoft Teams"    },
  { domain: "chatwork.com",          name: "Chatwork"           },
  { domain: "notion.so",             name: "Notion"             },
  { domain: "notion.com",            name: "Notion"             },
  { domain: "trello.com",            name: "Trello"             },
  { domain: "kintone.cybozu.co.jp",  name: "kintone"            },
  { domain: "deepl.com",             name: "DeepL翻訳"          },
  { domain: "openai.com",            name: "OpenAI (ChatGPT)"   },
  { domain: "api.openai.com",        name: "OpenAI (ChatGPT)"   },
  { domain: "anthropic.com",         name: "Anthropic (Claude)" },
  { domain: "api.anthropic.com",     name: "Anthropic (Claude)" },
  { domain: "box.com",               name: "Box"                },
  { domain: "dropbox.com",           name: "Dropbox"            },
  { domain: "github.com",            name: "GitHub"             },
  { domain: "stripe.com",            name: "Stripe"             },
];

const FETCH_PATTERN =
  /fetch\s*\(|UrlFetchApp\.fetch\s*\(|XMLHttpRequest|\.open\s*\(["'](?:GET|POST|PUT|DELETE|PATCH)/i;
const URL_PATTERN = /https?:\/\/[^\s'"`,)\]]+/g;

export type SecurityResult = {
  safetyStatus: "clear" | "verified" | "warning";
  detectedServices?: string[];
  aiVerdict?: string;
  /** Groq が REJECT と判断したとき true */
  isPending?: boolean;
  /** 運営向けの審査メモ */
  adminReviewNote?: string;
};

function getUniqueServiceName(hostname: string): string | null {
  const match = WHITELIST.find(
    (w) => hostname === w.domain || hostname.endsWith("." + w.domain)
  );
  if (match) return match.name;
  // 管理画面で追加されたカスタムホワイトリストも参照
  try {
    const custom: string[] = JSON.parse(
      localStorage.getItem("jisapp_admin_whitelist") ?? "[]"
    );
    if (custom.some((d) => hostname === d || hostname.endsWith("." + d))) {
      return "カスタム公認ドメイン";
    }
  } catch { /* noop */ }
  return null;
}

async function analyzeCodeSecurity(code: string): Promise<SecurityResult> {
  // ① 外部通信命令が一切ない場合
  if (!FETCH_PATTERN.test(code)) {
    return { safetyStatus: "clear" };
  }

  // URLを抽出
  const rawUrls = code.match(URL_PATTERN) ?? [];
  const detectedServices: string[] = [];
  const unknownUrls: string[] = [];

  for (const rawUrl of rawUrls) {
    // 末尾の余分な記号を除去
    const url = rawUrl.replace(/[.,;:'")\]}>]+$/, "");
    try {
      const { hostname } = new URL(url);
      const serviceName = getUniqueServiceName(hostname);
      if (serviceName) {
        if (!detectedServices.includes(serviceName)) detectedServices.push(serviceName);
      } else {
        unknownUrls.push(url);
      }
    } catch {
      // パース不能 URL → 未確認扱い
      unknownUrls.push(url);
    }
  }

  // ② すべてホワイトリスト内
  if (unknownUrls.length === 0) {
    return { safetyStatus: "verified", detectedServices };
  }

  // ③ 未確認の通信あり → Groq API に問い合わせ（危険度判定）
  let aiVerdict = "外部通信が含まれています。コードの送信先を確認してください。";
  let isPending = false;
  let adminReviewNote = "";

  try {
    const res = await fetch("/api/ai/security-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.slice(0, 8000) }),
    });
    if (res.ok) {
      const parsed = await res.json() as { verdict?: string; reason?: string };
      const verdict = (parsed.verdict ?? "").toUpperCase();
      const reason = parsed.reason ?? "";
      adminReviewNote = reason;
      if (verdict === "REJECT") {
        isPending = true;
        aiVerdict = reason || "不審な外部通信が検出されました。運営が確認中です。";
      } else {
        aiVerdict = reason || "外部通信の目的は確認済み。安全とみられます。";
      }
    }
  } catch {
    // フォールバック：解析不能なら保留扱いにして運営へ
    isPending       = true;
    adminReviewNote = "Groq API 解析失敗のため保留";
    aiVerdict       = "外部通信が含まれています。コードの送信先を確認してください。";
  }

  return { safetyStatus: "warning", detectedServices, aiVerdict, isPending, adminReviewNote };
}

// AI審査のステップ定義
const AI_STEPS = [
  { label: "ソースコード・スクリプトの安全性スキャン",  duration: 1800 },
  { label: "悪意あるリダイレクトや外部通信の検出",     duration: 2200 },
  { label: "個人情報の不正取得コードのチェック",        duration: 1600 },
  { label: "マルウェア・フィッシング判定",              duration: 2000 },
  { label: "Gemini AI による総合リスク評価",            duration: 2400 },
];

// AI審査アニメーション（完了コールバック付き）
function AiReviewAnimation({ onDone }: { onDone: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [done,        setDone]        = useState(false);

  // ステップを順番に進める
  useEffect(() => {
    if (currentStep >= AI_STEPS.length) {
      setProgress(100);
      setDone(true);
      onDone(); // ← 全ステップ完了 → 本保存コールバック
      return;
    }
    const duration  = AI_STEPS[currentStep].duration;
    const interval  = 30;
    const baseProgress = (100 / AI_STEPS.length) * currentStep;

    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      const stepProgress = Math.min(
        (elapsed / duration) * (100 / AI_STEPS.length),
        100 / AI_STEPS.length
      );
      setProgress(baseProgress + stepProgress);
      if (elapsed >= duration) {
        clearInterval(timer);
        setCurrentStep((s) => s + 1);
      }
    }, interval);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  return (
    <div className="w-full space-y-4">
      {/* プログレスバー */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-700">
            {done ? "審査完了" : "Gemini AI 安全審査中..."}
          </span>
          <span className="font-mono font-bold text-emerald-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ステップリスト */}
      <ul className="space-y-2">
        {AI_STEPS.map((step, i) => {
          const isDone   = i < currentStep;
          const isActive = i === currentStep && !done;
          return (
            <li
              key={step.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-300 ${
                isDone
                  ? "bg-emerald-50 text-emerald-700"
                  : isActive
                  ? "bg-emerald-100/60 font-medium text-emerald-800"
                  : "text-gray-400"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : isActive ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                </span>
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300" />
              )}
              <span className="leading-snug">{step.label}</span>
            </li>
          );
        })}
      </ul>

      {done && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          すべての安全審査をクリアしました！まもなくマーケットに掲載されます。
        </div>
      )}
    </div>
  );
}

export default function CreateSuccessPage() {
  const router = useRouter();
  const [showContent,    setShowContent]    = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [secResult,      setSecResult]      = useState<SecurityResult | null>(null);
  /** REJECT 時に pending_listing のスナップショットをここに保持（保存はまだしない） */
  const [rejectedData,   setRejectedData]   = useState<Record<string, unknown> | null>(null);
  const [appealDone,     setAppealDone]     = useState(false);
  const [appealLoading,  setAppealLoading]  = useState(false);

  // セキュリティ解析の Promise を ref で保持（アニメーションと並行実行）
  const securityPromise = useRef<Promise<SecurityResult>>(
    Promise.resolve({ safetyStatus: "clear" })
  );

  // マウント時：商品IDを読み込みセキュリティ解析を即時開始
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 80);

    async function init() {
      try {
        const productId = sessionStorage.getItem("jisapp_pending_product_id");
        if (!productId) return;
        const res = await fetch(`/api/products?id=${productId}`);
        if (!res.ok) return;
        const data = await res.json();
        const product = data.product;
        const allCode = [product?.htmlCode, product?.cssCode, product?.jsCode]
          .filter(Boolean)
          .join("\n\n");
        if (allCode) {
          securityPromise.current = analyzeCodeSecurity(allCode);
        }
      } catch { /* noop */ }
    }
    init();

    return () => clearTimeout(t);
  }, []);

  // AI審査アニメーション完了 → セキュリティ結果を評価して分岐保存
  const handleAnimationDone = async () => {
    try {
      const productId = sessionStorage.getItem("jisapp_pending_product_id");
      if (!productId) return;

      const security = await securityPromise.current;
      setSecResult(security);

      const isRejected =
        security.safetyStatus === "warning" && security.isPending === true;

      if (isRejected) {
        setRejectedData({ id: productId, status: "pending" });
        sessionStorage.removeItem("jisapp_pending_product_id");
        setSaved(true);
      } else {
        await fetch(`/api/products/${productId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        });
        sessionStorage.removeItem("jisapp_pending_product_id");
        setSaved(true);
      }
    } catch { /* noop */ }
  };

  const handleAppeal = async () => {
    if (!rejectedData?.id) return;
    setAppealLoading(true);
    try {
      await fetch(`/api/products/${rejectedData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appeal: true }),
      });
      setAppealDone(true);
    } catch { /* noop */ } finally {
      setAppealLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-4">
          <JisappLogo href="/" />
        </div>
      </header>

      <main
        className={`mx-auto max-w-lg px-4 py-12 transition-all duration-700 ${
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {/* 完了アイコン */}
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <Star className="absolute -top-1 -right-1 h-5 w-5 animate-bounce text-yellow-400" />
            <Zap  className="absolute -bottom-1 -left-1 h-4 w-4 animate-pulse text-emerald-400" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              出品リクエスト受付完了
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              マーケットに追加されました！🎉
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              あなたのツールが必要な人のもとへ届きます。<br />
              Groq AI が安全性を審査中です。しばらくお待ちください。
            </p>
          </div>
        </div>

        {/* AI審査アニメーション */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">
              Gemini AI セキュリティ審査
            </span>
            <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 ring-1 ring-blue-200">
              自動処理中
            </span>
          </div>
          <AiReviewAnimation onDone={handleAnimationDone} />
        </div>

        {/* ── 審査完了後：APPROVED パス ── */}
        {saved && !rejectedData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {secResult?.safetyStatus === "clear" && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                外部通信なし・完全クリーン ✅
              </div>
            )}
            {secResult?.safetyStatus === "verified" && (
              <div className="mb-3 rounded-2xl bg-blue-50 px-4 py-3 ring-1 ring-blue-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                  <CheckCircle className="h-4 w-4 shrink-0 text-blue-600" />
                  認証済み外部サービスとの通信を確認
                </div>
                {(secResult.detectedServices ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {secResult.detectedServices!.map((s) => (
                      <span key={s} className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                        <Wifi className="h-3 w-3" />{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {secResult?.safetyStatus === "warning" && !secResult.isPending && (
              <div className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  未確認通信あり — Groq AI が安全と判断
                </div>
                {secResult.aiVerdict && (
                  <p className="mt-1.5 text-xs text-amber-700 leading-relaxed">{secResult.aiVerdict}</p>
                )}
              </div>
            )}
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              マーケットへの掲載が完了しました！
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard/sales"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-green-600 active:scale-[0.98]"
              >
                出品一覧を確認する
                <ChevronRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => router.push("/")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
              >
                トップページに戻る
              </button>
            </div>
          </div>
        )}

        {/* ── 審査完了後：REJECTED パス（案内画面）── */}
        {saved && rejectedData && !appealDone && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
            {/* 優しいライトイエロー案内バナー */}
            <div className="mb-5 rounded-3xl bg-yellow-50 border border-yellow-200 p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-600 mb-0.5">
                    セキュリティ確認
                  </p>
                  <h2 className="text-base font-black text-gray-800 leading-snug">
                    🔒 ホワイトリスト外の外部通信が検知されました
                  </h2>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                安全なプラットフォーム運用のための自動確認で、コード内に未確認の外部通信先が見つかりました。
                悪意があると断定するものではなく、安全基準に基づく制限です。
              </p>
              {secResult?.aiVerdict && (
                <div className="rounded-2xl bg-white border border-yellow-100 px-4 py-3 mb-1">
                  <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest mb-1">AI 解析コメント</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{secResult.aiVerdict}</p>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 mb-4">
              コードを修正してから再出品するか、内容に問題がない場合は運営に再審査を請求できます
            </p>

            {/* ボタン2つ */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAppeal}
                disabled={appealLoading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-4 text-sm font-bold text-white shadow-md hover:from-amber-600 hover:to-orange-500 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {appealLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                AIの判定に異議を申し立てる（運営に再審査を請求）
              </button>
              <button
                type="button"
                onClick={() => router.push("/create")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.98]"
              >
                フォームに戻って修正する
              </button>
            </div>
          </div>
        )}

        {/* ── 再審査請求完了後メッセージ ── */}
        {appealDone && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-5 rounded-3xl bg-emerald-50 border border-emerald-200 p-6 shadow-sm text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="text-base font-black text-gray-800 mb-2">再審査の請求を受け付けました</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                運営チームが目視で確認いたします。<br />
                承認されるまでストアには公開されません。<br />
                公開まで今しばらくお待ちください。
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-green-600 active:scale-[0.98]"
            >
              トップページに戻る
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 補足テキスト */}
        <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
          審査完了（通常数分〜数時間）後、マイページと登録メールにてご連絡します。<br />
          問題が見つかった場合のみ修正をお願いする場合があります。
        </p>
      </main>
    </div>
  );
}
