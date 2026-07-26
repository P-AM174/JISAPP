"use client";

import Link from "next/link";
import { CATEGORY_MAP } from "@/lib/categories";
import { HERO_BG_PATTERN_CLASS, HERO_THEME_STYLES } from "@/lib/hero/themes";
import type { HeroSlidePublic } from "@/lib/hero/types";
import { HeroSlideCopy } from "./hero-slide-copy";
import { HeroVisual } from "./hero-visual";
import { cn } from "@/lib/utils";

function HeroBackground({ slide }: { slide: HeroSlidePublic }) {
  const theme = HERO_THEME_STYLES[slide.theme];
  const pattern = slide.bgPattern ? HERO_BG_PATTERN_CLASS[slide.bgPattern] : "";

  return (
    <>
      <div className={cn("absolute inset-0 bg-gradient-to-br", theme.gradient)} />
      <div className={cn("pointer-events-none absolute inset-0", pattern)} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>
    </>
  );
}

export function HeroSlideTwoColumn({ slide }: { slide: HeroSlidePublic }) {
  return (
    <div className="relative min-h-[320px]">
      <HeroBackground slide={slide} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2">
        <HeroSlideCopy slide={slide} />
        <HeroVisual type={slide.visualType} />
      </div>
    </div>
  );
}

export function HeroSlideTheme({ slide }: { slide: HeroSlidePublic }) {
  return (
    <div className="relative min-h-[340px]">
      <HeroBackground slide={slide} />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <HeroSlideCopy slide={slide} large />
          <div className="scale-105 lg:scale-110">
            <HeroVisual type={slide.visualType ?? "summer"} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSlideCard({ slide }: { slide: HeroSlidePublic }) {
  const theme = HERO_THEME_STYLES[slide.theme];
  const apps = slide.featuredApps ?? [];

  return (
    <div className="relative min-h-[360px]">
      <HeroBackground slide={slide} />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-3xl bg-white/10 p-6 backdrop-blur-md ring-1 ring-white/25 shadow-2xl sm:p-8">
          <div className="max-w-2xl">
            <HeroSlideCopy slide={slide} />
          </div>
          {apps.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {apps.slice(0, 3).map((app) => {
                const cat = app.category ? CATEGORY_MAP[app.category] : null;
                return (
                  <Link
                    key={app.id}
                    href={`/apps/${app.id}`}
                    className="group rounded-2xl bg-white/95 p-3 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div
                      className={cn(
                        "mb-2 flex h-16 items-center justify-center rounded-xl bg-gradient-to-br text-2xl",
                        cat?.gradient ?? "from-emerald-500 to-teal-600"
                      )}
                    >
                      {cat?.emoji ?? "✨"}
                    </div>
                    <p className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                      {app.title}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-emerald-600">FREE</p>
                  </Link>
                );
              })}
            </div>
          )}
          {!apps.length && (
            <p className={`mt-4 text-xs text-white/70`}>
              アプリ未指定時は人気アプリを自動表示します
            </p>
          )}
        </div>
        <p className="sr-only">{theme.label}</p>
      </div>
    </div>
  );
}

export function HeroSlideRenderer({ slide }: { slide: HeroSlidePublic }) {
  switch (slide.layout) {
    case "card":
      return <HeroSlideCard slide={slide} />;
    case "theme":
      return <HeroSlideTheme slide={slide} />;
    default:
      return <HeroSlideTwoColumn slide={slide} />;
  }
}
