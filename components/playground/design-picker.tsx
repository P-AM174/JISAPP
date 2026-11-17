"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { DESIGN_TEMPLATES, type DesignId, type DesignTemplate } from "@/lib/playground/design-templates";

/**
 * 開発スタジオの「デザイン」：見本つきのカードを横に並べて選ぶ。
 * 見本のカードを押すと下から大きな見本が出て、「このデザインにする」で選ぶ。「指定しない」は押すとすぐ選ぶ。
 */
export function DesignPicker({ value, onChange }: { value: DesignId; onChange: (id: DesignId) => void }) {
  const t = useT();
  const [preview, setPreview] = useState<DesignTemplate | null>(null);
  const [pos, setPos] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);

  // 選んでいるカードが見える位置まで、最初に横へ送る（前に別のデザインを選んでいたとき）
  useEffect(() => {
    const row = rowRef.current;
    const el = row?.querySelector<HTMLElement>(`[data-design="${value}"]`);
    if (row && el) row.scrollLeft = Math.max(0, el.offsetLeft - 16);
    // 最初の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const row = rowRef.current;
    if (!row) return;
    const max = row.scrollWidth - row.clientWidth;
    setPos(max <= 0 ? 0 : Math.round((row.scrollLeft / max) * (DESIGN_TEMPLATES.length - 1)));
  };

  const choose = (d: DesignTemplate) => {
    if (d.id === "none") onChange(d.id);
    else setPreview(d);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{t("デザイン", "Design")}</span>
        <span className="text-[11px] text-slate-400">{t("見本を押すと大きく見られます", "Tap a sample to see it larger")}</span>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">{t("アプリの見た目を選べます。迷ったら「ジサップ」", "Pick how your app looks. Not sure? Choose Jisapp")}</p>

      <div
        ref={rowRef}
        onScroll={onScroll}
        role="radiogroup"
        aria-label={t("デザイン", "Design")}
        className="-mx-4 mt-2.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {DESIGN_TEMPLATES.map((d) => {
          const on = d.id === value;
          return (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={on}
              data-design={d.id}
              onClick={() => choose(d)}
              className={cn(
                "relative w-[132px] shrink-0 snap-start overflow-hidden rounded-2xl border-[1.5px] bg-white text-left transition touch-manipulation active:scale-[0.98]",
                on ? "border-emerald-500 ring-[3px] ring-emerald-100" : "border-slate-200 hover:border-slate-300"
              )}
            >
              {d.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image} alt="" loading="lazy" className="block h-[96px] w-full border-b border-slate-100 object-cover object-left-top" />
              ) : (
                <span className="flex h-[96px] items-center justify-center border-b border-slate-100 bg-slate-50 text-slate-400">
                  <Sparkles className="h-8 w-8" strokeWidth={2} />
                </span>
              )}
              {d.id === "jisapp" && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">{t("おすすめ", "Recommended")}</span>
              )}
              {on && (
                <span className="absolute right-1.5 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
              <span className="block px-2.5 pb-2.5 pt-2">
                <span className="block text-[13px] font-bold text-slate-800">{t(d.name, d.nameEn)}</span>
                <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-500">{t(d.fit, d.fitEn)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div aria-hidden className="mt-1.5 flex justify-center gap-1">
        {DESIGN_TEMPLATES.map((d, i) => (
          <span key={d.id} className={cn("h-1.5 rounded-full transition-all", i === pos ? "w-4 bg-emerald-500" : "w-1.5 bg-slate-300")} />
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        {t("いまは全部のデザインを無料で使えます（のちに一部は有料版の機能になる予定です）", "All designs are free for now (some may become paid features later)")}
      </p>

      {preview && (
        <DesignSheet
          d={preview}
          selected={preview.id === value}
          onClose={() => setPreview(null)}
          onPick={() => {
            onChange(preview.id);
            setPreview(null);
          }}
        />
      )}
    </div>
  );
}

/** 見本を大きく見る（下から出るシート） */
function DesignSheet({ d, selected, onClose, onPick }: { d: DesignTemplate; selected: boolean; onClose: () => void; onPick: () => void }) {
  const t = useT();
  const locale = useLocale();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[470] flex items-end justify-center bg-slate-900/30 backdrop-blur-[6px] sm:items-center sm:p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(d.name, d.nameEn)}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span aria-hidden className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {d.image && <img src={d.image} alt={t(`${d.name}の見本`, `${d.nameEn} sample`)} className="block w-full rounded-2xl border border-slate-200" />}
          <button type="button" onClick={onClose} aria-label={t("閉じる", "Close")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow ring-1 ring-slate-200">
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
        <h3 className="mt-3 text-xl font-bold text-slate-900">{t(d.name, d.nameEn)}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{t(d.fit, d.fitEn)}</p>
        <ul className="mt-2.5 divide-y divide-slate-100 text-[13px] text-slate-700">
          {(locale === "en" ? d.pointsEn : d.points).map((p) => (
            <li key={p} className="flex items-start gap-2 py-1.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.4} />
              {p}
            </li>
          ))}
        </ul>
        {d.id !== "jisapp" && (
          <p className="mt-2.5 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            {t("見本の画面は例です。できるアプリの中身や文字は、作りたいものに合わせて変わります", "The sample is just an example. Your app's content and words will match what you make")}
          </p>
        )}
        <button
          type="button"
          onClick={onPick}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          {selected ? t("このデザインのまま", "Keep this design") : t("このデザインにする", "Use this design")}
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">
          {t("閉じる", "Close")}
        </button>
      </div>
    </div>
  );
}
