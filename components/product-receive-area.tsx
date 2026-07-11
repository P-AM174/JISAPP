"use client";

import { ExternalLink, Check, Copy, FileText, Blocks, Globe } from "lucide-react";
import { useState } from "react";
import type { ProductType } from "@/lib/products/types";
import { PRODUCT_TYPE_LABELS } from "@/lib/products/types";

type ProductReceiveAreaProps = {
  productType: ProductType;
  sourceUrl: string;
  title?: string;
};

const RECEIVE_CONFIG: Record<
  ProductType,
  {
    label: string;
    sub: string;
    note?: string;
    icon: typeof ExternalLink;
    gradient: string;
  }
> = {
  google: {
    label: "Googleドライブにアプリをコピーする（ワンタッチ）",
    sub: "ボタンを押すと Google のコピー画面が開き、あなたのドライブに複製できます",
    icon: Copy,
    gradient: "from-emerald-600 to-green-600",
  },
  notion: {
    label: "Notionにテンプレートを複製する",
    sub: "Notion の共有ページが開きます",
    note: "💡 ページ右上の「…」→「Duplicate（複製）」を押すと、ワンタッチで自分のワークスペースにコピーできます",
    icon: FileText,
    gradient: "from-gray-800 to-gray-900",
  },
  replit: {
    label: "ReplitでコードをFork（複製）する",
    sub: "Replit のテンプレートページが開きます",
    note: "💡 ページ上部の「Fork」ボタンを押すと、自分のアカウントに複製されます",
    icon: Blocks,
    gradient: "from-orange-500 to-amber-600",
  },
  generic: {
    label: "共有リンクを開く",
    sub: "出品者が設定したリンク先に移動します",
    icon: Globe,
    gradient: "from-blue-600 to-indigo-600",
  },
};

export function ProductReceiveArea({
  productType,
  sourceUrl,
  title,
}: ProductReceiveAreaProps) {
  const [opened, setOpened] = useState(false);
  const cfg = RECEIVE_CONFIG[productType];
  const Icon = cfg.icon;

  const handleOpen = () => {
    window.open(sourceUrl, "_blank", "noopener,noreferrer");
    setOpened(true);
    setTimeout(() => setOpened(false), 4000);
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          {PRODUCT_TYPE_LABELS[productType]}
        </span>
        {title && (
          <span className="text-xs text-gray-500 truncate max-w-[200px]">{title}</span>
        )}
      </div>

      <button
        type="button"
        onClick={handleOpen}
        className={`w-full rounded-2xl py-4 text-sm font-black shadow-lg transition-all active:scale-[0.98] ${
          opened
            ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300"
            : `bg-gradient-to-r ${cfg.gradient} text-white hover:opacity-95`
        }`}
      >
        <div className="flex items-center justify-center gap-2 px-2">
          {opened ? <Check className="h-5 w-5 shrink-0" /> : <Icon className="h-5 w-5 shrink-0" />}
          <span>{opened ? "リンクを開きました！新しいタブを確認してください" : cfg.label}</span>
          {!opened && <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />}
        </div>
        {!opened && (
          <p className="mt-1.5 text-xs font-normal opacity-80">{cfg.sub}</p>
        )}
      </button>

      {cfg.note && (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600 ring-1 ring-gray-100">
          {cfg.note}
        </p>
      )}

      <p className="mt-3 break-all font-mono text-[10px] text-gray-400">{sourceUrl}</p>
    </section>
  );
}
