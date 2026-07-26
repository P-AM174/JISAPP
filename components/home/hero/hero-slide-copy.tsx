"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HERO_THEME_STYLES } from "@/lib/hero/themes";
import type { HeroSlidePublic } from "@/lib/hero/types";

export function HeroSlideCopy({
  slide,
  large = false,
  centered = false,
}: {
  slide: HeroSlidePublic;
  large?: boolean;
  centered?: boolean;
}) {
  const theme = HERO_THEME_STYLES[slide.theme];

  return (
    <div className={centered ? "text-center" : "text-center md:text-left"}>
      {slide.badge && (
        <div className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${theme.badgeDot}`} />
          {slide.badge}
        </div>
      )}
      <h1
        className={`font-black leading-snug tracking-tight text-white ${
          large ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl lg:text-3xl"
        }`}
      >
        {slide.title}
      </h1>
      <p className={`mt-2.5 max-w-xl text-sm leading-relaxed text-white/85 ${centered ? "mx-auto" : ""}`}>
        {slide.subtitle}
      </p>
      {slide.ctaEnabled && slide.ctaLabel && slide.ctaHref && (
        <Link
          href={slide.ctaHref}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold shadow-md transition hover:bg-emerald-50 active:scale-[0.98]"
        >
          <span className={theme.accent}>{slide.ctaLabel}</span>
          <ArrowRight className={`h-4 w-4 ${theme.accent}`} />
        </Link>
      )}
      <div className={`mt-4 flex flex-wrap gap-3 text-[11px] text-white/70 ${centered ? "justify-center" : "justify-center md:justify-start"}`}>
        <span>✓ プログラミング不要</span>
        <span>✓ サーバー設定ゼロ</span>
        <span>✓ AIコードを貼るだけ</span>
      </div>
    </div>
  );
}
