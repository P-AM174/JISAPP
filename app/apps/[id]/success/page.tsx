"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { ProductReceiveArea } from "@/components/product-receive-area";
import { normalizeProduct } from "@/lib/products/normalize";
import type { Product, ProductType } from "@/lib/products/types";
import {
  CheckCircle2,
  Copy,
  Check,
  Star,
  Sparkles,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

// ─── アプリのメタ情報（success ページで使う最小限のデータ） ───
const APPS_META: Record<string, { name: string; creator: string; price: number; gradient: string; category: string }> = {
  "1":  { name: "AIスケジュール最適化",         creator: "TechStudio",    price: 2980, gradient: "from-emerald-600 via-green-600 to-teal-700",   category: "生産性"      },
  "2":  { name: "マーケットレポーター",          creator: "DataWave",      price: 1980, gradient: "from-rose-500 via-pink-600 to-red-600",         category: "分析"        },
  "3":  { name: "SNSコンテンツAI",              creator: "CreativeLab",   price: 3480, gradient: "from-amber-500 via-orange-500 to-red-500",       category: "マーケ"      },
  "4":  { name: "コード品質チェッカー",          creator: "DevTools",      price: 2480, gradient: "from-emerald-500 via-teal-600 to-cyan-700",      category: "開発"        },
  "5":  { name: "タスク管理Pro",               creator: "SimpleApps",    price: 0,    gradient: "from-green-500 via-emerald-600 to-teal-600",     category: "生産性"      },
  "6":  { name: "メール文章アシスト",           creator: "MailGenius",    price: 0,    gradient: "from-emerald-500 via-green-600 to-teal-600",     category: "ビジネス"    },
  "7":  { name: "音楽プレイリスト生成",         creator: "MusicAI",       price: 0,    gradient: "from-green-500 via-emerald-600 to-teal-700",     category: "エンタメ"    },
  "8":  { name: "EC商品説明ジェネレーター",     creator: "ShopTools",     price: 0,    gradient: "from-orange-500 via-amber-500 to-yellow-500",    category: "EC"          },
  "9":  { name: "ワンクリック議事録作成GAS",    creator: "GASマスター",   price: 980,  gradient: "from-emerald-500 via-green-600 to-teal-600",     category: "業務効率化"  },
  "10": { name: "自動シフト調整ツール",         creator: "ShiftPro",      price: 500,  gradient: "from-teal-500 via-emerald-600 to-green-700",     category: "シフト管理"  },
  "11": { name: "かんたん請求書メーカー",       creator: "FreelanceKit",  price: 780,  gradient: "from-green-500 via-teal-600 to-emerald-700",     category: "フリーランス"},
  "12": { name: "SNS予約投稿スケジューラー",    creator: "SocialAI",      price: 980,  gradient: "from-emerald-400 via-teal-500 to-cyan-600",      category: "SNS運用"     },
};

// ─── タブ別ソースコードの生成 ───
function buildCodeFiles(name: string, creator: string, category: string) {
  return [
    {
      filename: "コード.gs",
      lang: "javascript",
      code: `// ${name}
// カテゴリ: ${category}  |  出品者: ${creator}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// README: appsscript.json の "timeZone" をあなたのタイムゾーンに変更してから
//         [デプロイ] → [新しいデプロイ] を押してください。

const PROPS = PropertiesService.getScriptProperties();

function main() {
  const config = getConfig();
  const data   = fetchData(config);
  const result = processAndWrite(data);
  Logger.log("✅ 完了: %s 件処理", result.count);
  if (config.slackWebhook) notifySlack(config, result);
}

function getConfig() {
  return {
    spreadsheetId: PROPS.getProperty("SPREADSHEET_ID") || "",
    apiKey:        PROPS.getProperty("API_KEY")        || "",
    slackWebhook:  PROPS.getProperty("SLACK_WEBHOOK")  || "",
    sheetName:     "データ",
    outputSheet:   "結果",
  };
}

function fetchData(config) {
  const ss    = SpreadsheetApp.openById(config.spreadsheetId);
  const sheet = ss.getSheetByName(config.sheetName) || ss.getSheets()[0];
  return sheet.getDataRange().getValues();
}

function processAndWrite(rows) {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const out    = ss.getSheetByName("結果") ?? ss.insertSheet("結果");
  const header = ["#", "ID", "名前", "値", "ステータス", "処理日時"];
  out.clearContents();
  out.appendRow(header);

  const processed = rows.slice(1).map((row, i) => [
    i + 1, row[0], row[1], row[2],
    "✅ 済", new Date().toLocaleString("ja-JP"),
  ]);
  processed.forEach(r => out.appendRow(r));
  out.getRange(1, 1, 1, header.length)
     .setBackground("#d1fae5").setFontWeight("bold");
  return { count: processed.length };
}

function notifySlack(config, result) {
  const body = {
    text: "📊 *${name}* 処理完了\\n件数: " + result.count + " 件",
  };
  UrlFetchApp.fetch(config.slackWebhook, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(body),
  });
}

// 毎日午前9時に自動実行するトリガーを設定
function setDailyTrigger() {
  ScriptApp.newTrigger("main")
    .timeBased().atHour(9).everyDays(1).create();
  Logger.log("トリガーを設定しました");
}`,
    },
    {
      filename: "index.html",
      lang: "html",
      code: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif;
      background: #f0fdf4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
    }
    h1 { font-size: 1.2rem; color: #065f46; margin-bottom: 1rem; }
    .btn {
      width: 100%; padding: .875rem;
      background: #10b981; color: white;
      border: none; border-radius: 10px;
      font-size: .9rem; font-weight: 700;
      cursor: pointer; margin-top: 1rem;
      transition: background .2s;
    }
    .btn:hover { background: #059669; }
    .status {
      margin-top: 1rem; padding: .75rem;
      background: #d1fae5; border-radius: 8px;
      color: #065f46; font-size: .85rem;
      display: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 ${name}</h1>
    <p style="font-size:.85rem;color:#6b7280;line-height:1.6">
      このアプリは ${creator} が開発しました。<br>
      カテゴリ: ${category}
    </p>
    <button class="btn" onclick="runApp()">実行する</button>
    <div class="status" id="status">✅ 処理が完了しました！</div>
  </div>
  <script>
    function runApp() {
      google.script.run
        .withSuccessHandler(onSuccess)
        .withFailureHandler(onError)
        .main();
    }
    function onSuccess(result) {
      const el = document.getElementById("status");
      el.style.display = "block";
      el.textContent = "✅ 完了しました！結果シートをご確認ください。";
    }
    function onError(err) {
      alert("エラー: " + err.message);
    }
  </script>
</body>
</html>`,
    },
    {
      filename: "appsscript.json",
      lang: "json",
      code: `{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.send_mail"
  ],
  "webapp": {
    "executeAs": "USER_ACCESSING",
    "access": "MYSELF"
  }
}`,
    },
  ];
}

// ─── Star コンポーネント ───
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-125"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              s <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── メインページ ───
export default function PurchaseSuccessPage() {
  const params    = useParams();
  const id        = String(params?.id ?? "");
  const defaultMeta = {
    name: "ご購入のアプリ", creator: "クリエイター", price: 0,
    gradient: "from-emerald-500 to-green-600", category: "アプリ",
  };
  const [meta, setMeta] = useState(
    () => APPS_META[id] ?? defaultMeta
  );
  const priceLabel = meta.price === 0 ? "無料" : `¥${meta.price.toLocaleString()}`;
  // デフォルトはダミーコードファイル。localStorage に出品データがあればそちらを優先する
  const [files, setFiles] = useState(() =>
    buildCodeFiles(
      (APPS_META[id] ?? defaultMeta).name,
      (APPS_META[id] ?? defaultMeta).creator,
      (APPS_META[id] ?? defaultMeta).category
    )
  );

  const [activeTab,    setActiveTab]    = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [confirmed,    setConfirmed]    = useState(false);
  const [starRating,   setStarRating]   = useState(0);
  const [reviewText,   setReviewText]   = useState("");
  const [reviewPosted, setReviewPosted] = useState(false);
  const [product, setProduct] = useState<{
    source_url: string | null;
    product_type: ProductType;
    listing_type: "file" | "url";
    title: string;
    is_playground_app?: boolean;
  } | null>(null);

  // localStorage の出品データからメタ情報・製品版ファイル（productFiles）を読み込む
  useEffect(() => {
    try {
      const stored = localStorage.getItem("jisapp_listings");
      if (!stored) return;
      const listings: Array<Record<string, unknown>> = JSON.parse(stored);
      const match = listings.find((l) => String(l.id) === id);
      if (!match) return;

      const normalized = normalizeProduct(match);
      setProduct({
        source_url: normalized.source_url,
        product_type: normalized.product_type,
        listing_type: normalized.listing_type ?? "file",
        title: normalized.title,
        is_playground_app: normalized.is_playground_app,
      });

      if (!APPS_META[id]) {
        setMeta({
          name: normalized.title,
          creator: normalized.creator ?? defaultMeta.creator,
          price: normalized.price,
          gradient: normalized.gradient ?? defaultMeta.gradient,
          category: normalized.category ?? defaultMeta.category,
        });
      }

      const srcFiles = normalized.productFiles ?? (match.files as Product["productFiles"]);
      if (normalized.listing_type === "file" && srcFiles && srcFiles.length > 0) {
        const customFiles = srcFiles.map((f) => ({
          filename: f.name,
          lang: f.name.endsWith(".gs") || f.name.endsWith(".js")
            ? "javascript"
            : f.name.endsWith(".html")
            ? "html"
            : "json",
          code: f.content,
        }));
        setFiles(customFiles);
      }
    } catch {
      // localStorage が使えない環境ではスキップ
    }

    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.product) return;
        setProduct((prev) => ({
          source_url: data.product.source_url ?? prev?.source_url ?? null,
          product_type: data.product.product_type ?? prev?.product_type ?? "generic",
          listing_type: data.product.listing_type ?? prev?.listing_type ?? "file",
          title: data.product.title ?? prev?.title ?? "",
          is_playground_app: data.product.is_playground_app ?? prev?.is_playground_app,
        }));
      })
      .catch(() => {});
  }, [id]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(files[activeTab].code); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!starRating) return;
    setReviewPosted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <BackButton label="戻る" fallbackHref={`/apps/${id}`} />
          <JisappLogo href="/" />
          <Link href="/mypage" className="text-sm font-medium text-gray-400 hover:text-emerald-600">
            マイページ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-16">

        {/* ① 購入完了ヒーロー */}
        <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${meta.gradient} p-6 text-center shadow-xl`}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-3xl shadow-lg">
              🎉
            </div>
            <h1 className="text-xl font-black text-white">ご購入ありがとうございました！</h1>
            <p className="mt-1 text-sm text-white/80">「{meta.name}」の取引が完了しました</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4" />
              {priceLabel} の決済が完了
            </div>
          </div>
        </section>

        {product?.is_playground_app && (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-bold text-gray-800">ブラウザでアプリを起動</p>
            <p className="mt-1 text-xs text-gray-500">
              サンドボックス環境で安全に実行します。ジサップ本体とは隔離されています。
            </p>
            <Link
              href={`/apps/${id}/run`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700"
            >
              <ArrowRight className="h-4 w-4" />
              アプリを起動する
            </Link>
          </section>
        )}

        {/* ② アプリ受け取りエリア */}
        {product?.source_url && product.listing_type === "url" ? (
          <ProductReceiveArea
            productType={product.product_type}
            sourceUrl={product.source_url}
            title={product.title}
          />
        ) : (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold text-emerald-600">
              <Sparkles className="h-3.5 w-3.5" />
              🚀 クイック導入
            </div>
            <p className="text-sm text-gray-600">
              下のソースコードをコピーして、Google Apps Script や HTML エディタに貼り付けてご利用ください。
            </p>
          </section>
        )}

        {/* ③ ソースコード（ファイル出品のみ） */}
        {(product?.listing_type !== "url" || !product?.source_url) && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {/* タブバー */}
          <div className="flex items-center gap-0 border-b border-gray-200 bg-gray-50 px-4 pt-3">
            {files.map((f, i) => (
              <button
                key={f.filename}
                onClick={() => { setActiveTab(i); setCopied(false); }}
                className={`relative -mb-px flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === i
                    ? "border border-b-white border-gray-200 bg-white text-emerald-700 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${
                  f.lang === "javascript" ? "bg-yellow-400" :
                  f.lang === "html" ? "bg-orange-400" : "bg-blue-400"
                }`} />
                {f.filename}
              </button>
            ))}
            <div className="ml-auto pb-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  copied
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "コピーしました！" : "コードをコピー"}
              </button>
            </div>
          </div>

          {/* コードブロック（ライトモード） */}
          <div className="max-h-[420px] overflow-y-auto overflow-x-auto border-t border-amber-100 bg-amber-50">
            <pre className="p-5 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre">
              {files[activeTab].code.split("\n").map((line, i) => {
                const isComment   = line.trimStart().startsWith("//") || line.trimStart().startsWith("*") || line.trimStart().startsWith("/*") || line.trimStart().startsWith("*/");
                const isKey       = /^\s*(function|const|return|if|let|var|forEach|map|async|await)\b/.test(line);
                const isProperty  = /^\s*"[^"]+":/.test(line);
                return (
                  <span
                    key={i}
                    className={`block ${
                      isComment  ? "text-emerald-500"  :
                      isKey      ? "text-indigo-500"   :
                      isProperty ? "text-amber-600"    :
                      "text-slate-800"
                    }`}
                  >
                    {line || " "}
                  </span>
                );
              })}
            </pre>
          </div>
        </section>
        )}

        {/* ④ 受取・動作確認完了ボタン */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-1 text-sm font-bold text-gray-700">取引を完了する</h2>
          <p className="mb-4 text-xs text-gray-500 leading-relaxed">
            アプリの動作を確認したら「受取・動作確認完了」を押してください。
            クリエイターへの売上が確定します。
          </p>
          {!confirmed ? (
            <button
              onClick={() => setConfirmed(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <ShieldCheck className="h-5 w-5" />
              受取・動作確認完了
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-4 text-sm font-bold text-emerald-700 ring-2 ring-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              受取確認が完了しました！
            </div>
          )}
        </section>

        {/* ⑤ レビュー投稿フォーム */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-700">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            このアプリのレビューを投稿する
          </h2>
          <p className="mb-4 text-xs text-gray-400">他のユーザーの参考になるレビューをお願いします</p>

          {!reviewPosted ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* 星評価 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-600">総合評価</p>
                <StarPicker value={starRating} onChange={setStarRating} />
                {starRating > 0 && (
                  <p className="mt-1 text-xs text-amber-600 font-medium">
                    {["", "残念でした", "もう少しかな", "良かったです", "とても良かった！", "最高でした！🎉"][starRating]}
                  </p>
                )}
              </div>

              {/* コメント */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  コメント（任意）
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="使ってみた感想、導入のしやすさ、活用シーンなど何でも書いてください"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-300 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <button
                type="submit"
                disabled={!starRating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Star className="h-4 w-4" />
                レビューを投稿する
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                ⭐
              </div>
              <p className="font-bold text-emerald-700">レビューを投稿しました！</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-5 w-5 ${s <= starRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                ))}
              </div>
              {reviewText && <p className="text-xs text-gray-500 max-w-xs">「{reviewText}」</p>}
            </div>
          )}
        </section>

        {/* ⑥ ナビゲーション */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/mypage"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700"
          >
            マイページで購入済みを確認
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
