"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  lineNumRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showSearch: boolean;
  onToggleSearch: (open: boolean) => void;
  matchCount: number;
  currentMatch: number;
  onJumpMatch: (direction: "next" | "prev") => void;
  className?: string;
};

export function CodeEditorPanel({
  code,
  onChange,
  onKeyDown,
  placeholder,
  textareaRef,
  lineNumRef,
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch,
  matchCount,
  currentMatch,
  onJumpMatch,
  className,
}: Props) {
  const lines = code.split("\n");
  const lineCount = Math.max(lines.length, 1);

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumRef.current) {
      lineNumRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
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
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
          ref={lineNumRef}
          aria-hidden
          className="shrink-0 overflow-hidden border-r border-gray-100 bg-gray-50 py-3 pr-2 pl-2 text-right font-mono text-[10px] leading-5 text-gray-400 select-none"
          style={{ minWidth: "2.5rem" }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          placeholder={placeholder}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none bg-white py-3 pr-3 pl-2 font-mono text-xs leading-5 text-gray-800 outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
