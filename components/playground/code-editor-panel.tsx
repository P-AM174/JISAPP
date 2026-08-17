"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSearch: boolean;
  onToggleSearch: (open: boolean) => void;
  matchCount: number;
  currentMatch: number;
  onJumpMatch: (direction: "next" | "prev") => void;
  className?: string;
};

/** leading-5 = 1.25rem。行番号と textarea で揃える */
const LINE_HEIGHT_PX = 20;

export function CodeEditorPanel({
  code,
  onChange,
  onKeyDown,
  placeholder,
  textareaRef,
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch,
  matchCount,
  currentMatch,
  onJumpMatch,
  className,
}: Props) {
  const lineNumRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lines = code.split("\n");
  const lineCount = Math.max(lines.length, 1);

  const syncLineNumbers = (scrollTop: number) => {
    if (lineNumRef.current) {
      lineNumRef.current.style.transform = `translateY(-${scrollTop}px)`;
    }
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    syncLineNumbers(e.currentTarget.scrollTop);
  };

  useLayoutEffect(() => {
    syncLineNumbers(textareaRef.current?.scrollTop ?? 0);
  }, [code, lineCount, textareaRef]);

  // 表示中のパネルだけ検索欄にフォーカス（モバイル/PCの二重マウント対策）
  useEffect(() => {
    if (!showSearch) return;
    const root = rootRef.current;
    if (!root || root.getClientRects().length === 0) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [showSearch]);

  return (
    <div
      ref={rootRef}
      className={cn("flex h-full min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => onToggleSearch(!showSearch)}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-colors",
            showSearch ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
          )}
        >
          <Search className="h-3 w-3" />
          検索
        </button>
        {showSearch && (
          <>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onJumpMatch(e.shiftKey ? "prev" : "next");
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onSearchChange("");
                  onToggleSearch(false);
                  textareaRef.current?.focus();
                }
              }}
              placeholder="コード内を検索..."
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-emerald-400"
            />
            {searchQuery.trim() && (
              <span className="shrink-0 text-[10px] text-gray-400">
                {matchCount > 0 ? `${currentMatch}/${matchCount}` : "0件"}
              </span>
            )}
            <button
              type="button"
              onClick={() => onJumpMatch("prev")}
              disabled={matchCount === 0}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              title="前へ"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onJumpMatch("next")}
              disabled={matchCount === 0}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
              title="次へ"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onToggleSearch(false);
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          aria-hidden
          className="relative min-h-0 shrink-0 self-stretch overflow-hidden border-r border-gray-100 bg-gray-50"
          style={{ minWidth: "2.5rem" }}
        >
          <div
            ref={lineNumRef}
            className="pointer-events-none py-3 pr-2 pl-2 text-right font-mono text-xs text-gray-400 select-none will-change-transform"
            style={{ lineHeight: `${LINE_HEIGHT_PX}px` }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className="overflow-hidden"
                style={{ height: LINE_HEIGHT_PX, lineHeight: `${LINE_HEIGHT_PX}px` }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-h-0 min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
            placeholder={placeholder}
            spellCheck={false}
            wrap="off"
            className="absolute inset-0 h-full w-full resize-none overflow-auto overscroll-contain whitespace-pre bg-white py-3 pr-3 pl-2 font-mono text-xs text-gray-800 outline-none placeholder:text-gray-400 [-webkit-overflow-scrolling:touch] touch-pan-y"
            style={{ lineHeight: `${LINE_HEIGHT_PX}px` }}
          />
        </div>
      </div>
    </div>
  );
}
