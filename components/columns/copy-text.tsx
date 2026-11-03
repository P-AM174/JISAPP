"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** 文をコピーするボタン（コラムのプロンプトなど） */
export function CopyText({ text, label = "コピー" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }).catch(() => {})}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm transition ${done ? "bg-emerald-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}>
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{done ? "コピーしました" : label}
    </button>
  );
}
