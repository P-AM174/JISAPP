"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

type BackButtonProps = {
  label?: React.ReactNode;
  fallbackHref?: string;
  className?: string;
  iconClassName?: string;
  hideLabelOnMobile?: boolean;
};

export function BackButton({
  label,
  fallbackHref = "/",
  className,
  iconClassName,
  hideLabelOnMobile = false,
}: BackButtonProps) {
  const router = useRouter();
  const t = useT();
  if (label === undefined) label = t("戻る", "Back");

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
