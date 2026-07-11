"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  label?: React.ReactNode;
  fallbackHref?: string;
  className?: string;
  iconClassName?: string;
  hideLabelOnMobile?: boolean;
};

export function BackButton({
  label = "戻る",
  fallbackHref = "/",
  className,
  iconClassName,
  hideLabelOnMobile = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600",
        className
      )}
    >
      <ChevronLeft className={cn("h-4 w-4", iconClassName)} />
      {typeof label === "string" ? (
        <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>{label}</span>
      ) : (
        label
      )}
    </button>
  );
}
