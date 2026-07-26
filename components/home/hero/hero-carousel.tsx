"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlidePublic } from "@/lib/hero/types";
import { cn } from "@/lib/utils";
import { HeroSlideRenderer } from "./hero-slide-renderer";

export function HeroCarousel({ slides }: { slides: HeroSlidePublic[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  if (total === 0) return null;

  const go = (next: number) => setIndex((next + total) % total);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[320px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              i === index ? "opacity-100 z-10" : "pointer-events-none opacity-0 z-0"
            )}
            aria-hidden={i !== index}
          >
            <HeroSlideRenderer slide={slide} />
          </div>
        ))}
      </div>

      {total > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 mx-auto max-w-6xl px-4 pb-4 sm:px-6">
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-4 py-2 backdrop-blur-md">
            <span className="shrink-0 text-xs tabular-nums tracking-wide text-white/80">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>

            <div className="flex flex-1 justify-center gap-1.5">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`スライド ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                />
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
                aria-label="前のスライド"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
                aria-label="次のスライド"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
