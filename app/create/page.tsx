"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Upload,
  ImagePlus,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Code2,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  FileCode,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { cn } from "@/lib/utils";
import { processSourceUrl } from "@/lib/products/source-url";
import { extractCodeFromFiles } from "@/lib/products/build-srcdoc";
import { SecurityNotice } from "@/components/security-notice";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/products/types";

// ─── コードファイルの型 ───
type CodeFile = { id: number; name: string; content: string };

type StoredCodeFile = { name?: string; content?: string };

type ListingRecord = {
  name?: string;
  previewFiles?: StoredCodeFile[];
  productFiles?: StoredCodeFile[];
};

/** 出品データから比較用のソースコード文字列を収集 */
function collectStoredCodes(listings: ListingRecord[]): string[] {
  const codes: string[] = [];
  for (const listing of listings) {
    for (const file of [...(listing.previewFiles ?? []), ...(listing.productFiles ?? [])]) {
      const trimmed = file.content?.trim();
      if (trimmed) codes.push(trimmed);
    }
  }
  return codes;
}

/** 入力コードが既存出品と完全一致するか判定 */
function findDuplicateListing(
  previewFiles: CodeFile[],
  productFiles: CodeFile[]
): { isDuplicate: boolean; message: string; matchedAppName?: string } {
  const incoming = [
    ...previewFiles.map((f) => f.content.trim()).filter(Boolean),
    ...productFiles.map((f) => f.content.trim()).filter(Boolean),
  ];

  // コード未入力の場合は重複チェックをスキップ（他バリデーションに委ねる）
  if (incoming.length === 0) {
    return { isDuplicate: false, message: "" };
  }

  let listings: ListingRecord[] = [];
  try {
    const raw = localStorage.getItem("jisapp_listings");
    if (raw) listings = JSON.parse(raw);
  } catch {
    return { isDuplicate: false, message: "" };
  }

  const existingCodes = collectStoredCodes(listings);
  if (existingCodes.length === 0) {
    return { isDuplicate: false, message: "" };
  }

  for (const code of incoming) {
    const matchIndex = existingCodes.findIndex((existing) => existing === code);
    if (matchIndex === -1) continue;

    // どの出品と一致したか特定（表示用）
    let matchedAppName: string | undefined;
    outer: for (const listing of listings) {
      for (const file of [...(listing.previewFiles ?? []), ...(listing.productFiles ?? [])]) {
        if (file.content?.trim() === code) {
          matchedAppName = listing.name;
          break outer;
        }
      }
    }

    const suffix = matchedAppName ? `（既存出品：「${matchedAppName}」）` : "";
    return {
      isDuplicate: true,
      message: `⚠️ このソースコードは既にジサップに出品されているため、二重出品はできません。${suffix}`,
      matchedAppName,
    };
  }

  return { isDuplicate: false, message: "" };
}

// ─── カテゴリ ───
const CATEGORIES = [
  "Excel・スプレッドシート",
  "事務効率化",
  "Notionテンプレート",
  "SNS自動化",
  "店舗・シフト管理",
  "データ分析",
  "ゲーム",
  "その他",
];

// ─── カテゴリごとのデフォルト見た目 ───
const CATEGORY_META: Record<string, { gradient: string; iconName: string; tagColor: string }> = {
  "Excel・スプレッドシート": { gradient: "from-emerald-500 via-green-600 to-teal-600",   iconName: "FileText",  tagColor: "bg-emerald-500" },
  "事務効率化":             { gradient: "from-teal-500 via-emerald-600 to-green-700",   iconName: "FileText",  tagColor: "bg-teal-500"    },
  "Notionテンプレート":     { gradient: "from-indigo-500 via-purple-600 to-violet-700", iconName: "FileText",  tagColor: "bg-indigo-500"  },
  "SNS自動化":              { gradient: "from-amber-500 via-orange-500 to-red-500",     iconName: "Globe",     tagColor: "bg-amber-500"   },
  "店舗・シフト管理":       { gradient: "from-blue-500 via-indigo-600 to-violet-600",   iconName: "Calendar",  tagColor: "bg-blue-500"    },
  "データ分析":             { gradient: "from-rose-500 via-pink-600 to-red-600",        iconName: "BarChart3", tagColor: "bg-rose-500"    },
  "ゲーム":                 { gradient: "from-violet-600 via-purple-700 to-indigo-800", iconName: "Gamepad2",  tagColor: "bg-violet-500"  },
  "その他":                 { gradient: "from-emerald-600 via-green-600 to-teal-700",   iconName: "Sparkles",  tagColor: "bg-emerald-500" },
};

