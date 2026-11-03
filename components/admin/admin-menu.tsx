"use client";

import { useEffect, useRef, useState } from "react";
import Link, { usePathname, useLocalizePath } from "@/lib/i18n/navigation";
import {
  BarChart3, Code2, LayoutTemplate, LogOut, Menu, PenLine, ShieldCheck, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; external?: boolean };

/** 管理画面どうしを行き来するメニュー（承認キューは使っていないので入れない） */
const ITEMS: Item[] = [
  { href: "/admin/review", label: "運営管理", icon: ShieldCheck },
  { href: "/admin/hero", label: "ヒーロー編集", icon: LayoutTemplate },
  { href: "/admin/columns", label: "コラム", icon: PenLine },
  { href: "/admin/analytics", label: "計測", icon: BarChart3 },
  { href: "/playground?official=1", label: "公式アプリを作る", icon: Code2, external: true },
];

/**
 * 右上の「☰」ボタンと、押すと開くメニュー。
 * onLogout を渡さないときは、ログアウトしたあと運営管理のログイン画面へ移る。
 */
export function AdminMenu({ onLogout, className }: { onLogout?: () => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const localize = useLocalizePath();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = async () => {
    setOpen(false);
    await fetch("/api/admin/login", { method: "DELETE" });
    if (onLogout) onLogout();
    else window.location.href = localize("/admin/review");
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <nav className="absolute right-0 top-11 z-[600] w-56 overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
          {ITEMS.map(({ href, label, icon: Icon, external }) => {
            const active = !external && (pathname === href || pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                  active ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
          <div className="my-1 h-px bg-gray-100" />
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            ログアウト
          </button>
        </nav>
      )}
    </div>
  );
}
