import Link from "next/link";
import { cn } from "@/lib/utils";

/** 🌱3段ブロックのインラインSVGアイコン */
export function JisappLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* 下段ブロック */}
      <path d="M14 25.2 23.5 20 14 14.8 4.5 20 14 25.2Z" fill="#1A4242" />
      <path d="M4.5 20 14 25.2 14 30.4 4.5 25.2 4.5 20Z" fill="#153535" />
      <path d="M14 25.2 23.5 20 23.5 25.2 14 30.4 14 25.2Z" fill="#1F4F4F" />

      {/* 中段ブロック */}
      <path d="M14 18.8 23.5 13.6 14 8.4 4.5 13.6 14 18.8Z" fill="#1A4242" />
      <path d="M4.5 13.6 14 18.8 14 24 4.5 18.8 4.5 13.6Z" fill="#153535" />
      <path d="M14 18.8 23.5 13.6 23.5 18.8 14 24 14 18.8Z" fill="#1F4F4F" />

      {/* 上段ブロック（上面は白） */}
      <path d="M14 12.4 23.5 7.2 14 2 4.5 7.2 14 12.4Z" fill="#FFFFFF" stroke="#1A4242" strokeWidth="0.6" />
      <path d="M4.5 7.2 14 12.4 14 17.6 4.5 12.4 4.5 7.2Z" fill="#153535" />
      <path d="M14 12.4 23.5 7.2 23.5 12.4 14 17.6 14 12.4Z" fill="#1F4F4F" />

      {/* 芽 */}
      <path d="M14 2.2C13.2 1.1 13.4 0 14 0C14.6 0 14.8 1.1 14 2.2Z" fill="#86C9A1" />
      <ellipse cx="12.4" cy="1.1" rx="1.7" ry="1" fill="#86C9A1" transform="rotate(-28 12.4 1.1)" />
      <ellipse cx="15.6" cy="1.1" rx="1.7" ry="1" fill="#86C9A1" transform="rotate(28 15.6 1.1)" />
    </svg>
  );
}

type JisappLogoProps = {
  className?: string;
  href?: string;
  onClick?: () => void;
  size?: "default" | "lg";
};

/** アイコン＋「Jisapp」テキストのインラインロゴ */
export function JisappLogo({ className, href = "/", onClick, size = "default" }: JisappLogoProps) {
  const isLg = size === "lg";
  const content = (
    <span className={cn("inline-flex items-center", isLg ? "h-10 gap-2.5" : "h-8 max-h-9 gap-2")}>
      <JisappLogoIcon className={cn("shrink-0", isLg ? "h-10 w-[32px]" : "h-8 w-[26px]")} />
      <span
        className={cn(
          "select-none font-bold tracking-[-0.03em] text-[#1D4242]",
          isLg ? "text-2xl" : "text-[17px] font-semibold tracking-[-0.02em]"
        )}
      >
        Jisapp
      </span>
    </span>
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer transition-opacity hover:opacity-80",
        className
      )}
      aria-label="Jisapp トップページへ"
    >
      {content}
    </Link>
  );
}
