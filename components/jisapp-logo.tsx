"use client";

import Link from "@/lib/i18n/navigation";
import { useLocale, useT } from "@/lib/i18n/client";
import { showViBeta } from "@/lib/features";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** トップバー用アイコン（背景透過・高解像度） */
export function JisappLogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-header.png"
      alt=""
      width={44}
      height={44}
      quality={100}
      unoptimized
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
      priority
    />
  );
}

type JisappLogoProps = {
  className?: string;
  href?: string;
  onClick?: () => void;
  size?: "default" | "lg";
};

/** アイコン＋「Jisapp」テキストのインラインロゴ */
export function JisappLogo({ className, href = "/", onClick, size = "default" }: JisappLogoProps) {
  const isLg = size === "lg";
  const t = useT();
  const locale = useLocale();
  const content = (
    <span className={cn("relative inline-flex items-center", isLg ? "h-12 gap-2.5" : "h-10 gap-2")}>
      <JisappLogoIcon className={cn("shrink-0", isLg ? "h-11 w-11" : "h-10 w-10")} />
      <span
        className={cn(
          "select-none font-bold tracking-[-0.03em] text-[#1D4242]",
          isLg ? "text-2xl" : "text-[17px] font-semibold tracking-[-0.02em]"
        )}
      >
        Jisapp
      </span>
      {/* ベトナム語版はネイティブの確認が済むまで Beta と表示する（lib/features.ts） */}
      {showViBeta(locale) && (
        // 幅を取らないよう、ロゴの右上に重ねる（スマホの狭いヘッダーではみ出さないように）
        <span className="pointer-events-none absolute -right-3 -top-0.5 rounded-full bg-amber-100 px-1 py-px text-[8px] font-bold uppercase leading-none tracking-wide text-amber-800 ring-1 ring-amber-200">
          Beta
        </span>
      )}
    </span>
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer transition-opacity hover:opacity-80",
        className
      )}
      aria-label={t("Jisapp トップページへ", "Jisapp home")}
    >
      {content}
    </Link>
  );
}
