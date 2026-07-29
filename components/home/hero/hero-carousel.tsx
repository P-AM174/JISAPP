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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[280px] overflow-hidden sm:min-h-[320px]">
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
        <div className="flex items-center justify-center gap-3 border-b border-gray-100 bg-white px-4 py-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            aria-label="前のスライド"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-emerald-500" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`スライド ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
              />
            ))}
          </div>

          <span className="min-w-[2.5rem] text-center text-[10px] tabular-nums text-gray-400">
            {index + 1}/{total}
          </span>

          <button
            type="button"
            onClick={() => go(index + 1)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            aria-label="次のスライド"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}
