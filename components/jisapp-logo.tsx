import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** トップバー用アイコン（背景透過・高解像度） */
export function JisappLogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-header.png"
      alt=""
      width={44}
      height={44}
      quality={100}
      unoptimized
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
      priority
    />
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
    <span className={cn("inline-flex items-center", isLg ? "h-12 gap-2.5" : "h-10 gap-2")}>
      <JisappLogoIcon className={cn("shrink-0", isLg ? "h-11 w-11" : "h-10 w-10")} />
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