// ─── ドラッグ&ドロップ対応アップロードエリア ───
function UploadZone({
  files,
  onFiles,
}: {
  files: File[];
  onFiles: (f: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const next = [...files, ...Array.from(incoming)].slice(0, 8);
      onFiles(next);
    },
    [files, onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200",
        dragging
          ? "border-emerald-500 bg-emerald-50"
          : "border-gray-200 bg-gray-50/60 hover:border-emerald-400 hover:bg-emerald-50/40"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
        <ImagePlus className="h-7 w-7 text-emerald-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">
          デモ動画・スクリーンショットを追加
        </p>
        <p className="mt-1 text-xs text-gray-400">
          ドラッグ＆ドロップ、またはタップして選択（最大8枚）
        </p>
      </div>
      {files.length > 0 && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {files.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-600 shadow-sm ring-1 ring-gray-200"
            >
              {f.name.length > 16 ? f.name.slice(0, 14) + "…" : f.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ブラウザウィンドウ型プレビュー ───
function BrowserPreview({ html }: { html: string }) {
  const [key, setKey] = useState(0);

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/60">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2.5">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        {/* Fake address bar */}
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-gray-200">
          <div className="h-3 w-3 shrink-0 rounded-full bg-emerald-400" />
          <span className="truncate font-mono text-xs text-gray-400">
            jisapp.vercel.app/preview/demo
          </span>
        </div>
        {/* Refresh */}
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-emerald-600"
          title="再読み込み"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Viewport */}
      <div className="relative bg-white" style={{ height: 480 }}>
        {html ? (
          <iframe
            key={key}
            srcDoc={html}
            sandbox="allow-scripts"
            className="h-full w-full border-0"
            title="preview"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <Eye className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">プレビューがここに表示されます</p>
              <p className="mt-1 text-xs text-gray-400">
                下のコードエリアに HTML を貼り付けて「反映する」を押してください
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;font-family:sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;height:100vh;}
  .box{text-align:center;color:#9ca3af;padding:1rem;}
  .icon{font-size:2rem;margin-bottom:.5rem;}
</style></head>
<body><div class="box"><div class="icon">📱</div><p style="font-size:.8rem">HTMLを貼り付けると<br>ここに表示されます</p></div></body></html>`;

// ─── メインページ ───
function CreatePageInner() {
  const { data: session, status } = useSession();

  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  // 出品タイプ: "file"=コード/ファイル, "url"=URLリンク
  const [listingType, setListingType] = useState<"file" | "url">("file");
  const [productUrl, setProductUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [detectedType, setDetectedType] = useState<ProductType | null>(null);
  const [processedUrl, setProcessedUrl] = useState("");

  // ─── エリア①：プレビュー用ファイル ───
  const [previewFiles, setPreviewFiles] = useState<CodeFile[]>([
    { id: 1, name: "index.html", content: "" },
  ]);
  const [nextPreviewId, setNextPreviewId] = useState(2);

  // ─── エリア②：製品版ファイル ───
  const [productFiles, setProductFiles] = useState<CodeFile[]>([
    { id: 1, name: "code.gs", content: "" },
  ]);
  const [nextProductId, setNextProductId] = useState(2);

  const [previewHtml, setPreviewHtml] = useState("");
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [duplicateError, setDuplicateError] = useState("");
  const [productCodeError, setProductCodeError] = useState("");
  // ステップ管理: "form" → "confirm"（確認モーダル）
  const [step, setStep] = useState<"form" | "confirm">("form");
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── プレイグラウンドからの自動反映 ───
  useEffect(() => {
    const source = searchParams.get("source");
    if (source !== "playground") return;
    try {
      const savedCode = localStorage.getItem("jisapp_playground_code");
      if (!savedCode?.trim()) return;
      // コードをプレビューファイルに反映
      setPreviewFiles([{ id: 1, name: "index.html", content: savedCode }]);
      // アプリ名の初期候補（未入力のときだけ）
      setAppName((prev) => prev || "プレイグラウンドで作ったアプリ");
      // プレビューHTMLも反映
      setPreviewHtml(savedCode);
    } catch { /* noop */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── プレビューファイル操作 ───
  const addPreviewFile = () => {
    setPreviewFiles((prev) => [...prev, { id: nextPreviewId, name: "style.css", content: "" }]);
    setNextPreviewId((n) => n + 1);
  };
  const removePreviewFile = (idx: number) => setPreviewFiles((prev) => prev.filter((_, i) => i !== idx));
  const updatePreviewName = (idx: number, name: string) =>
    setPreviewFiles((prev) => prev.map((f, i) => i === idx ? { ...f, name } : f));
  const updatePreviewContent = (idx: number, content: string) => {
    if (duplicateError) setDuplicateError("");
    setPreviewFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, content } : f)));
  };

  // ─── 製品版ファイル操作 ───
  const addProductFile = () => {
    setProductFiles((prev) => [...prev, { id: nextProductId, name: "newfile.gs", content: "" }]);
    setNextProductId((n) => n + 1);
  };
  const removeProductFile = (idx: number) => setProductFiles((prev) => prev.filter((_, i) => i !== idx));
  const updateProductName = (idx: number, name: string) =>
    setProductFiles((prev) => prev.map((f, i) => i === idx ? { ...f, name } : f));
  const updateProductContent = (idx: number, content: string) => {
    if (duplicateError) setDuplicateError("");
    if (productCodeError) setProductCodeError("");
    setProductFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, content } : f)));
  };

  const hasProductCode = () => productFiles.some((f) => f.content.trim());

  // プレビューファイル内の .html があればそれを iframe に反映
  const applyPreview = () => {
    const htmlFile = previewFiles.find((f) => f.name.endsWith(".html")) ?? previewFiles[0];
    setPreviewHtml(htmlFile?.content ?? "");
  };

  const validateUrl = (val: string) => {
    if (!val.trim()) {
      setUrlError("共有URLを入力してください。");
      setDetectedType(null);
      setProcessedUrl("");
      return false;
    }
    if (!/^https?:\/\/.+/.test(val.trim())) {
      setUrlError("https:// から始まる正しいURLを入力してください。");
      setDetectedType(null);
      setProcessedUrl("");
      return false;
    }
    setUrlError("");
    const { source_url, product_type } = processSourceUrl(val);
    setDetectedType(product_type);
    setProcessedUrl(source_url);
    return true;
  };

  // ─── フォームキーダウン：Enterによる誤送信を完全ブロック ───
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const tag = (e.target as HTMLElement).tagName;
      // textarea 内の改行はそのまま許可、それ以外は全てブロック
      if (tag !== "TEXTAREA") e.preventDefault();
    }
  };

  // ─── 「確認画面へ進む」ボタン ───
  const handleGoToConfirm = () => {
    if (!appName.trim()) { alert("アプリ名・ツール名を入力してください。"); return; }
    if (!description.trim()) { alert("説明文を入力してください。"); return; }

    if (listingType === "url") {
      if (!validateUrl(productUrl)) return;
    } else {
      const fromPlayground = searchParams.get("source") === "playground";
      const hasCode =
        hasProductCode() ||
        (fromPlayground && previewFiles.some((f) => f.content.trim()));
      if (!hasCode) {
        setProductCodeError("製品版ソースコードは必須です。少なくとも1つのファイルにコードを入力してください。");
        return;
      }
      setProductCodeError("");
      // ソースコードの二重出品チェック
      const dup = findDuplicateListing(previewFiles, productFiles);
      if (dup.isDuplicate) {
        setDuplicateError(dup.message);
        return;
      }
      setDuplicateError("");
    }
    setStep("confirm");
  };

  // ─── 確認モーダルから「AI審査へ」ボタン（一時保存 → リダイレクト） ───
  const handleFinalSubmit = async () => {
    const cat = category || "その他";
    const meta = CATEGORY_META[cat] ?? CATEGORY_META["その他"];

    let source_url: string | null = null;
    let product_type: ProductType = "generic";
    if (listingType === "url") {
      const processed = processSourceUrl(productUrl);
      source_url = processed.source_url;
      product_type = processed.product_type;
    }

    const fromPlayground = searchParams.get("source") === "playground";
    const previewCodes = extractCodeFromFiles(
      previewFiles.map((f) => ({ name: f.name, content: f.content }))
    );
    const productCodes = extractCodeFromFiles(
      productFiles.map((f) => ({ name: f.name, content: f.content }))
    );
    const is_playground_app =
      fromPlayground ||
      Boolean(previewCodes.html_code || productCodes.html_code);
    const html_code = productCodes.html_code || previewCodes.html_code || null;
    const css_code = productCodes.css_code || previewCodes.css_code || null;
    const js_code = productCodes.js_code || previewCodes.js_code || null;

    const pendingListing = {
      id: Date.now(),
      title: appName,
      name: appName,
      description,
      price: 0,
      priceNum: 0,
      priceLabel: "FREE",
      source_url,
      product_type,
      listing_type: listingType,
      type: listingType,
      url: source_url,
      category: cat,
      creator: "あなた",
      creatorId: 1,
      rating: 5.0,
      reviews: 0,
      tag: "NEW",
      tagColor: meta.tagColor,
      gradient: meta.gradient,
      iconName: meta.iconName,
      status: "AI審査中",
      html_code,
      css_code,
      js_code,
      is_playground_app,
      previewFiles: listingType === "file" ? previewFiles.map((f) => ({ name: f.name, content: f.content })) : [],
      productFiles: listingType === "file" ? productFiles.map((f) => ({ name: f.name, content: f.content })) : [],
      createdAt: new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    try {
      sessionStorage.setItem(
        "jisapp_pending_listing_meta",
        JSON.stringify({ title: appName, category: cat })
      );
    } catch { /* noop */ }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingListing),
    });

    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("jisapp_pending_product_id", String(data.product.id));
    }

    router.push("/create/success");
  };

  // ─── 未認証ガード ───
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f2]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f2]">

      {/* ─── 未ログイン案内モーダル ─── */}
      {!session && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">🔒 ログインが必要です</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              安全な取引のためにログインが必要です。<br />
              アカウントを作成するかログインしてください。
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/create")}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-green-600 transition-all"
              >
                ログイン・新規登録する
              </Link>
              <Link href="/" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
                トップに戻る
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── 出品確認モーダル ─── */}
      {step === "confirm" && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setStep("form")}
          />
          {/* モーダル本体 */}
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-emerald-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-black text-gray-900">出品内容の確認</h2>
              </div>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 確認内容 */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-4">
              {/* タイトル */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">アプリ・ツール名</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{appName}</p>
              </div>
              {/* カテゴリ・タイプ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">カテゴリ</p>
                  <p className="mt-1 text-sm text-gray-800">{category || "その他"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">出品タイプ</p>
                  <p className="mt-1 text-sm text-gray-800">{listingType === "url" ? "🔗 URLリンク" : "📂 ファイル"}</p>
                </div>
              </div>
              {/* URL出品の場合はURLを表示 */}
              {listingType === "url" && (
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">ツール種別</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {PRODUCT_TYPE_LABELS[detectedType ?? processSourceUrl(productUrl).product_type]}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">保存される共有URL</p>
                    <p className="mt-1 text-xs font-mono break-all text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                      {processedUrl || processSourceUrl(productUrl).source_url}
                    </p>
                    {(detectedType === "google" || processSourceUrl(productUrl).product_type === "google") && (
                      <p className="mt-1 text-[10px] text-emerald-600">✓ Google 用に /copy リンクへ自動変換されます</p>
                    )}
                  </div>
                </div>
              )}
              {/* 説明文 */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">説明文</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">{description}</p>
              </div>
              {/* プレビューコード (ファイル出品のみ) */}
              {listingType === "file" && previewFiles.some(f => f.content.trim()) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    🌐 プレビュー用コード（{previewFiles.length}ファイル）
                  </p>
                  {previewFiles.map((f, i) => (
                    <div key={i} className="mb-2 overflow-hidden rounded-xl border border-teal-100">
                      <div className="flex items-center gap-2 border-b border-teal-100 bg-teal-50 px-3 py-1.5">
                        <Code2 className="h-3 w-3 text-teal-600" />
                        <span className="font-mono text-xs text-teal-700">{f.name}</span>
                      </div>
                      <pre className="max-h-24 overflow-y-auto bg-amber-50 px-3 py-2 font-mono text-[10px] text-slate-700 leading-relaxed">
                        {f.content || "（空）"}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              {/* 製品版コード (ファイル出品のみ) */}
              {listingType === "file" && productFiles.some(f => f.content.trim()) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    🔒 製品版コード（{productFiles.length}ファイル）
                  </p>
                  {productFiles.map((f, i) => (
                    <div key={i} className="mb-2 overflow-hidden rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-1.5">
                        <Code2 className="h-3 w-3 text-slate-500" />
                        <span className="font-mono text-xs text-slate-600">{f.name}</span>
                      </div>
                      <pre className="max-h-24 overflow-y-auto bg-amber-50 px-3 py-2 font-mono text-[10px] text-slate-700 leading-relaxed">
                        {f.content || "（空）"}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              {/* 免責 */}
              <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-[10px] leading-relaxed text-gray-400">
                ※ AI審査完了後にマーケットへ掲載されます。
                {listingType === "url" && " ※ 外部URLは変更・削除が可能ですが、ユーザーに適切にアクセスできる状態を維持してください。"}
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]"
              >
                ← 修正する
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-green-600 active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" />
                この内容で安全に出品する（AI審査へ）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <BackButton />

          <JisappLogo href="/" />

          <Link
            href="/mypage"
            className="text-sm font-medium text-gray-400 transition-colors hover:text-emerald-600"
          >
            マイページ
          </Link>
        </div>
      </header>

      {/* ─── Hero strip ─── */}
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-6 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
            クリエイター出品
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            新しいアプリを出品する
          </h1>
          <p className="mt-1 text-sm text-emerald-100">
            スマホから数分で出品完了。あなたのツールを必要な人へ届けよう。
          </p>
        </div>
      </div>

      {(
        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={handleFormKeyDown}
        >
          <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">

            <SecurityNotice />

            {/* ─── プレイグラウンドからの引き継ぎバナー ─── */}
            {searchParams.get("source") === "playground" && (
              <div className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 ring-1 ring-violet-200">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <Code2 className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-violet-800">プレイグラウンドのコードを自動反映しました ✓</p>
                  <p className="text-xs text-violet-500 mt-0.5">アプリ名・説明文を入力して出品を完成させよう</p>
                </div>
              </div>
            )}

            {/* ─── Row 1: 基本情報 + 画像 ─── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* 左: 基本情報 */}
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  基本情報
                </h2>

                {/* アプリ名 */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    アプリ名 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="例：シフト自動転記GASツール v2"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                {/* カテゴリ */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    カテゴリ
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c === category ? "" : c)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                          category === c
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-gray-200 bg-white text-gray-500 hover:border-emerald-400 hover:text-emerald-600"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 説明 */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    アプリの説明 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="どんな課題を解決できるか、使い方のポイントなど簡単に教えてください。"
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>
              </div>

              {/* 右: 画像・動画 */}
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Upload className="h-4 w-4 text-emerald-500" />
                  画像・デモ動画
                </h2>
                <UploadZone files={files} onFiles={setFiles} />
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500"
                  >
                    <X className="h-3 w-3" />
                    すべてクリア
                  </button>
                )}
                <p className="text-[11px] leading-relaxed text-gray-400">
                  実際の使用画面のスクリーンショットや、操作の様子を録画した短い動画があると、購入率がぐっと上がります。
                </p>
              </div>
            </div>

            {/* ─── 出品タイプセレクター ─── */}
            <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4">
                <Zap className="h-4 w-4 text-emerald-500" />
                出品タイプを選択
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* ファイル・コード出品 */}
                <button
                  type="button"
                  onClick={() => setListingType("file")}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                    listingType === "file"
                      ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100"
                      : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", listingType === "file" ? "bg-emerald-600" : "bg-gray-100")}>
                      <FileCode className={cn("h-4.5 w-4.5", listingType === "file" ? "text-white" : "text-gray-400")} />
                    </div>
                    {listingType === "file" && (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">選択中</span>
                    )}
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", listingType === "file" ? "text-emerald-800" : "text-gray-700")}>
                      📂 ファイル・コードで出品
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                      HTMLアプリ、GASスクリプト、Webツールなどのソースコードをそのまま出品
                    </p>
                  </div>
                </button>

                {/* URLリンク出品 */}
                <button
                  type="button"
                  onClick={() => setListingType("url")}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                    listingType === "url"
                      ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", listingType === "url" ? "bg-blue-600" : "bg-gray-100")}>
                      <Globe className={cn("h-4.5 w-4.5", listingType === "url" ? "text-white" : "text-gray-400")} />
                    </div>
                    {listingType === "url" && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">選択中</span>
                    )}
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", listingType === "url" ? "text-blue-800" : "text-gray-700")}>
                      🔗 URLリンクで出品
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                      Googleスプレッドシート、Notionテンプレート、Webサイトなど外部リンクで共有
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* ─── URL リンク入力エリア（URL出品選択時のみ） ─── */}
            {listingType === "url" && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <div className="flex items-start gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <Globe className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-blue-800">
                      🔗 外部リンクの設定 <span className="text-rose-500">*</span>
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-blue-600">
                      ユーザーが「GETする」を押したときに案内する、共有可能なURLを入力してください。
                    </p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      共有URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => { setProductUrl(e.target.value); if (urlError) setUrlError(""); }}
                      onBlur={(e) => validateUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className={cn(
                        "w-full rounded-xl border bg-gray-50 px-4 py-2.5 font-mono text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2",
                        urlError
                          ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/20"
                          : "border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                      )}
                    />
                    {urlError && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                        <span>⚠</span> {urlError}
                      </p>
                    )}
                    {detectedType && !urlError && (
                      <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
                        <p className="text-xs font-bold text-emerald-800">
                          判別: {PRODUCT_TYPE_LABELS[detectedType]}
                        </p>
                        {processedUrl && processedUrl !== productUrl.trim() && (
                          <p className="mt-1 text-[10px] text-emerald-700 break-all font-mono">
                            保存URL: {processedUrl}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 注意書きガイド */}
                  <div className="rounded-xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200 space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      💡 共有設定のヒント
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                        <span className="mt-0.5 shrink-0">📊</span>
                        <span>
                          <span className="font-semibold">Googleスプレッドシート / ドキュメント</span> の場合は、「共有」→「リンクを知っている全員」に変更してからURLを貼ってください。
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                        <span className="mt-0.5 shrink-0">📓</span>
                        <span>
                          <span className="font-semibold">Notion</span> の場合は、右上の「共有」→「ウェブで公開」をオンにするか、「リンクをコピー」して貼り付けてください。
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                        <span className="mt-0.5 shrink-0">💻</span>
                        <span>
                          <span className="font-semibold">Replit</span> の場合は、プロジェクトの共有 URL を貼り付けてください。購入者は Fork で複製できます。
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                        <span className="font-semibold">
                          ※ スプレッドシートやNotionなどの場合は、共有設定を「リンクを知っている全員」に変更してURLを貼ってください
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Row 2: エリア① プレビュー用コード（ファイル出品のみ） ─── */}
            {listingType === "file" && <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {/* ヘッダー */}
              <div className="flex items-start gap-3 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100">
                  <Globe className="h-4.5 w-4.5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-teal-800">
                    🌐 購入前の「仮体験エリア」で動作させるコード
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-teal-600">
                    購入検討者が詳細画面でポチポチ試せるプレビュー用コードです。製品版のロジックを隠した簡易UIなどを入力してください。
                  </p>
                </div>
              </div>

              <div className="p-6">
                {/* モバイル用タブ */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    ファイル名（例: <code className="rounded bg-gray-100 px-1 font-mono">index.html</code>）とコードをセットで入力
                  </span>
                  <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-0.5 sm:hidden">
                    <button type="button" onClick={() => setActiveTab("code")}
                      className={cn("flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-all",
                        activeTab === "code" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400")}>
                      <Code2 className="h-3 w-3" />コード
                    </button>
                    <button type="button" onClick={() => setActiveTab("preview")}
                      className={cn("flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-all",
                        activeTab === "preview" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400")}>
                      <Eye className="h-3 w-3" />プレビュー
                    </button>
                  </div>
                </div>

                {/* プレビューファイルリスト */}
                <div className={cn("flex flex-col gap-3", activeTab === "preview" ? "hidden sm:flex" : "flex")}>
                  {previewFiles.map((file, idx) => (
                    <div key={file.id} className="overflow-hidden rounded-xl border border-teal-100 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-teal-100 bg-teal-50/70 px-3 py-2">
                        <FileCode className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <input type="text" value={file.name}
                          onChange={(e) => updatePreviewName(idx, e.target.value)}
                          placeholder="ファイル名 (例: index.html)"
                          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-gray-700 outline-none placeholder:text-gray-400" />
                        {previewFiles.length > 1 && (
                          <button type="button" onClick={() => removePreviewFile(idx)} title="このファイルを削除"
                            className="rounded p-0.5 text-gray-400 transition-colors hover:bg-rose-100 hover:text-rose-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea rows={8} value={file.content}
                        onChange={(e) => updatePreviewContent(idx, e.target.value)}
                        placeholder={`<!DOCTYPE html>\n<html>\n<head><title>${file.name}</title></head>\n<body>\n  <!-- プレビュー用の簡易UIコードをここに -->\n</body>\n</html>`}
                        spellCheck={false}
                        className="w-full resize-y bg-amber-50 px-4 py-3 font-mono text-xs text-slate-800 outline-none placeholder:text-gray-400 focus:bg-amber-50/80" />
                    </div>
                  ))}

                  <button type="button" onClick={addPreviewFile}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 py-2.5 text-sm font-semibold text-teal-600 transition-all hover:border-teal-400 hover:bg-teal-50 active:scale-[0.99]">
                    <Plus className="h-4 w-4" />
                    ＋ プレビューファイルを追加
                  </button>

                  <button type="button" onClick={applyPreview}
                    className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-teal-700 active:scale-[0.98]">
                    <Eye className="h-4 w-4" />
                    プレビューを確認する（.html を反映）
                  </button>

                  {duplicateError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
                      <p className="text-xs font-semibold leading-relaxed text-rose-600">
                        {duplicateError}
                      </p>
                    </div>
                  )}
                </div>

                {/* ブラウザプレビュー */}
                <div className={cn("mt-4", activeTab === "code" ? "hidden sm:block" : "block")}>
                  <BrowserPreview html={previewHtml} />
                </div>
              </div>
            </div>}

            {/* ─── Row 3: エリア② 製品版コード（ファイル出品のみ） ─── */}
            {listingType === "file" && <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {/* ヘッダー */}
              <div className="flex items-start gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <Lock className="h-4.5 w-4.5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    🔒 購入者だけが閲覧・コピーできる製品版コード
                    <span className="ml-1 text-rose-500">*</span>
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    決済完了後、取引画面で初めて開示される本物のソースコードです。<span className="font-semibold text-slate-700">ここに入力したコードは購入前には絶対に表示されません。</span>
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 text-xs text-gray-400">
                  ファイル名（例: <code className="rounded bg-gray-100 px-1 font-mono">code.gs</code>、<code className="rounded bg-gray-100 px-1 font-mono">index.html</code>）とコードをセットで複数登録できます。
                </div>

                <div className="flex flex-col gap-3">
                  {productFiles.map((file, idx) => (
                    <div key={file.id} className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                        <FileCode className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <input type="text" value={file.name}
                          onChange={(e) => updateProductName(idx, e.target.value)}
                          placeholder="ファイル名 (例: code.gs)"
                          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-gray-700 outline-none placeholder:text-gray-400" />
                        {productFiles.length > 1 && (
                          <button type="button" onClick={() => removeProductFile(idx)} title="このファイルを削除"
                            className="rounded p-0.5 text-gray-400 transition-colors hover:bg-rose-100 hover:text-rose-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea rows={8} value={file.content}
                        onChange={(e) => updateProductContent(idx, e.target.value)}
                        placeholder={
                          file.name.endsWith(".html")
                            ? `<!DOCTYPE html>\n<html>\n<head><title>製品版</title></head>\n<body>\n  <!-- 製品版の本コードをここに -->\n</body>\n</html>`
                            : `// ${file.name} の製品版コードをここに貼り付けてください\n\nfunction main() {\n\n}`
                        }
                        spellCheck={false}
                        className="w-full resize-y bg-amber-50 px-4 py-3 font-mono text-xs text-slate-800 outline-none placeholder:text-gray-400 focus:bg-amber-50/80" />
                    </div>
                  ))}

                  <button type="button" onClick={addProductFile}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-[0.99]">
                    <Plus className="h-4 w-4" />
                    ＋ 製品版ファイルを追加
                  </button>

                  <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                    <span className="mt-0.5 text-sm">🔐</span>
                    <p className="text-xs leading-relaxed text-amber-800">
                      このエリアのコードは暗号化されて保管され、<span className="font-bold">決済完了後の取引ページのみ</span>で閲覧できます。購入前の詳細画面には一切表示されません。
                    </p>
                  </div>

                  {productCodeError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
                      <p className="text-xs font-semibold leading-relaxed text-rose-600">
                        ⚠️ {productCodeError}
                      </p>
                    </div>
                  )}

                  {duplicateError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
                      <p className="text-xs font-semibold leading-relaxed text-rose-600">
                        {duplicateError}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>}

            {/* ─── 確認画面へ進むボタン ─── */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              {duplicateError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
                  <p className="text-sm font-semibold leading-relaxed text-rose-600">
                    {duplicateError}
                  </p>
                  <p className="mt-1 text-xs text-rose-500">
                    コードを修正すると、この警告は自動的に消えます。
                  </p>
                </div>
              )}
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  入力内容を確認してから、AIによるセキュリティ審査に進みます。審査完了後にマーケットに掲載されます。
                </span>
              </div>
              <Button
                type="button"
                onClick={handleGoToConfirm}
                className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 text-base font-black text-white shadow-lg shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-green-600 hover:shadow-emerald-300 active:scale-[0.99]"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                入力内容を確認する →
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <CreatePageInner />
    </Suspense>
  );
}
