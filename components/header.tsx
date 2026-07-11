"use client";

import Link from "next/link";
import {
  Search,
  ChevronDown,
  Command,
  LayoutGrid,
  Calendar,
  FileSpreadsheet,
  Share2,
  Briefcase,
  Grid3X3,
  Terminal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories = [
  { label: "Excel・スプレッドシート", icon: FileSpreadsheet },
  { label: "事務効率化・データ入力", icon: Briefcase },
  { label: "Notion・各種テンプレート", icon: LayoutGrid },
  { label: "SNS・自動投稿ボット", icon: Share2 },
  { label: "店舗・シフト管理", icon: Calendar },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-primary">ジサップ</span>
            <div className="flex items-center gap-1 rounded bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              <Terminal className="h-3 w-3" />
              開発スタジオ
            </div>
          </Link>
        </div>

        {/* Search Bar with Category Dropdown */}
        <div className="hidden max-w-2xl flex-1 md:block">
          <div className="relative flex items-center">
            <div className="absolute top-0 bottom-0 left-0 flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-10 items-center gap-1.5 rounded-l-full border border-r-0 border-border bg-secondary px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden lg:inline">カテゴリ</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <DropdownMenuItem
                        key={cat.label}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {cat.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <input
              type="text"
              placeholder="シフト管理、Notion、自動LINEボットなどを検索..."
              className="h-10 w-full rounded-full border border-border bg-secondary pr-16 pl-28 text-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none lg:pl-36"
            />
            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/playground"
            className="hidden items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 sm:flex"
          >
            <Terminal className="h-4 w-4" />
            作る
          </Link>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-secondary">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Link href="/mypage" className="w-full">マイページ</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>購入履歴</DropdownMenuItem>
              <DropdownMenuItem>出品したツール</DropdownMenuItem>
              <DropdownMenuItem>設定</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-l-full border border-r-0 border-border bg-secondary text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Grid3X3 className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <DropdownMenuItem
                    key={cat.label}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {cat.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="text"
            placeholder="ツールを検索..."
            className="h-10 flex-1 rounded-r-full border border-l-0 border-border bg-secondary pr-10 pl-3 text-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
